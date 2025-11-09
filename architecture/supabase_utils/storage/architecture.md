# Storage Architecture
This highlights the architecture of the Storage module within the Supabase layer of the Deep Vision project.

## Files
- `storage_uploader.py`: Contains the function to upload images to Supabase storage.
- `storage_reader.py`: Contains the function to retrieve images from Supabase storage.
- `storage_deleter.py`: Contains the function to delete images from Supabase storage

## storage_uploader.py
- `uploadImage(email, base64)`: Uploads a new image for the specified user identified by their email in `public/[email]/face.jpg` format.
## storage_reader.py
- `getImage(email)`: Retrieves the image associated with the given user's email from `public/[email]/face.jpg`.
## storage_deleter.py
- `deleteImage(email)`: Deletes the image associated with the given user's email from `public/[email]/face.jpg`.