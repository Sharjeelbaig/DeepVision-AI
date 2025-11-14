import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
  onSwitchToRegister: () => void;
}

export function Login({ onLogin, onSwitchToRegister }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-white text-3xl">DeepVision</h1>
          <p className="text-slate-400 mt-2">Advanced Security Monitoring</p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your security dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="button" className="text-sm text-blue-400 hover:text-blue-300">
                Forgot password?
              </button>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In
              </Button>
              <div className="text-sm text-slate-400 text-center">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Create one
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
