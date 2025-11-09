from supabase_utils.main import supabase_client
def updateUserImage(user_id: int, image_url: str):
    res = supabase_client.table("user_data").update({
        "image_url": image_url
    }).eq("id", user_id).execute()
    return res

def updateUserName(user_id: int, new_name: str):
    res = supabase_client.table("user_data").update({
        "name": new_name
    }).eq("id", user_id).execute()
    return res

def updateUserBio(user_id: int, new_bio: str):
    res = supabase_client.table("user_data").update({
        "bio": new_bio
    }).eq("id", user_id).execute()
    return res