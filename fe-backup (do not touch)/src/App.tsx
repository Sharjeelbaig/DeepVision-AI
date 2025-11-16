import { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import HomeScreen from './components/HomeScreen';
import RegisterFaceScreen from './components/RegisterFaceScreen';
import LiveCameraScreen from './components/LiveCameraScreen';

type Screen = 'login' | 'register' | 'home' | 'register-face' | 'live-camera';

interface User {
  email: string;
  user_id: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentScreen('home');
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentScreen('login');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentScreen('register')}
          />
        );
      case 'register':
        return (
          <RegisterScreen
            onRegisterSuccess={() => setCurrentScreen('login')}
            onSwitchToLogin={() => setCurrentScreen('login')}
          />
        );
      case 'home':
        return (
          <HomeScreen
            user={user!}
            onNavigate={(screen) => setCurrentScreen(screen)}
            onLogout={handleLogout}
          />
        );
      case 'register-face':
        return (
          <RegisterFaceScreen
            user={user!}
            onBack={() => setCurrentScreen('home')}
          />
        );
      case 'live-camera':
        return (
          <LiveCameraScreen
            user={user!}
            onBack={() => setCurrentScreen('home')}
          />
        );
      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">{renderScreen()}</div>;
}

export default App;
