from architecture.supabase_utils.main import supabase_client


def _normalize_face_id(face_id) -> str:
    """Normalize face IDs so string/int mismatches do not block deletions."""
    if face_id is None:
        return ""
    return str(face_id).strip()


def deleteFaceFromSystem(system_id: int, face_id):
    system_data = (
        supabase_client
        .table("systems_data")
        .select("faces")
        .eq("id", system_id)
        .single()
        .execute()
    )

    record = system_data.data or {}
    if not isinstance(record, dict):
        raise ValueError("system record missing faces")

    faces = record.get("faces") or []
    if not isinstance(faces, list):
        faces = []

    target_face_id = _normalize_face_id(face_id)
    if not target_face_id:
        raise ValueError("face_id required to delete from system")

    updated_faces = []
    removed = False
    for face in faces:
        if not isinstance(face, dict):
            updated_faces.append(face)
            continue
        if _normalize_face_id(face.get("face_id")) == target_face_id:
            removed = True
            continue
        updated_faces.append(face)

    if not removed:
        raise ValueError("face_id not found in system faces")

    res = (
        supabase_client
        .table("systems_data")
        .update({"faces": updated_faces})
        .eq("id", system_id)
        .execute()
    )

    return res.data