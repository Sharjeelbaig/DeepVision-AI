from ..main import supabase_client

def deleteFaceImage(email):
    try:
        path = f"public/{email}/face.jpg"
        supabase_client.storage.from_("user_data_bucket").remove([path])
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    
def deleteFaceImageFromSystem(system_id, face_id):
    try:
        path = f"public/{system_id}/{face_id}.jpg"
        supabase_client.storage.from_("system_faces_bucket").remove([path])
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

__all__ = ["deleteFaceImage", "deleteFaceImageFromSystem"]