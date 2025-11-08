from supabase_utils.main import supabase_client

def logoutUser():
    res = supabase_client.auth.sign_out()
    return res