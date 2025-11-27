import type { CaptureResult } from '../types/capture';

interface CaptureResultScreenProps {
  result: CaptureResult;
  onRestart: () => void;
}

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

const CaptureResultScreen = ({ result, onRestart }: CaptureResultScreenProps) => {
  const recognizedFaces = extractRecognizedFaces(result.apiResponse.data);

  return (
    <div className="app-shell">
      <div className="card" style={{ maxWidth: 640 }}>
        <h1>Capture Complete</h1>
        <p className="subtle-text">Room Code: <span className="tag">{result.roomCode}</span></p>
        <p className="subtle-text" style={{ marginTop: '0.5rem' }}>
          Timestamp: {new Date(result.completedAt).toLocaleString()}
        </p>

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

        <div className="results-grid">
          {/* <div>
            <strong>Server Response</strong>
            <pre>{JSON.stringify(result.apiResponse, null, 2)}</pre>
          </div> */}
        </div>

        {/* <button type="button" className="action-button" onClick={onRestart}>
          Start New Capture
        </button> */}
      </div>
    </div>
  );
};

export default CaptureResultScreen;
