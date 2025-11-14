import sys
from pathlib import Path
from flask import Flask,request

# Add parent directory to path to import architecture module
sys.path.insert(0, str(Path(__file__).parent.parent))

from architecture.supabase_utils.auth.login import loginUser


app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route('/auth/login', methods=['POST'])
def login_route():
    payload = request.get_json() or {}
    email = payload.get('email')
    password = payload.get('password')
    if not email or not password:
        return {"error": "email and password required"}, 400

    return loginUser(email=email, password=password)

if __name__ == "__main__":
    app.run(debug=True)
    