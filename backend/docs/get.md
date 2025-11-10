## GET — Read data (Beginner guide)

Purpose
 - Use GET to read or retrieve data from the server. It should not change server state.

Common endpoints (examples)
 - GET /users — list users
 - GET /users/:id — get a single user by id
 - GET /auth/session — return current session/user info

How this maps to the architecture
 - Route handlers call read-only functions in `architecture/`:
	 - `architecture/supabase_utils/db/data_reader.py` — functions to fetch rows (e.g. `get_user`, `list_users`).
	 - `architecture/supabase_utils/auth/session.py` — read session info.

Minimal example (Flask route handlers)
```py
from flask import request, jsonify
from architecture.supabase_utils.db.data_reader import get_user, list_users

@app.route('/users/<user_id>', methods=['GET'])
def get_user_route(user_id):
	# call the architecture function to get data
	user = get_user(user_id)
	if not user:
		return jsonify({"message": "User not found"}), 404
	return jsonify(user), 200


@app.route('/users', methods=['GET'])
def list_users_route():
	# read query params and pass to architecture layer
	page = int(request.args.get('page', 1))
	limit = int(request.args.get('limit', 20))
	users = list_users(page=page, limit=limit)
	return jsonify(users), 200
```

Request examples
 - Get by id: GET /users/123
 - Query list: GET /users?page=2&limit=20

Response shape (typical)
```json
{
	"status": 200,
	"data": {
		"id": "123",
		"email": "alice@example.com",
		"name": "Alice"
	}
}
```

Notes and beginner tips
 - Keep GET idempotent and side-effect free.
 - Use clear 4xx/5xx status codes for errors.
 - Return useful, small payloads (avoid sending secrets).
