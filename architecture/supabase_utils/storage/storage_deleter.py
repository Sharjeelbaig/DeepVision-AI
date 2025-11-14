from ..main import supabase_client

def deleteFaceImage(email):
    try:
        path = f"public/{email}/face.jpg"
        supabase_client.storage.from_("user_data_bucket").remove([path])
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}