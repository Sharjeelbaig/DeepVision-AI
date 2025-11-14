from ..main import supabase_client

def getAccessToken():
    session = supabase_client.auth.get_session()
    return session.access_token

def getRefreshToken():
    session = supabase_client.auth.get_session()
    return session.refresh_token

def getCurrentUser():
    user = supabase_client.auth.get_user().user
    return user

