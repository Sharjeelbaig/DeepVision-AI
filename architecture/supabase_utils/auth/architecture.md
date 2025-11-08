# Authentication Architecture
Authentication in the Supabase layer of the Deep Vision project is designed to manage user access and profile information efficiently. This module contains functions for `user registration`, `login`, `logout`, and `profile retrieval`, in the following files:
- `register.py`: Contains the `registerUser` function to handle new user registrations and create user profiles in the `user_data` table.
- `login.py`: Contains the `loginUser` function to authenticate users and initiate sessions.
- `logout.py`: Contains the `logoutUser` function to end user sessions.
- `user.py`: Contains the `getUserProfile` function to retrieve user profile information.

## Register User
The `registerUser` function in `register.py` registers a new user with the provided email. the function line by line is as follows:
1. It imports the `supabase_client` from the main Supabase utilities.
```python
from supabase_utils.main import supabase_client
```
2. The function `registerUser` takes `email`, `password`, and an optional `data` dictionary containing additional profile information like `name` and `bio`.
```python
def registerUser(email: str, password: str, data: dict = {"name": "", "bio": ""}):
```
3. It attempts to sign up the user using the Supabase authentication client.
```python
reg = supabase_client.auth.sign_up({
    "email": email,
    "password": password,
})
```
4. It checks if the user is verified; if not, it returns an error message.
```python
is_user_verified = reg.user.user_metadata.get("email_verified") == None
if is_user_verified == False:
    return {"success": False, "error": "User exists but not verified."}
```
5. It checks if the user profile already exists in the `user_data` table; if not, it inserts a new profile.
```python
is_user_data_added = len(supabase_client.table("user_data").select("*").eq("email", email).execute().data) == 1
if is_user_data_added is False:
    supabase_client.table("user_data").insert({
            "email": email,
            "name": data.get("name", ""),
            "bio": data.get("bio", ""),
        }).execute()
```
6. Finally, it returns a success message upon successful registration.
```python
return {"success": True}
```
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
## Get User Profile
The `getUserProfile` function in `user.py` retrieves the profile information of the currently authenticated user. Line by line, it works as follows:
1. It imports the `supabase_client` from the main Supabase utilities.
```python
from supabase_utils.main import supabase_client
```
2. The function `getUserProfile` takes no parameters.
```python
def getUserProfile():
```
3. It retrieves the currently authenticated user.
```python
    user = supabase_client.auth.get_user().user
    session = supabase_client.auth.get_session()
```
4. If no user is authenticated, it returns `None`.
```python
    if user is None:
        return None
```
5. It fetches the user profile from the `user_data` table based on the user's email.
```python
    user_data = supabase_client.table("user_data").select("*").eq("email", user.email).execute().data
```
6. It adds the `access_token` from the session to the user data.
```python
    user_data[0]["access_token"] = session.access_token
    return user_data[0]
```
7. Finally, it returns the user profile data.
```python
    return user_data[0]
```

