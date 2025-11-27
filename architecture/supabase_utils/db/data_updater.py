import random
from typing import Any

from ..main import supabase_client
def updateUserImage(user_id: int, image_url: str):
    res = supabase_client.table("user_data").update({
        "image_url": image_url
    }).eq("id", user_id).execute()
    return res

def updateUserName(user_id: int, new_name: str):
    res = supabase_client.table("user_data").update({
        "name": new_name
    }).eq("id", user_id).execute()
    return res

def updateUserBio(user_id: int, new_bio: str):
    res = supabase_client.table("user_data").update({
        "bio": new_bio
    }).eq("id", user_id).execute()
    return res

def updateFaceToSystem(system_id: int, face_url: str, name_of_person: str):
    system_data = supabase_client.table("systems_data").select("faces").eq("id", system_id).single().execute()
    record = getattr(system_data, "data", None)
    faces_data = record.get("faces") if isinstance(record, dict) else None
    faces = list(faces_data) if isinstance(faces_data, list) else []
    new_face_id = random.randint(1000, 9999)
    faces.append({
        "face_id": new_face_id,
        "face_url": face_url,
        "name_of_person": name_of_person
    })
    res = supabase_client.table("systems_data").update({
        "faces": faces
    }).eq("id", system_id).execute()
    return res.data

def alertSystem(system_id: int, alert_status: bool):
    res = supabase_client.table("systems_data").update({
        "alert": 1 if alert_status else 0
    }).eq("id", system_id).execute()
    print(res)
    return res.data

def addRoomCode(system_id: int, room_code: str):
    res = supabase_client.table("systems_data").update({
        "room_code": room_code
    }).eq("id", system_id).execute()
    return res.data

def addMonitoredImageURL(system_id: int, image_url: str):
    res = supabase_client.table("systems_data").update({
        "monitored_image_url": image_url
    }).eq("id", system_id).execute()
    return res.data

def addMonitoredDataJSONB(system_id: int, data: Any):
    res = supabase_client.table("systems_data").update({
        "monitored_data": data
    }).eq("id", system_id).execute()
    print(res)
    return res.data