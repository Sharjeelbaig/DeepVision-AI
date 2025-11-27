import { useState } from 'react';
import RoomCodeScreen from './pages/RoomCodeScreen';
import CameraScreen from './pages/CameraScreen';
import CaptureResultScreen from './pages/CaptureResultScreen';
import type { CaptureResult, CaptureApiPayload } from './types/capture';

type Screen = 'room-code' | 'camera' | 'result';

const shouldContinueMonitoring = (payload: CaptureApiPayload): boolean => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const rawData = payload.data;
  const detections: Record<string, unknown>[] = [];

  if (Array.isArray(rawData)) {
    rawData.forEach((item) => {
      if (item && typeof item === 'object') {
        detections.push(item as Record<string, unknown>);
      }
    });
  } else if (rawData && typeof rawData === 'object') {
    detections.push(rawData as Record<string, unknown>);
  }

  if (detections.length === 0) {
    return false;
  }

  const primaryDetection = detections[0];
  const labelRaw = primaryDetection.label;
  const label = typeof labelRaw === 'string' ? labelRaw.trim().toLowerCase() : '';

  if (label !== 'normal person') {
    return false;
  }

  const recognizedFacesRaw =
    primaryDetection.recognized_faces ?? (primaryDetection as { recognizedFaces?: unknown }).recognizedFaces;

  if (!Array.isArray(recognizedFacesRaw) || recognizedFacesRaw.length === 0) {
    return false;
  }

  return recognizedFacesRaw.some((face) => {
    if (!face || typeof face !== 'object') {
      return false;
    }
    const candidate = face as Record<string, unknown>;
    const result = typeof candidate.result === 'string' ? candidate.result.trim().toUpperCase() : '';
    const isMatch = candidate.isMatch === true;
    return result === 'OK' || isMatch;
  });
};

const App = () => {
  const [screen, setScreen] = useState<Screen>('room-code');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [cameraSession, setCameraSession] = useState(0);

  const handleRoomCodeSubmit = (code: string) => {
    setRoomCode(code);
    setCaptureResult(null);
    setCameraSession((previous) => previous + 1);
    setScreen('camera');
  };

  const handleCaptureComplete = (result: CaptureResult) => {
    const shouldLoop = shouldContinueMonitoring(result.apiResponse);
    setCaptureResult(result);
    if (shouldLoop) {
      setCameraSession((previous) => previous + 1);
      setScreen('camera');
    } else {
      setScreen('result');
    }
  };

  const handleRestart = () => {
    setScreen('room-code');
    setRoomCode(null);
    setCaptureResult(null);
  };

  const handleRecapture = () => {
    if (!roomCode) {
      return;
    }
    setCaptureResult(null);
    setCameraSession((previous) => previous + 1);
    setScreen('camera');
  };

  if (screen === 'camera' && roomCode) {
    return (
      <CameraScreen
        key={cameraSession}
        roomCode={roomCode}
        onCaptureComplete={handleCaptureComplete}
        onCancel={handleRestart}
      />
    );
  }

  if (screen === 'result' && captureResult) {
    return <CaptureResultScreen result={captureResult} onRestart={handleRestart} onRecapture={handleRecapture} />;
  }

  return <RoomCodeScreen onSubmit={handleRoomCodeSubmit} />;
};

export default App;
