from supabase_utils.main import supabase_client

def getUserProfile():
    user = supabase_client.auth.get_user().user
    session = supabase_client.auth.get_session()
    if user is None:
        return None
    user_data = supabase_client.table("user_data").select("*").eq("email", user.email).execute().data
    user_data[0]["access_token"] = session.access_token
    return user_data[0]