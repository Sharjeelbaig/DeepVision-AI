from supabase_utils.main import supabase_client

def getUserProfile(user_id: str):
    res = supabase_client.table("user_data").select("*").eq("id", user_id).single().execute()
    return res.data

def getSystemInfo(system_id: str):
    res = supabase_client.table("system_data").select("*").eq("id", system_id).single().execute()
    return res.data
