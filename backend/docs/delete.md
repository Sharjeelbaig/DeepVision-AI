## DELETE — Remove data (Beginner guide)

Purpose
 - Use DELETE to remove a resource on the server (e.g., delete a user, delete a file in storage).

Common endpoints (examples)
 - DELETE /users/:id — delete a user account
 - DELETE /uploads/:key — remove a stored file

How this maps to the architecture
 - Route handlers call deletion functions in `architecture/`:
   - `architecture/supabase_utils/db/data_deleter.py` — functions like `delete_user(user_id)`.
   - `architecture/supabase_utils/storage/storage_deleter.py` — delete stored objects.

Minimal example (Flask route handler)
```py
from flask import request, jsonify
from architecture.supabase_utils.db.data_deleter import delete_user
from architecture.supabase_utils.storage.storage_deleter import delete_file


@app.route('/users/<user_id>', methods=['DELETE'])
def delete_user_route(user_id):
	body = request.get_json(silent=True) or {}
	# optionally remove related files
	if body.get('remove_files'):
		# example: delete avatar for user
		delete_file(f"{user_id}/avatar.png")
	ok = delete_user(user_id)
	if not ok:
		return jsonify({"message": "Not found or could not delete"}), 404
	# 204 No Content is common for successful delete
	return ('', 204)
```

Response notes
 - Successful deletion commonly returns 204 No Content (no body) or 200 with a confirmation message.

Beginner tips
 - Consider soft deletes (mark as deleted) instead of hard deletes when data recovery is desired.
 - Ensure you authorize the request — deleting is destructive.
