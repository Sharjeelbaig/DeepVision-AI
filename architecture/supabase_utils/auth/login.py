from supabase_utils.main import supabase_client

def loginUser(email: str, password: str):
    try:
        supabase_client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        return {"success": True,}
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": True}
    