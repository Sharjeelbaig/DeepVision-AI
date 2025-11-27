import { useCallback, useEffect, useRef, useState } from 'react';
import RoomCodeScreen from './pages/RoomCodeScreen';
import CameraScreen from './pages/CameraScreen';
import CaptureResultScreen from './pages/CaptureResultScreen';
import type { CaptureResult, CaptureApiPayload } from './types/capture';

type Screen = 'room-code' | 'camera' | 'result';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000';
// const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000';

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

const evaluateCaptureStatus = (payload: CaptureApiPayload): { shouldContinue: boolean; shouldTriggerAlarm: boolean } => {
  if (!payload || typeof payload !== 'object') {
    return { shouldContinue: false, shouldTriggerAlarm: true };
  }

  const detections = toDetectionRecords(payload.data);
  if (detections.length === 0) {
    return { shouldContinue: false, shouldTriggerAlarm: true };
  }

  const primaryDetection = detections[0];
  const labelRaw = primaryDetection.label;
  const label = typeof labelRaw === 'string' ? labelRaw.trim().toLowerCase() : '';
  const labelIsNormal = label === 'normal person' || label === 'no human';

  const recognizedFaces = primaryDetection.recognized_faces ?? (primaryDetection as { recognizedFaces?: unknown }).recognizedFaces;
  const facesArray = Array.isArray(recognizedFaces)
    ? recognizedFaces.filter((face): face is DetectionRecord => Boolean(face) && typeof face === 'object')
    : [];

  const hasPositiveMatch = facesArray.some((face) => {
    const resultText = typeof face.result === 'string' ? face.result.trim().toUpperCase() : '';
    const isMatch = face.isMatch === true;
    return resultText === 'OK' || isMatch;
  });

  const allFacesReportNoFace = facesArray.length > 0 && facesArray.every((face) => {
    const resultText = typeof face.result === 'string' ? face.result.trim().toLowerCase() : '';
    return resultText.includes('no face');
  });

  const noFacesCaptured = facesArray.length === 0;

  const noFaceDetected = (noFacesCaptured || allFacesReportNoFace) && (!label || label === 'normal person');

  if (noFaceDetected) {
    return { shouldContinue: true, shouldTriggerAlarm: false };
  }

  const shouldContinue = labelIsNormal && hasPositiveMatch;
  const shouldTriggerAlarm = !labelIsNormal || !hasPositiveMatch;

  return { shouldContinue, shouldTriggerAlarm };
};

const App = () => {
  const [screen, setScreen] = useState<Screen>('room-code');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [cameraSession, setCameraSession] = useState(0);
  const [shouldAlarm, setShouldAlarm] = useState(false);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const sendAlert = useCallback((room: string, alertStatus: boolean) => {
    if (!room) {
      return;
    }
    void fetch(`${API_BASE}/systems/alert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_code: room, alert_status: alertStatus }),
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    alarmAudioRef.current = new Audio('/alarm.wav');
    alarmAudioRef.current.loop = true;
    alarmAudioRef.current.preload = 'auto';
    return () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
      }
      alarmAudioRef.current = null;
    };
  }, []);

  const stopAlarm = useCallback(() => {
    const audio = alarmAudioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const playAlarm = useCallback(() => {
    const audio = alarmAudioRef.current;
    if (!audio) {
      return;
    }
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        /* Ignore autoplay rejections */
      });
    }
  }, []);

  useEffect(() => {
    if (shouldAlarm) {
      playAlarm();
    } else {
      stopAlarm();
    }
  }, [shouldAlarm, playAlarm, stopAlarm]);

  const handleRoomCodeSubmit = (code: string) => {
    setRoomCode(code);
    setCaptureResult(null);
    setCameraSession((previous) => previous + 1);
    setShouldAlarm(false);
    sendAlert(code, false);
    setScreen('camera');
  };

  const handleCaptureComplete = (result: CaptureResult) => {
    const evaluation = evaluateCaptureStatus(result.apiResponse);
    setCaptureResult(result);
    setShouldAlarm(evaluation.shouldTriggerAlarm);
    if (roomCode) {
      const alertStatus = evaluation.shouldTriggerAlarm;
      sendAlert(roomCode, alertStatus);
    }
    if (evaluation.shouldContinue) {
      if (roomCode) {
        sendAlert(roomCode, false);
      }
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
    setShouldAlarm(false);
  };

  const handleRecapture = () => {
    if (!roomCode) {
      return;
    }
    setCaptureResult(null);
    setCameraSession((previous) => previous + 1);
    setShouldAlarm(false);
    sendAlert(roomCode, false);
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
