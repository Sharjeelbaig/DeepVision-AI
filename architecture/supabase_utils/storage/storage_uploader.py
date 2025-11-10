from supabase_utils.main import supabase_client
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



