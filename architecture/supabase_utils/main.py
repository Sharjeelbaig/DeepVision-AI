import os
from supabase import create_client
from dotenv import load_dotenv
load_dotenv()

project_url = os.getenv("SUPABASE_URL", "")
project_anon_key = os.getenv("SUPABASE_KEY", "")

supabase_client = create_client(project_url, project_anon_key)