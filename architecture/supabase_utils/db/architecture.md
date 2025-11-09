# DB Architecture
This is detailed information of what's inside the codebase of the `db` module inside the `supabase_utils` package.

## Files
- `data_creater.py`: Contains functions to write data to the database.
- `data_reader.py`: Contains functions to read data from the database.
- `data_updater.py`: Contains functions to update existing data in the database.
- `data_deleter.py`: Contains functions to delete data from the database.

## Functions
### `data_writer.py`
Empty for now.

### `data_reader.py`
- `getUserProfile(user_id: int)`: Fetches the user profile information based on the user ID.
- `getSystemInfo(system_id: int)`: Retrieves system information from the database.

### `data_updater.py`
- `updateUserImage(user_id: int, image_url: str)`: Updates the user's profile image URL in the database.
- `updateUserBio(user_id: int, bio: str)`: Updates the user's bio in the database.
- `updateUserName(user_id: int, name: str)`: Updates the user's name in the database.

### `data_deleter.py`
Empty for now.

