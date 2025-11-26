export interface SystemFace {
  face_id: string;
  face_url?: string | null;
  name_of_person?: string | null;
}

export interface MonitoredDetectionBox {
  xmin?: number | null;
  xmax?: number | null;
  ymin?: number | null;
  ymax?: number | null;
  [key: string]: number | null | undefined;
}

export interface MonitoredDetection {
  box?: MonitoredDetectionBox | null;
  label?: string | null;
  score?: number | null;
  [key: string]: unknown;
}

export interface SystemRecord {
  id: number;
  owner_id: string;
  system_name: string;
  faces?: SystemFace[];
  alert?: boolean | number | null;
  monitored_image_url?: string | null;
  monitored_data?: MonitoredDetection | null;
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

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
};

export const normalizeMonitoredData = (raw: unknown): MonitoredDetection | null => {
  if (!raw) {
    return null;
  }

  let candidate: unknown = raw;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    try {
      candidate = JSON.parse(trimmed);
    } catch {
      return null;
    }
  }

  if (Array.isArray(candidate)) {
    if (candidate.length === 0) {
      return null;
    }
    candidate = candidate[0];
  }

  if (!candidate || typeof candidate !== 'object') {
    return null;
  }

  const detection = candidate as Record<string, unknown>;
  const boxRaw = detection.box;
  let normalizedBox: MonitoredDetectionBox | null = null;

  if (boxRaw && typeof boxRaw === 'object' && !Array.isArray(boxRaw)) {
    const boxCandidate = boxRaw as Record<string, unknown>;
    const xmin = toFiniteNumber(boxCandidate.xmin);
    const xmax = toFiniteNumber(boxCandidate.xmax);
    const ymin = toFiniteNumber(boxCandidate.ymin);
    const ymax = toFiniteNumber(boxCandidate.ymax);

    if (xmin !== null || xmax !== null || ymin !== null || ymax !== null) {
      normalizedBox = {
        xmin,
        xmax,
        ymin,
        ymax,
      };
    }
  }

  const label = typeof detection.label === 'string' ? detection.label : null;
  const score = toFiniteNumber(detection.score);

  return {
    ...detection,
    box: normalizedBox,
    label,
    score,
  };
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
  const monitoredImageRaw =
    candidate.monitored_image_url ?? candidate.monitoredImageUrl ?? candidate.monitored_image;
  const monitoredDataRaw = candidate.monitored_data ?? candidate.monitoredData;

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

  let normalizedMonitoredImage: string | null = null;
  if (typeof monitoredImageRaw === 'string') {
    const trimmed = monitoredImageRaw.trim();
    normalizedMonitoredImage = trimmed ? trimmed : null;
  }

  const normalizedMonitoredData = normalizeMonitoredData(monitoredDataRaw);

  return {
    ...(record as Record<string, unknown>),
    id: numericId,
    owner_id: String(ownerRaw),
    system_name: systemNameRaw,
    faces: normalizeFaces(candidate.faces),
    monitored_image_url: normalizedMonitoredImage,
    monitored_data: normalizedMonitoredData,
    room_code: normalizedRoomCode,
  };
};
