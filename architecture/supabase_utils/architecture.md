# Supabase Layer Architecture
This document details the architecture of the Supabase layer within the Deep Vision project, focusing on its key components and their functionalities.

## Key Components
The Supabase layer consists of three main modules, each responsible for specific functionalities:
- Authentication module
- DB module
- Storage module

### Authentication Module
The Authentication module is responsible for managing user registration, login, logout, and profile retrieval. It provides the following key functions:
- `registerUser(email, password, {name, bio})`: Registers a new user with the provided email and password and create user profile in the user_data table.
- `loginUser(email, password)`: Authenticates a user and initiates a session.
- `logoutUser()`: Ends the current user session.
- `getUserProfile()`: Retrieves the profile information of a user `access_token`, `email`, `name` `bio`, `image_url`.

### DB Module
The DB module handles all database operations related to user data and image metadata. It includes the following key functions:
- `createUserProfile(profileData)`: Creates a new user profile in the database with the provided profile data.
- `getUserProfile(userId)`: Fetches the user profile information based on the user ID.
- `updateUserProfile(userId, updatedData)`: Updates the user profile with the provided updated data.
- `deleteUserProfile(userId)`: Deletes the user profile associated with the given user ID.

### Storage Module
The Storage module is responsible for managing image storage and retrieval. It provides the following key functions:
- `uploadImage(userId, base64)`: Uploads a new image for the specified user.
- `getImage(imageId)`: Retrieves the image associated with the given image ID.
- `deleteImage(imageId)`: Deletes the image associated with the given image ID.