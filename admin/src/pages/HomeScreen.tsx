import { Camera, UserCircle, LogOut } from 'lucide-react';

interface HomeScreenProps {
  user: { email: string; user_id: string };
  onNavigate: (screen: 'register-face' | 'live-camera') => void;
  onLogout: () => void;
}

const HomeScreen = ({ user, onNavigate, onLogout }: HomeScreenProps) => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <div className='flex items-center gap-3 mb-2'>
            <img src="/logo.png" alt="DeepVision Logo" className="w-12 h-12 mb-4 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md" />
            <h1 className="text-4xl font-bold text-white mb-2">DeepVision</h1>
            </div>
            <div className="flex items-center gap-2">
            <p className="text-slate-300">Welcome back, {user.email}</p>
            {/* 👋 */}
            <span className="text-3xl">👋</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => onNavigate('register-face')}
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600/20 to-cyan-500/20 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-300 text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-300"></div>

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCircle className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Register Face</h2>
              <p className="text-slate-300 leading-relaxed">
                Upload or capture your face image to register it in the system for future verification.
              </p>

              <div className="mt-6 flex items-center gap-2 text-cyan-400 font-semibold group-hover:gap-3 transition-all">
                Get Started
                <span className="text-xl">→</span>
              </div>
            </div>
          </button>

          <button
            onClick={() => onNavigate('live-camera')}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-600/20 to-teal-500/20 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:from-emerald-600/30 hover:to-teal-500/30 transition-all duration-300 text-left"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all duration-300"></div>

            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">Live Camera</h2>
              <p className="text-slate-300 leading-relaxed">
                Use your camera to verify your identity in real-time against registered faces.
              </p>

              <div className="mt-6 flex items-center gap-2 text-teal-400 font-semibold group-hover:gap-3 transition-all">
                Start Verification
                <span className="text-xl">→</span>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-12 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-3">How It Works</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div>
                <p className="text-slate-200 font-medium mb-1">Register Your Face</p>
                <p className="text-sm text-slate-400">Capture or upload a clear photo of your face</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-emerald-400 font-bold">2</span>
              </div>
              <div>
                <p className="text-slate-200 font-medium mb-1">Verify Identity</p>
                <p className="text-sm text-slate-400">Use live camera to verify against registered faces</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
