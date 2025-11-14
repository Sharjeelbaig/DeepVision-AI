from ..main import supabase_client
def registerUser(email: str, password: str, data: dict = {"name": "", "bio": ""}):
    try:
        supabase_client.rpc("check_user_verification", {"p_email": email}).execute()
        supabase_client.auth.sign_up({
            "email": email,
            "password": password,
        })
        supabase_client.rpc("create_user_profile", {
            "p_email": email,
            "p_name": data.get("name", ""),
            "p_bio": data.get("bio", "")
        }).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": True}