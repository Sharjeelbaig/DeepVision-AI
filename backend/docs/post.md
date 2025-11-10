## POST — Create data / actions (Beginner guide)

Purpose
 - Use POST to create new resources (e.g., register user, upload a file) or to perform actions that change server state (e.g., login creating a session).

Common endpoints (examples)
 - POST /auth/register — register a new user
 - POST /auth/login — authenticate and create a session
 - POST /users — create a new user record
 - POST /uploads — upload a file (images, avatars)

How this maps to the architecture
 - Route handlers call write/create functions in `architecture/`:
	 - `architecture/supabase_utils/auth/register.py` — register new user (create auth record, possibly write to `db`).
	 - `architecture/supabase_utils/db/data_writer.py` — functions to insert rows (e.g. `create_user`).
	 - `architecture/supabase_utils/storage/storage_uploader.py` — upload files and return storage URL.

Minimal example (Flask route handlers)
```py
from flask import request, jsonify
from architecture.supabase_utils.auth.register import register_user
from architecture.supabase_utils.auth.login import login_user
from architecture.supabase_utils.db.data_writer import create_user
from architecture.supabase_utils.storage.storage_uploader import upload_file


@app.route('/auth/register', methods=['POST'])
def register_route():
	payload = request.get_json()
	# 1) create user in auth system
	auth_result = register_user(email=payload['email'], password=payload['password'])
	if not auth_result.get('ok'):
		return jsonify({"message": auth_result.get('error', 'registration failed')}), 400
	# 2) create profile row in DB
	profile = create_user({"id": auth_result['user_id'], "name": payload.get('name')})
	return jsonify(profile), 201


@app.route('/auth/login', methods=['POST'])
def login_route():
	payload = request.get_json()
	result = login_user(email=payload['email'], password=payload['password'])
	if not result.get('ok'):
		return jsonify({"message": "Invalid credentials"}), 401
	return jsonify(result['session']), 200


@app.route('/uploads', methods=['POST'])
def upload_route():
	# example for a simple file upload endpoint (multipart/form-data)
	file = request.files.get('file')
	if not file:
		return jsonify({"message": "No file provided"}), 400
	url = upload_file(file)
	return jsonify({"url": url}), 201
```

Request example (register)
POST /auth/register
```json
{
	"email": "alice@example.com",
	"password": "strong-password",
	"name": "Alice"
}
```

Response example
```json
{
	"status": 201,
	"data": { "id": "abc123", "email": "alice@example.com", "name": "Alice" }
}
```

Notes and beginner tips
 - Validate input on the server. Never trust client data.
 - Hash passwords in the auth layer (prefer libraries or managed services).
 - Return 201 Created when a new resource is created.
