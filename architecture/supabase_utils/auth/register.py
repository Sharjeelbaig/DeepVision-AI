from supabase_utils.main import supabase_client
def registerUser(email: str, password: str, data: dict = {"name": "", "bio": ""}):
    try:
        reg = supabase_client.auth.sign_up({
            "email": email,
            "password": password,
        })
        is_user_verified = reg.user.user_metadata.get("email_verified") == None
        if is_user_verified == False:
            return {"success": False, "error": "User exists but not verified."}
        is_user_data_added = len(supabase_client.table("user_data").select("*").eq("email", email).execute().data) == 1
        if is_user_data_added is False:
            supabase_client.table("user_data").insert({
                    "email": email,
                    "name": data.get("name", ""),
                    "bio": data.get("bio", "")
                }).execute()
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": True}