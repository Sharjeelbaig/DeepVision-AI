import base64
import sys
from pathlib import Path
from typing import Any, Dict, Optional

from flask import Flask, request
from flask_cors import CORS
import requests
from requests import RequestException

# Add parent directory to path to import architecture module
sys.path.insert(0, str(Path(__file__).parent.parent))

from architecture.supabase_utils.auth.login import loginUser
from architecture.supabase_utils.auth.register import registerUser
from architecture.facecomparer_utils.compare import recognizeFace
from architecture.supabase_utils.storage.storage_uploader import uploadFaceImage
from architecture.supabase_utils.db.data_reader import getUserProfile
from architecture.supabase_utils.main import supabase_client
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

if __name__ == "__main__":
    app.run(debug=True)
    