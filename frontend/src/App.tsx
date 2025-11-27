import { useState, useEffect } from 'react';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import HomeScreen from './pages/HomeScreen';
import RegisterFaceScreen from './pages/RegisterFaceScreen';
import LiveCameraScreen from './pages/LiveCameraScreen';
import SystemsManagementScreen from './pages/SystemsManagementScreen';
import ManageFacesScreen from './pages/ManageFacesScreen';
import ViewSystemScreen from './pages/ViewSystemScreen';
import type { SystemRecord } from './types/system';

type Screen =
  | 'login'
  | 'register'
  | 'home'
  | 'register-face'
  | 'live-camera'
  | 'systems'
  | 'manage-faces'
  | 'view-system';

interface User {
  name: string;
  email: string;
  user_id: string;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [selectedSystem, setSelectedSystem] = useState<SystemRecord | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setCurrentScreen('systems');
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    console.log('User logged in:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setCurrentScreen('systems');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setSelectedSystem(null);
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
      case 'systems':
        return user ? (
          <SystemsManagementScreen
            user={user}
            onLogout={handleLogout}
            onManageFaces={(system) => {
              setSelectedSystem(system);
              setCurrentScreen('manage-faces');
            }}
            onViewSystem={(system) => {
              setSelectedSystem(system);
              setCurrentScreen('view-system');
            }}
          />
        ) : null;
      case 'manage-faces':
        return user && selectedSystem ? (
          <ManageFacesScreen
            userId={user.user_id}
            system={selectedSystem}
            onBack={() => setCurrentScreen('systems')}
          />
        ) : null;
      case 'view-system':
        return user && selectedSystem ? (
          <ViewSystemScreen
            userId={user.user_id}
            system={selectedSystem}
            onBack={() => setCurrentScreen('systems')}
          />
        ) : null;
      default:
        return null;
    }
  };

  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">{renderScreen()}</div>;
}

export default App;
