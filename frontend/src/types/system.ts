export interface SystemFace {
  face_id: string;
  face_url?: string | null;
  name_of_person?: string | null;
}

export interface SystemRecord {
  id: number;
  owner_id: string;
  system_name: string;
  faces?: SystemFace[];
  alert?: boolean | number | null;
  room_code?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

const normalizeFaceId = (faceId: unknown): string => {
  if (typeof faceId === 'number' && Number.isFinite(faceId)) {
    return String(faceId);
  }
  if (typeof faceId === 'string') {
    return faceId.trim();
  }
  return '';
};

export const normalizeFaces = (faces: unknown): SystemFace[] => {
  if (!Array.isArray(faces)) {
    return [];
  }

  const normalized: SystemFace[] = [];

  faces.forEach((face) => {
    if (!face || typeof face !== 'object') {
      return;
    }

    const candidate = face as Record<string, unknown>;
    const faceId = normalizeFaceId(candidate.face_id ?? candidate.id);
    if (!faceId) {
      return;
    }

    normalized.push({
      face_id: faceId,
      face_url: typeof candidate.face_url === 'string' ? candidate.face_url : null,
      name_of_person:
        typeof candidate.name_of_person === 'string' ? candidate.name_of_person : null,
    });
  });

  return normalized;
};

export const normalizeSystemRecord = (record: unknown): SystemRecord | null => {
  if (!record || typeof record !== 'object') {
  return null;
  }

  const candidate = record as Record<string, unknown>;
  const idRaw = candidate.id ?? candidate.system_id;
  const ownerRaw = candidate.owner_id ?? candidate.user_id;
  const systemNameRaw = candidate.system_name ?? candidate.name;
  const roomCodeRaw = candidate.room_code ?? candidate.roomCode;

  if (typeof idRaw !== 'number' && typeof idRaw !== 'string') {
    return null;
  }

  if (typeof ownerRaw !== 'number' && typeof ownerRaw !== 'string') {
    return null;
  }

  if (typeof systemNameRaw !== 'string') {
    return null;
  }

  const numericId = typeof idRaw === 'number' ? idRaw : Number(idRaw);

  if (!Number.isFinite(numericId)) {
    return null;
  }

  let normalizedRoomCode: string | null = null;
  if (typeof roomCodeRaw === 'string') {
    const trimmed = roomCodeRaw.trim();
    normalizedRoomCode = trimmed ? trimmed : null;
  } else if (typeof roomCodeRaw === 'number' && Number.isFinite(roomCodeRaw)) {
    normalizedRoomCode = String(roomCodeRaw);
  }

  return {
    ...(record as Record<string, unknown>),
    id: numericId,
    owner_id: String(ownerRaw),
    system_name: systemNameRaw,
    faces: normalizeFaces(candidate.faces),
    room_code: normalizedRoomCode,
  };
};
