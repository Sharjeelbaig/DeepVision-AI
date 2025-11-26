from ..main import supabase_client
def create_system(user_id: str, system_name: str):
    res = supabase_client.table("systems_data").insert({
        "owner_id": user_id,
        "system_name": system_name
    }).execute()
    return res.data
