from ..main import supabase_client

def getUserProfile(user_id: str):
    res = supabase_client.table("user_data").select("*").eq("id", user_id).single().execute()
    return res.data

def getSystemInfo(user_id: str):
    res = supabase_client.table("systems_data").select("*").eq("owner_id", user_id).execute()
    return res.data
