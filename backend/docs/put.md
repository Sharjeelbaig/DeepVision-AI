## PUT / PATCH — Update data (Beginner guide)

Purpose
 - Use PUT or PATCH to update an existing resource. PUT typically replaces a whole resource while PATCH applies a partial update.

Common endpoints (examples)
 - PUT /users/:id — replace user profile
 - PATCH /users/:id — update specific fields (name, avatar)

How this maps to the architecture
 - Route handlers call update functions in `architecture/`:
	 - `architecture/supabase_utils/db/data_updater.py` — functions like `update_user(user_id, changes)`.
	 - If file upload is involved, call `architecture/supabase_utils/storage/storage_uploader.py` first and pass resulting URL to the updater.

Minimal example (Flask route handlers)
```py
from flask import request, jsonify
from architecture.supabase_utils.db.data_updater import update_user
from architecture.supabase_utils.storage.storage_uploader import upload_file


@app.route('/users/<user_id>', methods=['PUT', 'PATCH'])
def update_user_route(user_id):
    payload = request.get_json() if request.is_json else {}
    # if updating avatar file (multipart), upload first
    if 'avatar' in request.files:
        url = upload_file(request.files['avatar'])
        payload['avatar_url'] = url
    result = update_user(user_id, payload)
    if not result.get('ok'):
        return jsonify({"message": result.get('error', 'update failed')}), 400
    return jsonify(result.get('record')), 200
```

Request example (PATCH)
PATCH /users/123
```json
{
	"name": "Alice A.",
	"bio": "Photographer"
}
```

Response example
```json
{
	"status": 200,
	"data": { "id": "123", "name": "Alice A.", "bio": "Photographer" }
}
```

Notes and beginner tips
 - Use PATCH for partial updates; PUT when you send full resource.
 - Return the updated resource if convenient.
 - Handle concurrent updates carefully (timestamps, versioning) if needed.
