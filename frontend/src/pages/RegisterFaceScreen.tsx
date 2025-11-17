import { useState, useRef } from 'react';
import { ArrowLeft, Upload, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import Commingsoonoverlay from '../components/Commingsoonoverlay';

interface RegisterFaceScreenProps {
  user: { email: string; user_id: string };
  onBack: () => void;
}

const RegisterFaceScreen = ({ user, onBack }: RegisterFaceScreenProps) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setPreviewImage(imageData);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    if (!previewImage) {
      setError('Please capture or upload an image first');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/face/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          image_data: previewImage,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onBack();
        }, 2000);
      } else {
        setError(data.error || 'Failed to register face');
      }
    } catch (err) {
      setError('Network error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </button>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-2">Register Your Face</h1>
          <p className="text-slate-300 mb-8">Capture or upload a clear photo of your face</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-200">Face registered successfully! Redirecting...</p>
            </div>
          )}

          {showCamera ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full"
                  style={{ transform: 'scaleX(-1)' }}
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 transition"
                >
                  Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : previewImage ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img src={previewImage} alt="Preview" className="w-full" />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading || success}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Register Face'}
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
                >
                  Retake
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={startCamera}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-500/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-300"
              >
                <Commingsoonoverlay />
                <Camera className="w-12 h-12 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Capture Photo</h3>
                <p className="text-sm text-slate-300">Use your camera to take a photo</p>
              </button>

              <label className="group relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-teal-500/20 backdrop-blur-lg border border-white/20 rounded-xl p-6 hover:from-emerald-600/30 hover:to-teal-500/30 transition-all duration-300 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-12 h-12 text-teal-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-semibold text-white mb-2">Upload Image</h3>
                <p className="text-sm text-slate-300">Choose a photo from your device</p>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFaceScreen;
