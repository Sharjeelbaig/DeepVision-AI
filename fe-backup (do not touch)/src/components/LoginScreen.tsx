import { useState } from 'react';
import { LogIn, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: { email: string; user_id: string }) => void;
  onSwitchToRegister: () => void;
}

const LoginScreen = ({ onLogin, onSwitchToRegister }: LoginScreenProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      const hasSuccessSignal = data.success === true;
      const hasUserPayload =
        !!data.user ||
        !!data.profile ||
        !!data.data?.user ||
        !!data.data?.profile ||
        !!data.session?.user;

      if (response.ok && (hasSuccessSignal || hasUserPayload)) {
        const resolveField = (paths: string[][]) => {
          for (const path of paths) {
            let current: any = data;
            for (const key of path) {
              if (current && typeof current === 'object' && key in current) {
                current = current[key];
              } else {
                current = undefined;
                break;
              }
            }
            if (current !== undefined && current !== null) {
              return String(current);
            }
          }
          return undefined;
        };

        const emailFromResponse =
          resolveField([
            ['user', 'email'],
            ['data', 'user', 'email'],
            ['data', 'profile', 'email'],
            ['profile', 'email'],
            ['session', 'user', 'email'],
            ['data', 'email'],
            ['email'],
          ]) || email;

        const idFromResponse =
          resolveField([
            ['user', 'id'],
            ['user', 'user_id'],
            ['user', 'uuid'],
            ['data', 'user', 'id'],
            ['data', 'user', 'user_id'],
            ['data', 'user', 'uuid'],
            ['data', 'profile', 'id'],
            ['data', 'profile', 'user_id'],
            ['data', 'profile', 'uuid'],
            ['profile', 'id'],
            ['profile', 'user_id'],
            ['session', 'user', 'id'],
            ['session', 'user', 'user_id'],
            ['session', 'user', 'uuid'],
            ['data', 'id'],
            ['data', 'user_id'],
            ['id'],
            ['user_id'],
          ]) || `session-${Date.now()}`;

        onLogin({ email: emailFromResponse, user_id: idFromResponse });
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center">
              <LogIn className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-white mb-2">Welcome Back</h1>
          <p className="text-center text-slate-300 mb-8">Sign in to access face recognition</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-300">
              Don't have an account?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
