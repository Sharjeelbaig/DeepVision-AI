# Authentication Architecture
Authentication in the Supabase layer of the Deep Vision project is designed to manage user access and profile information efficiently. This module contains functions for `user registration`, `login`, `logout`, and `profile retrieval`, in the following files:
- `register.py`: Contains the `registerUser` function to handle new user registrations and create user profiles in the `user_data` table.
- `login.py`: Contains the `loginUser` function to authenticate users and initiate sessions.
- `logout.py`: Contains the `logoutUser` function to end user sessions.
- `session.py`: Contains helper functions to access the current session and user (`getAccessToken`, `getRefreshToken`, `getCurrentUser`).

## Register User
The `registerUser` function in `register.py` registers a new user with the provided email. The current implementation uses Supabase RPCs to validate and create the user profile and wraps the signup flow in a try/except. Line by line it works as follows:

1. It imports the `supabase_client` from the main Supabase utilities.
```python
from supabase_utils.main import supabase_client
```

2. The function `registerUser` takes `email`, `password`, and an optional `data` dictionary containing additional profile information like `name` and `bio` (defaulting to empty strings).
```python
def registerUser(email: str, password: str, data: dict = {"name": "", "bio": ""}):
```

3. The function runs inside a try/except block to catch and return errors from Supabase calls.
```python
try:
    ...
except Exception as e:
    return {"success": False, "error": str(e)}
```

4. It calls a Postgres RPC `check_user_verification` (via Supabase `rpc`) with the email. This RPC is expected to perform server-side verification checks before signup.
```python
    supabase_client.rpc("check_user_verification", {"p_email": email}).execute()
```

5. It signs up the user with Supabase Auth using the provided email and password.
```python
    supabase_client.auth.sign_up({
        "email": email,
        "password": password,
    })
```

6. After signup, it calls another RPC `create_user_profile` to create the user's profile in the database. It passes `p_email`, `p_name`, and `p_bio` parameters populated from the `data` dict.
```python
    supabase_client.rpc("create_user_profile", {
        "p_email": email,
        "p_name": data.get("name", ""),
        "p_bio": data.get("bio", "")
    }).execute()
```

7. If all calls succeed the function returns a simple success dict.
```python
    return {"success": True}
```

8. If any exception is raised during the flow, it is caught and returned as an error dict (see the `except` block above).

Note: the actual `register.py` file currently contains an extra `return {"success": True}` after the try/except block which is unreachable; the above breakdown reflects the intended flow used by the code inside the `try` block.
## Login User
The `loginUser` function in `login.py` authenticates a user and initiates a session. Line by line, it works as follows:
1. It imports the `supabase_client` from the main Supabase utilities.
```python
    from supabase_utils.main import supabase_client
```
2. The function `loginUser` takes `email` and `password` as parameters.
```python
    def loginUser(email: str, password: str):
```
3. It attempts to sign in the user using the Supabase authentication client.
```python
        res = supabase_client.auth.sign_in({
            "email": email,
            "password": password,
        })
```
4. It returns the result of the sign-in attempt.
```python
        return res
```
## Logout User
The `logoutUser` function in `logout.py` ends the current user session. Line by line, it works as follows:
1. It imports the `supabase_client` from the main Supabase utilities.
```python
from supabase_utils.main import supabase_client
```
2. The function `logoutUser` takes no parameters.
```python
def logoutUser():
```
3. It calls the `sign_out` method of the Supabase authentication client to end the session.
```python
    res = supabase_client.auth.sign_out()
    return res
```
## Session helpers
`user.py` has been removed and replaced by `session.py`. This file provides small helpers to access the current Supabase session and authenticated user. Line by line the three functions work as follows:

1. It imports the `supabase_client` from the main Supabase utilities.
```python
from supabase_utils.main import supabase_client
```

2. `getAccessToken()` — returns the current session's access token.
```python
def getAccessToken():
    session = supabase_client.auth.get_session()
    return session.access_token
```

3. `getRefreshToken()` — returns the current session's refresh token.
```python
def getRefreshToken():
    session = supabase_client.auth.get_session()
    return session.refresh_token
```

4. `getCurrentUser()` — returns the currently authenticated user object (or `None` if not authenticated).
```python
def getCurrentUser():
    user = supabase_client.auth.get_user().user
    return user
```

Note: These helpers assume a session exists; callers should handle `None` values where appropriate (for example, check `getCurrentUser()` before using its fields).

