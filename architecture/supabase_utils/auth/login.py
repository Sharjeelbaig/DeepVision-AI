from ..main import supabase_client

def loginUser(email: str, password: str):
    try:
        user = supabase_client.auth.sign_in_with_password({
            "email": email,
            "password": password
        })
        token = supabase_client.auth.get_session().access_token
        return {"success": True,
                 "token": token,
                 "user": user.user.dict()
                 }
    except Exception as e:
        return {"success": False, "error": str(e)}
    return {"success": True}

    