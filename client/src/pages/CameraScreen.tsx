import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaptureResult } from '../types/capture';

interface CameraScreenProps {
  roomCode: string;
  onCaptureComplete: (result: CaptureResult) => void;
  onCancel: () => void;
}

type CaptureState = 'idle' | 'countdown' | 'capturing' | 'success' | 'error';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:5000';
const COUNTDOWN_SECONDS = 12;

const CameraScreen = ({ roomCode, onCaptureComplete, onCancel }: CameraScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);

  const cleanupTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    cleanupTimers();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, [cleanupTimers]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }, []);

  const sendCapture = useCallback(
    async (frame: string) => {
      setState('capturing');
      try {
        const response = await fetch(`${API_BASE}/systems/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_id: roomCode,
            base64_image: frame,
            room_code: roomCode,
          }),
        });

        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch (parseError) {
          payload = { error: 'Unable to parse capture response' };
        }

        if (!response.ok) {
          const message =
            payload &&
            typeof payload === 'object' &&
            'error' in payload &&
            typeof (payload as { error?: unknown }).error === 'string'
              ? ((payload as { error: string }).error || 'Capture failed')
              : 'Capture failed';
          throw new Error(message);
        }

        setState('success');
        const result: CaptureResult = {
          roomCode,
          completedAt: new Date().toISOString(),
          apiResponse: (payload && typeof payload === 'object'
            ? (payload as Record<string, unknown>)
            : { data: payload }) as CaptureResult['apiResponse'],
        };
        onCaptureComplete(result);
      } catch (captureError) {
        const message = captureError instanceof Error ? captureError.message : 'Capture request failed';
        setError(message);
        setState('error');
      }
    },
    [roomCode, onCaptureComplete]
  );

  const scheduleCapture = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    setState('countdown');

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((previous: number) => {
        if (previous <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    captureTimeoutRef.current = window.setTimeout(() => {
      const frame = captureFrame();
      if (!frame) {
        setError('Unable to capture a frame from the camera feed.');
        setState('error');
        return;
      }
      void sendCapture(frame);
    }, COUNTDOWN_SECONDS * 1000);
  }, [captureFrame, sendCapture]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamRef.current = stream;
        scheduleCapture();
      } catch (cameraError) {
        const message = cameraError instanceof Error ? cameraError.message : 'Unable to access camera';
        setError(message || 'Unable to access camera. Please verify browser permissions.');
        setState('error');
      }
    };

    void startCamera();

    return () => {
      stopCamera();
    };
  }, [scheduleCapture, stopCamera]);

  const retryCapture = () => {
    setError(null);
    cleanupTimers();
    scheduleCapture();
  };

  return (
    <div className="app-shell">
      <div className="camera-wrapper">
        <div className="video-shell">
          <video ref={videoRef} autoPlay playsInline muted />
          {state !== 'success' && state !== 'error' && (
            <div className="countdown-chip">{countdown}</div>
          )}
        </div>

        <div className="capture-status">
          <strong>
            {state === 'capturing'
              ? 'Uploading capture...'
              : state === 'success'
                ? 'Capture uploaded successfully'
                : state === 'error'
                  ? 'Capture failed'
                  : 'Capture scheduled'}
          </strong>
          {state === 'countdown' && <p>Hold steady. A frame will be captured automatically.</p>}
          {state === 'capturing' && <p>Sending the captured frame to the server.</p>}
          {state === 'success' && <p>Processing results...</p>}
          {state === 'error' && <p>{error ?? 'An unexpected error occurred while capturing the frame.'}</p>}
        </div>

        {state === 'error' ? (
          <>
            <button type="button" className="secondary-button" onClick={retryCapture}>
              Try Again
            </button>
            <button type="button" className="secondary-button" onClick={onCancel}>
              Back To Room Code
            </button>
          </>
        ) : (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default CameraScreen;
