from .supabase.auth.register import register_user

res = register_user("eng.sharjeel.baig@gmail.com", "12345678")

print(res)