from ..main import supabase_client

def getFaceImage(email):
    try:
        url = supabase_client.storage.from_('user_data_bucket').get_public_url("public/" + email + "/face.jpg")
        return {"success": True, "url": url}
    except Exception as e:
        return {"success": False, "error": str(e)}