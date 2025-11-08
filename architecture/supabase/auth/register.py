from ..main import supabase_client
def register_user(email: str, password: str):
    res = supabase_client.auth.sign_up({
        "email": email,
        "password": password
    })
    return res

