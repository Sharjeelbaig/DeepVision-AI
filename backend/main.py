import base64
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

from flask import Flask, request
from flask_cors import CORS
import requests
from requests import RequestException

# Add parent directory to path to import architecture module
sys.path.insert(0, str(Path(__file__).parent.parent))

from architecture.supabase_utils.auth.login import loginUser
from architecture.supabase_utils.auth.register import registerUser
from architecture.facecomparer_utils.compare import recognizeFace
from architecture.supabase_utils.storage.storage_uploader import uploadFaceImage, uploadFaceImageToSystem, uploadImageToDetectSafetyMeasure
from architecture.supabase_utils.storage.storage_deleter import deleteFaceImage, deleteFaceImageFromSystem
from architecture.supabase_utils.db.data_reader import getUserProfile, getSystemInfo
from architecture.supabase_utils.db.data_writer import create_system
from architecture.supabase_utils.db.data_deleter import deleteFaceFromSystem
from architecture.supabase_utils.db.data_updater import updateFaceToSystem, alertSystem, addRoomCode, addMonitoredImageURL, addMonitoredDataJSONB, updateUserBio, updateUserImage, updateUserName
from architecture.supabase_utils.main import supabase_client
from architecture.utils.b64_to_image import base64_to_image
from architecture.transformers_utils.main import predict_safety_measure
from supabase_auth.types import Options


def _normalize_base64_payload(image_data: str) -> str:
    """Strip data URI metadata and return a pure base64 string."""
    _, _, data = image_data.partition(",")
    cleaned = (data or image_data).strip()
    return cleaned


def _download_image_as_base64(image_url: str) -> str:
    """Download an image URL and return its base64 representation."""
    response = requests.get(image_url, timeout=10)
    response.raise_for_status()
    return base64.b64encode(response.content).decode("utf-8")


def _format_face_result(raw_result: Any) -> Dict[str, Any]:
    """Normalize recognizer output to the frontend response contract."""
    if isinstance(raw_result, dict):
        if "isMatch" in raw_result and "confidence" in raw_result:
            return raw_result  # Already in expected shape
        if "success" in raw_result:
            is_match = bool(raw_result.get("success"))
            return {
                "isMatch": is_match,
                "confidence": 1.0 if is_match else 0.0,
                "result": raw_result.get("result"),
            }
    result_text = str(raw_result)
    is_match = result_text.strip().upper() == "OK"
    return {
        "isMatch": is_match,
        "confidence": 1.0 if is_match else 0.0,
        "result": result_text,
    }


def _coerce_system_identifier(system_id: Any) -> Any:
    """Best-effort conversion so Supabase lookups work with str or int IDs."""
    if isinstance(system_id, str):
        candidate = system_id.strip()
        if candidate.isdigit():
            try:
                return int(candidate)
            except ValueError:
                return candidate
        return candidate
    return system_id


def _resolve_system_id(system_id: Any, room_code: Optional[str]) -> Any:
    """Resolve a system identifier using either a direct ID or a room code."""
    if system_id is not None and str(system_id).strip():
        return _coerce_system_identifier(system_id)

    if not isinstance(room_code, str) or not room_code.strip():
        raise ValueError("system_id or room_code required")

    normalized_code = room_code.strip()
    try:
        response = (
            supabase_client
            .table("systems_data")
            .select("id")
            .eq("room_code", normalized_code)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        raise RuntimeError(f"Failed to resolve system by room_code: {exc}") from exc

    data = getattr(response, "data", None)
    if isinstance(data, list):
        record = data[0] if data else None
    else:
        record = data

    system_record_id = record.get("id") if isinstance(record, dict) else None
    if system_record_id is None:
        raise LookupError("system not found for provided room_code")

    return _coerce_system_identifier(system_record_id)


def _fetch_system_faces(system_id: Any) -> List[Dict[str, Any]]:
    identifier = _coerce_system_identifier(system_id)
    try:
        response = (
            supabase_client
            .table("systems_data")
            .select("faces")
            .eq("id", identifier)
            .single()
            .execute()
        )
    except Exception as exc:
        print(f"Failed to fetch faces for system {system_id}: {exc}")
        return []

    record = getattr(response, "data", None)
    if not isinstance(record, dict):
        return []

    faces = record.get("faces") or []
    if not isinstance(faces, list):
        return []

    return [face for face in faces if isinstance(face, dict)]


def _compare_system_faces(system_id: Any, capture_base64: str) -> List[Dict[str, Any]]:
    matches: List[Dict[str, Any]] = []
    if not capture_base64:
        return matches

    faces = _fetch_system_faces(system_id)
    for face in faces:
        face_url = face.get("face_url")
        if not isinstance(face_url, str) or not face_url.strip():
            continue

        name = face.get("name_of_person") if isinstance(face.get("name_of_person"), str) else None
        face_id = face.get("face_id")
        face_identifier = str(face_id) if face_id is not None else None

        try:
            raw_result = recognizeFace(face_url, capture_base64)
            formatted = _format_face_result(raw_result)
            match_payload = {
                "face_id": face_identifier,
                "name_of_person": name,
                "face_url": face_url,
                **formatted,
            }
        except RequestException as exc:
            match_payload = {
                "face_id": face_identifier,
                "name_of_person": name,
                "face_url": face_url,
                "isMatch": False,
                "confidence": 0.0,
                "error": f"Face asset fetch failed: {exc}",
            }
        except Exception as exc:
            match_payload = {
                "face_id": face_identifier,
                "name_of_person": name,
                "face_url": face_url,
                "isMatch": False,
                "confidence": 0.0,
                "error": str(exc),
            }

        matches.append(match_payload)

    return matches


def _merge_detections_with_faces(detections: Any, face_matches: List[Dict[str, Any]]) -> Any:
    matches_payload = [dict(match) for match in face_matches]

    if isinstance(detections, list):
        normalized: List[Dict[str, Any]] = []
        for item in detections:
            if isinstance(item, dict):
                normalized.append({**item})
            else:
                normalized.append({"value": item})

        if normalized:
            normalized[0]["recognized_faces"] = matches_payload
        else:
            normalized.append({
                "label": None,
                "score": None,
                "box": None,
                "recognized_faces": matches_payload,
            })

        return normalized

    if isinstance(detections, dict):
        merged = {**detections}
        merged["recognized_faces"] = matches_payload
        return merged

    return {"recognized_faces": matches_payload}


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=False)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/auth/login', methods=['POST'])
def login_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        return {"error": "email and password required"}, 400

    return loginUser(email=email, password=password)


@app.route('/auth/register', methods=['POST'])
def register_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    password = payload.get('password')
    profile = payload.get('profile') or {}

    if not email or not password:
        return {"error": "email and password required"}, 400

    result = registerUser(email=email, password=password, data=profile)
    status_code = 200 if result.get('success') else 400
    return result, status_code


@app.route('/face/recognize', methods=['POST'])
def recognize_face_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    image_data = payload.get('image_data')
    image_url_1 = payload.get('image_url_1')
    image_url_2 = payload.get('image_url_2')

    # Preferred flow: verify a captured frame against the user's stored face.
    if email and image_data:
        try:
            storage_path = f"public/{email}/face.jpg"
            stored_face_url = (
                supabase_client.storage
                .from_("user_data_bucket")
                .get_public_url(storage_path)
            )

            webcam_base64 = _normalize_base64_payload(image_data)
            raw_result = recognizeFace(stored_face_url, webcam_base64)
            return _format_face_result(raw_result), 200
        except RequestException as exc:
            return {"error": f"Failed to reach storage asset: {exc}"}, 502
        except Exception as exc:
            return {"error": str(exc)}, 500

    # Legacy flow: accept two public URLs directly.
    if image_url_1 and image_url_2:
        try:
            base64_image = _download_image_as_base64(image_url_2)
            raw_result = recognizeFace(image_url_1, base64_image)
            return _format_face_result(raw_result), 200
        except RequestException as exc:
            return {"error": f"Failed to download comparison image: {exc}"}, 502
        except Exception as exc:
            return {"error": str(exc)}, 500

    return {
        "error": "Provide email and image_data or both image_url_1 and image_url_2"
    }, 400


@app.route('/face/add', methods=['POST'])
def add_face_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    image_data = payload.get('image_data')

    if not email or not image_data:
        return {"error": "email and image_data required"}, 400

    result = uploadFaceImage(email=email, base64_image=image_data)
    status_code = 200 if result.get('success') else 400
    return result, status_code


@app.route('/users/<user_id>/profile', methods=['GET'])
def user_profile_route(user_id: str):
    try:
        profile = getUserProfile(user_id)
    except Exception as exc:
        return {"error": str(exc)}, 500

    if not profile:
        return {"error": "user not found"}, 404

    return {"data": profile}, 200


@app.route('/users/profile', methods=['GET'])
def user_profile_by_email():
    email = request.args.get('email')
    if not email:
        return {"error": "email query parameter required"}, 400

    try:
        response = (
            supabase_client
            .table("user_data")
            .select("*")
            .eq("email", email)
            .single()
            .execute()
        )
        profile = response.data if response else None
    except Exception as exc:
        return {"error": str(exc)}, 500

    if not profile:
        return {"error": "user not found"}, 404

    return {"data": profile}, 200


@app.route('/auth/reset-password', methods=['POST'])
def reset_password_route():
    payload = request.get_json() or {}
    user_id = payload.get('user_id')
    new_password = payload.get('new_password')

    if not user_id or not new_password:
        return {"error": "user_id and new_password required"}, 400

    try:
        supabase_client.auth.admin.update_user_by_id(
            user_id,
            {"password": new_password}
        )
        return {"success": True}, 200
    except Exception as exc:
        return {"success": False, "error": str(exc)}, 400


@app.route('/auth/send-reset-link', methods=['POST'])
def send_reset_link_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    redirect_to: Optional[str] = payload.get('redirect_to')

    if not email:
        return {"error": "email required"}, 400

    try:
        options: Optional[Options] = {"redirect_to": redirect_to} if redirect_to else None
        supabase_client.auth.reset_password_for_email(email, options)
        return {"success": True}, 200
    except Exception as exc:
        return {"success": False, "error": str(exc)}, 400
    
@app.route('/systems/create-system', methods=['POST'])
def create_system_route():
    payload = request.get_json() or {}
    user_id = payload.get('user_id')
    system_name = payload.get('system_name')

    if not user_id or not system_name:
        return {"error": "user_id and system_name required"}, 400

    try:
        system = create_system(user_id=user_id, system_name=system_name)
        return {"data": system}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500

@app.route('/systems/info', methods=['POST'])
def get_system_route():
    payload = request.get_json() or {}
    user_id = payload.get('user_id')

    if not user_id:
        return {"error": "user_id required"}, 400
    try:
        system = getSystemInfo(user_id)
    except Exception as exc:
        return {"error": str(exc)}, 500

    if not system:
        return {"error": "system not found"}, 404

    return {"data": system}, 200

@app.route('/systems/add-face', methods=['POST'])
def add_face_to_system_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    face_base64 = payload.get('face_base64')
    name_of_person = payload.get('name_of_person')
    if not system_id or not face_base64 or not name_of_person:
        return {"error": "system_id, face_base64 and name_of_person required"}, 400
    try:
        upload = uploadFaceImageToSystem(system_id=str(system_id), base64_image=face_base64, face_id=str(system_id)+"_"+name_of_person)
        stored_face_url = upload.get('url') if isinstance(upload, dict) else None
        if not isinstance(stored_face_url, str) or not stored_face_url.strip():
            return {"error": "Failed to persist face image"}, 500

        result = updateFaceToSystem(system_id=system_id, face_url=stored_face_url, name_of_person=name_of_person)
        return {"data": result}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    
@app.route('/systems/remove-face', methods=['POST'])
def remove_face_from_system_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    face_id = payload.get('face_id')

    if not system_id or not face_id:
        return {"error": "system_id and face_id required"}, 400

    try:
        # First delete the face image from storage
        delete_result = deleteFaceImageFromSystem(system_id=system_id, face_id=face_id)
        if not delete_result.get('success'):
            return {"error": f"Failed to delete face image: {delete_result.get('error')}"}, 500

        # Then delete the face record from the database
        result = deleteFaceFromSystem(system_id=system_id, face_id=face_id)
        return {"data": result}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    

@app.route('/systems/delete-face', methods=['POST'])
def delete_face_from_system_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    face_id = payload.get('face_id')

    if not system_id or not face_id:
        return {"error": "system_id and face_id required"}, 400

    try:
        result = deleteFaceFromSystem(system_id=system_id, face_id=face_id)
        return {"data": result}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    
@app.route('/systems/alert', methods=['POST'])
def alert_system_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    room_code = payload.get('room_code')
    alert_status = payload.get('alert_status')

    if alert_status is None:
        return {"error": "alert_status required"}, 400

    try:
        resolved_system_id = _resolve_system_id(system_id, room_code)
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except LookupError as exc:
        return {"error": str(exc)}, 404
    except Exception as exc:
        return {"error": str(exc)}, 500

    try:
        result = alertSystem(system_id=resolved_system_id, alert_status=alert_status)
        return {"data": result}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    
@app.route('/systems/capture', methods=['POST'])
def capture_safety_measure_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    room_code = payload.get('room_code')
    image_data = payload.get('base64_image')
    if not image_data:
        return {"error": "base64_image required"}, 400

    try:
        resolved_system_id = _resolve_system_id(system_id, room_code)
    except ValueError as exc:
        return {"error": str(exc)}, 400
    except LookupError as exc:
        return {"error": str(exc)}, 404
    except Exception as exc:
        return {"error": str(exc)}, 500

    numeric_system_id = resolved_system_id
    try:
        numeric_system_id = int(numeric_system_id)
    except (ValueError, TypeError):
        return {"error": "invalid system_id"}, 400

    try:
        normalized_frame_b64 = _normalize_base64_payload(image_data)
        image = base64_to_image(normalized_frame_b64)

        storage_system_id = str(numeric_system_id)
        upload = uploadImageToDetectSafetyMeasure(system_id=storage_system_id, base64_image=image_data)
        upload_success = isinstance(upload, dict) and upload.get('success') is True
        upload_url = upload.get('url') if isinstance(upload, dict) else None
        if not upload_success:
            error_detail = upload.get('error') if isinstance(upload, dict) else "unknown upload response"
            raise ValueError(f"Failed to upload monitored image: {error_detail}")
        if isinstance(upload_url, str) and upload_url.strip():
            addMonitoredImageURL(system_id=numeric_system_id, image_url=upload_url)

        detections = predict_safety_measure(image=image.convert("RGB"))
        face_matches = _compare_system_faces(system_id=numeric_system_id, capture_base64=normalized_frame_b64)
        combined_payload = _merge_detections_with_faces(detections, face_matches)

        addMonitoredDataJSONB(system_id=numeric_system_id, data=combined_payload)
        return {"data": combined_payload}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    
@app.route('/systems/add-room-code', methods=['POST'])
def add_room_code_route():
    payload = request.get_json() or {}
    system_id = payload.get('system_id')
    room_code = payload.get('room_code')

    if not system_id or not room_code:
        return {"error": "system_id and room_code required"}, 400

    try:
        result = addRoomCode(system_id=system_id, room_code=room_code)
        return {"data": result}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500
    

@app.route('/users/update-info', methods=['POST'])
def update_user_info_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    bio = payload.get('bio')
    name = payload.get('name')
    base64_image = payload.get('base64_image')

    if not isinstance(email, str) or not email.strip():
        return {"error": "email required"}, 400

    try:
        user_lookup = (
            supabase_client
            .table("user_data")
            .select("id")
            .eq("email", email.strip())
            .single()
            .execute()
        )
        user_record = getattr(user_lookup, "data", None)
        user_id = user_record.get("id") if isinstance(user_record, dict) else None
    except Exception as exc:
        return {"error": f"Failed to resolve user: {str(exc)}"}, 500

    if user_id is None:
        return {"error": "user not found"}, 404

    try:
        numeric_user_id = int(user_id)
    except (ValueError, TypeError):
        return {"error": "invalid user id"}, 500

    if base64_image:
        image_upload = uploadFaceImage(email=email, base64_image=base64_image)
        if not image_upload.get('success'):
            return {"error": f"Failed to upload image: {image_upload.get('error')}"}, 500
        else:
            image_url = image_upload.get('url')
            if isinstance(image_url, str):
                try:
                    updateUserImage(user_id=numeric_user_id, image_url=image_url)
                except Exception as exc:
                    return {"error": f"Failed to update user image URL: {str(exc)}"}, 500
    try:
        if isinstance(bio, str):
            updateUserBio(user_id=numeric_user_id, new_bio=bio)
        if isinstance(name, str):
            updateUserName(user_id=numeric_user_id, new_name=name)
        return {"success": True}, 200
    except Exception as exc:
        return {"error": str(exc)}, 500


if __name__ == "__main__":
    app.run(debug=True)
    