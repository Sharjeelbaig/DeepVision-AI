from ..main import supabase_client
import base64, io

def uploadFaceImage(email: str, base64_image: str):
    b64 = base64_image
    b64 = b64.split(",", 1)[-1]
    data = base64.b64decode(b64)
    supabase_client.storage.from_("user_data_bucket").remove(["public/" + email + "/face.jpg"])
    try:
        supabase_client.storage.from_("user_data_bucket").upload("public/" + email + "/face.jpg", file=data)
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    

def uploadFaceImageToSystem(system_id: str, base64_image: str, face_id: str):
    b64 = base64_image
    b64 = b64.split(",", 1)[-1]
    data = base64.b64decode(b64)
    supabase_client.storage.from_("system_faces_bucket").remove(["public/" + system_id + "/" + face_id + ".jpg"])
    try:
        supabase_client.storage.from_("system_faces_bucket").upload("public/" + system_id + "/" + face_id + ".jpg", file=data)
        return {"success": True, "url": supabase_client.storage.from_("system_faces_bucket").get_public_url("public/" + system_id + "/" + face_id + ".jpg")}
    except Exception as e:
        return {"success": False, "error": str(e)}

def uploadImageToDetectSafetyMeasure(system_id: str, base64_image: str):
    b64 = base64_image
    b64 = b64.split(",", 1)[-1]
    data = base64.b64decode(b64)
    supabase_client.storage.from_("system_monitored_images_bucket").remove(["public/" + system_id + "/image.jpg"])
    try:
        supabase_client.storage.from_("system_monitored_images_bucket").upload("public/" + system_id + "/image.jpg", file=data)
        return {"success": True, "url": supabase_client.storage.from_("system_monitored_images_bucket").get_public_url("public/" + system_id + "/image.jpg")}
    except Exception as e:
        return {"success": False, "error": str(e)}


__all__ = ["uploadFaceImage", "uploadImageToDetectSafetyMeasure"]

