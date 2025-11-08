from supabase_utils.auth.register import registerUser
from supabase_utils.auth.login import loginUser
from supabase_utils.auth.user import getUserProfile
# user = registerUser("eng.sharjeel.baig@gmail.com", "SecureP@ssw0rd!", {"name": "Sharjeel", "bio": "Developer"})
# print(user)

user = loginUser("eng.sharjeel.baig@gmail.com", "SecureP@ssw0rd!")
# print(user)

profile = getUserProfile()
print(profile)