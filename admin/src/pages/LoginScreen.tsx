import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { User } from '../types/user';

interface LoginScreenProps {
  onLogin: (user: User) => void;
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
      const response = await fetch(import.meta.env.VITE_API_URL + '/auth/login', {
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
        const resolveField = (paths: (string | number)[][]) => {
          for (const path of paths) {
            let current: any = data;
            for (const key of path) {
              const keyName = String(key);
              if (current && typeof current === 'object' && keyName in current) {
                current = current[keyName];
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

        const decodeSubjectFromToken = (tokenValue?: string) => {
          if (!tokenValue) {
            return undefined;
          }
          const segments = tokenValue.split('.');
          if (segments.length < 2) {
            return undefined;
          }
          const normalised = segments[1].replace(/-/g, '+').replace(/_/g, '/');
          const padded = normalised.padEnd(normalised.length + ((4 - (normalised.length % 4)) % 4), '=');
          try {
            const payload = JSON.parse(atob(padded));
            return typeof payload.sub === 'string' ? payload.sub : undefined;
          } catch (jwtError) {
            console.error('Failed to decode JWT payload', jwtError);
            return undefined;
          }
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

        const nameFromResponse =
          resolveField([
            ['user', 'user_metadata', 'full_name'],
            ['user', 'user_metadata', 'name'],
            ['user', 'full_name'],
            ['user', 'name'],
            ['data', 'profile', 'full_name'],
            ['data', 'profile', 'name'],
            ['profile', 'full_name'],
            ['profile', 'name'],
            ['user_metadata', 'full_name'],
            ['user_metadata', 'name'],
          ]);

        const avatarFromResponse =
          resolveField([
            ['user', 'user_metadata', 'avatar_url'],
            ['user', 'user_metadata', 'avatar'],
            ['user', 'avatar_url'],
            ['user', 'avatar'],
            ['data', 'profile', 'image_url'],
            ['data', 'profile', 'avatar_url'],
            ['profile', 'image_url'],
            ['profile', 'avatar_url'],
          ]);

        const tokenFromResponse = resolveField([
          ['token'],
          ['data', 'token'],
          ['access_token'],
          ['data', 'access_token'],
          ['session', 'access_token'],
        ]);

        const idFromResponse =
          resolveField([
            ['user', 'id'],
            ['user', 'user_id'],
            ['user', 'uuid'],
            ['user', 'user_metadata', 'sub'],
            ['user', 'identities', 0, 'user_id'],
            ['user', 'identities', 0, 'id'],
            ['user', 'identities', 0, 'identity_data', 'sub'],
            ['data', 'user', 'id'],
            ['data', 'user', 'user_id'],
            ['data', 'user', 'uuid'],
            ['data', 'user', 'user_metadata', 'sub'],
            ['data', 'user', 'identities', 0, 'user_id'],
            ['data', 'profile', 'id'],
            ['data', 'profile', 'user_id'],
            ['data', 'profile', 'uuid'],
            ['profile', 'id'],
            ['profile', 'user_id'],
            ['session', 'user', 'id'],
            ['session', 'user', 'user_id'],
            ['session', 'user', 'uuid'],
            ['session', 'user', 'user_metadata', 'sub'],
            ['data', 'id'],
            ['data', 'user_id'],
            ['user_metadata', 'sub'],
            ['id'],
            ['user_id'],
          ]) || decodeSubjectFromToken(tokenFromResponse) || `session-${Date.now()}`;

        const fallbackName = nameFromResponse && nameFromResponse.trim()
          ? nameFromResponse.trim()
          : emailFromResponse.includes('@')
            ? emailFromResponse.split('@')[0]
            : emailFromResponse;

        onLogin({
          name: fallbackName,
          email: emailFromResponse,
          user_id: idFromResponse,
          profileImageUrl: avatarFromResponse && avatarFromResponse.trim() ? avatarFromResponse.trim() : undefined,
        });
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
              {/*<LogIn className="w-8 h-8 text-white" />*/}
              <img src="/logo.png" alt="DeepVision Logo" className="absolute w-10 h-10" />
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
