from supabase_utils.main import supabase_client
def registerUser(email: str, password: str):
    res = supabase_client.auth.sign_up({
        "email": email,
        "password": password
    })
    return res

