import type { CaptureResult } from '../types/capture';

interface CaptureResultScreenProps {
  result: CaptureResult;
  onRestart: () => void;
  onRecapture: () => void;
}

type DetectionRecord = Record<string, unknown>;

const toDetectionRecords = (payload: unknown): DetectionRecord[] => {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is DetectionRecord => Boolean(item) && typeof item === 'object');
  }
  if (payload && typeof payload === 'object') {
    return [payload as DetectionRecord];
  }
  return [];
};

const getPrimaryDetection = (payload: unknown): DetectionRecord | null => {
  const records = toDetectionRecords(payload);
  return records.length > 0 ? records[0] : null;
};

const extractRecognizedFaces = (payload: unknown): string[] => {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  if (Array.isArray((payload as { data?: unknown }).data)) {
    const collection = (payload as { data: unknown[] }).data;
    const first = collection.find((item) => item && typeof item === 'object');
    if (first && typeof first === 'object' && 'recognized_faces' in first) {
      const faces = (first as { recognized_faces?: unknown }).recognized_faces;
      if (Array.isArray(faces)) {
        return faces
          .map((face) => {
            if (!face || typeof face !== 'object') {
              return null;
            }
            const candidate = face as Record<string, unknown>;
            const name = typeof candidate.name_of_person === 'string' ? candidate.name_of_person : null;
            const isMatch = typeof candidate.isMatch === 'boolean' ? candidate.isMatch : null;
            if (name && isMatch !== null) {
              return `${name} (${isMatch ? 'match' : 'no match'})`;
            }
            if (name) {
              return name;
            }
            return null;
          })
          .filter(Boolean) as string[];
      }
    }
  }

  if ('recognized_faces' in payload && Array.isArray((payload as { recognized_faces: unknown[] }).recognized_faces)) {
    return ((payload as { recognized_faces: unknown[] }).recognized_faces || [])
      .map((face) => {
        if (!face || typeof face !== 'object') {
          return null;
        }
        const candidate = face as Record<string, unknown>;
        const name = typeof candidate.name_of_person === 'string' ? candidate.name_of_person : null;
        const isMatch = typeof candidate.isMatch === 'boolean' ? candidate.isMatch : null;
        if (name && isMatch !== null) {
          return `${name} (${isMatch ? 'match' : 'no match'})`;
        }
        if (name) {
          return name;
        }
        return null;
      })
      .filter(Boolean) as string[];
  }

  return [];
};

const deriveStopReason = (detection: DetectionRecord | null): string => {
  if (!detection) {
    return 'No detection details were returned for this capture.';
  }

  const labelRaw = detection.label;
  const label = typeof labelRaw === 'string' ? labelRaw.trim() : '';
  if (label && label.toLowerCase() !== 'normal person') {
    return `Detected label "${label}" differs from the expected "normal person".`;
  }

  const recognizedRaw = detection.recognized_faces ?? (detection as { recognizedFaces?: unknown }).recognizedFaces;
  if (!Array.isArray(recognizedRaw) || recognizedRaw.length === 0) {
    return 'No recognized faces matched the stored profiles.';
  }

  const hasPositiveMatch = recognizedRaw.some((face) => {
    if (!face || typeof face !== 'object') {
      return false;
    }
    const candidate = face as Record<string, unknown>;
    const resultText = typeof candidate.result === 'string' ? candidate.result.trim().toUpperCase() : '';
    const isMatch = candidate.isMatch === true;
    return resultText === 'OK' || isMatch;
  });

  if (!hasPositiveMatch) {
    return 'All recognized faces failed verification against stored profiles.';
  }

  return 'Monitoring stopped because the capture did not meet the expected conditions.';
};

const CaptureResultScreen = ({ result, onRestart, onRecapture }: CaptureResultScreenProps) => {
  const recognizedFaces = extractRecognizedFaces(result.apiResponse.data);
  const detection = getPrimaryDetection(result.apiResponse.data);
  const labelRaw = detection?.label;
  const detectionLabel = typeof labelRaw === 'string' ? labelRaw : 'Unknown';
  const stopReason = deriveStopReason(detection);

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 640 }}>
        <h1>Monitoring Paused</h1>
        <p className="subtle-text">Room Code: <span className="tag">{result.roomCode}</span></p>
        <p className="subtle-text" style={{ marginTop: '0.5rem' }}>
          Timestamp: {new Date(result.completedAt).toLocaleString()}
        </p>

        <div className="results-grid" style={{ marginTop: '1rem' }}>
          <div>
            <strong>Detection Summary</strong>
            <p className="subtle-text" style={{ marginTop: '0.5rem' }}>Label: {detectionLabel}</p>
            <p className="subtle-text" style={{ marginTop: '0.5rem' }}>{stopReason}</p>
          </div>
        </div>

        {recognizedFaces.length > 0 && (
          <div className="results-grid">
            <div>
              <strong>Recognized Faces</strong>
              <p className="subtle-text" style={{ marginTop: '0.5rem' }}>
                {recognizedFaces.join(', ')}
              </p>
            </div>
          </div>
        )}

        <div className="results-grid" style={{ marginTop: '1.5rem' }}>
          <button type="button" className="action-button" onClick={onRecapture}>
            Resume Monitoring
          </button>
          <button type="button" className="secondary-button" onClick={onRestart}>
            Change Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptureResultScreen;
