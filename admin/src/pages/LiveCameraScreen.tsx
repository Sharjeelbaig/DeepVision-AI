import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Camera, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface LiveCameraScreenProps {
  user: { email: string; user_id: string };
  onBack: () => void;
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'not-verified' | 'no-face';

const LiveCameraScreen = ({ user, onBack }: LiveCameraScreenProps) => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [error, setError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      startVerification();
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const captureFrame = (): string | null => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg');
      }
    }
    return null;
  };

  const verifyFace = async () => {
    const frame = captureFrame();
    if (!frame) return;
import.meta.env.VITE_API_URL
    setStatus('verifying');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/face/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          image_data: frame,
        }),
      });

      const data = await response.json();

      const confidenceScore = (() => {
        if (typeof data.confidence === 'number') return data.confidence;
        if (typeof data.confidence === 'string') {
          const parsed = parseFloat(data.confidence);
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      })();

      const isMatch = Boolean(
        data.verified === true ||
          data.isMatch === true ||
          (typeof data.result === 'string' && data.result.toLowerCase() === 'ok')
      );

      const noFaceDetected = Boolean(
        typeof data.error === 'string' && data.error.toLowerCase().includes('no face')
      );

      if (response.ok) {
        if (isMatch) {
          setStatus('verified');
          setConfidence(confidenceScore);
        } else if (noFaceDetected) {
          setStatus('no-face');
          setConfidence(null);
        } else {
          setStatus('not-verified');
          setConfidence(confidenceScore);
        }
      } else {
        setStatus(noFaceDetected ? 'no-face' : 'not-verified');
        setConfidence(confidenceScore);
      }
    } catch (err) {
      setError('Network error. Please ensure the backend is running.');
      setStatus('idle');
    }
  };

  const startVerification = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      verifyFace();
    }, 2000);
  };

  const getStatusColor = () => {
    switch (status) {
      case 'verified':
        return 'border-emerald-500';
      case 'not-verified':
        return 'border-red-500';
      case 'no-face':
        return 'border-yellow-500';
      default:
        return 'border-white/20';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-8 h-8 text-emerald-400" />;
      case 'not-verified':
        return <XCircle className="w-8 h-8 text-red-400" />;
      case 'no-face':
        return <AlertCircle className="w-8 h-8 text-yellow-400" />;
      default:
        return <Camera className="w-8 h-8 text-slate-400" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verifying':
        return 'Verifying...';
      case 'verified':
        return 'Verified ✓';
      case 'not-verified':
        return 'Not Verified';
      case 'no-face':
        return 'No Face Detected';
      default:
        return 'Ready';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-500/20 border-emerald-500/50';
      case 'not-verified':
        return 'bg-red-500/20 border-red-500/50';
      case 'no-face':
        return 'bg-yellow-500/20 border-yellow-500/50';
      default:
        return 'bg-white/5 border-white/20';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">Live Camera Feed</h2>
              <div className={`relative bg-black rounded-lg overflow-hidden border-4 transition-colors duration-300 ${getStatusColor()}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full"
                  style={{ transform: 'scaleX(-1)' }}
                />

                <div className="absolute top-4 left-4">
                  <div className={`px-4 py-2 rounded-lg backdrop-blur-lg border transition-colors ${getStatusBg()}`}>
                    <span className="text-white font-semibold">{getStatusText()}</span>
                  </div>
                </div>

                {status === 'verifying' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Verification Status</h2>

              <div className="flex flex-col items-center justify-center py-8">
                <div className="mb-4">
                  {getStatusIcon()}
                </div>
                <p className="text-2xl font-bold text-white mb-2">{getStatusText()}</p>
                {confidence !== null && (
                  <p className="text-slate-300">
                    Confidence: {(confidence * 100).toFixed(1)}%
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">User Info</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <p className="text-white font-medium">Active</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-3">Instructions</h2>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Position your face clearly in front of the camera</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Ensure good lighting conditions</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Verification runs automatically every 2 seconds</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>Make sure you've registered your face first</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveCameraScreen;
