import { useState } from 'react';
import RoomCodeScreen from './pages/RoomCodeScreen';
import CameraScreen from './pages/CameraScreen';
import CaptureResultScreen from './pages/CaptureResultScreen';
import type { CaptureResult } from './types/capture';

type Screen = 'room-code' | 'camera' | 'result';

const App = () => {
  const [screen, setScreen] = useState<Screen>('room-code');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);

  const handleRoomCodeSubmit = (code: string) => {
    setRoomCode(code);
    setCaptureResult(null);
    setScreen('camera');
  };

  const handleCaptureComplete = (result: CaptureResult) => {
    setCaptureResult(result);
    setScreen('result');
  };

  const handleRestart = () => {
    setScreen('room-code');
    setRoomCode(null);
    setCaptureResult(null);
  };

  if (screen === 'camera' && roomCode) {
    return (
      <CameraScreen
        roomCode={roomCode}
        onCaptureComplete={handleCaptureComplete}
        onCancel={handleRestart}
      />
    );
  }

  if (screen === 'result' && captureResult) {
    return <CaptureResultScreen result={captureResult} onRestart={handleRestart} />;
  }

  return <RoomCodeScreen onSubmit={handleRoomCodeSubmit} />;
};

export default App;
