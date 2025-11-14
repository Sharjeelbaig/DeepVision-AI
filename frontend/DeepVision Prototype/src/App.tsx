import { useState } from 'react';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { HomePage } from './components/HomePage';

type Screen = 'login' | 'register' | 'home';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

  return (
    <div className="min-h-screen bg-slate-950">
      {currentScreen === 'login' && (
        <Login 
          onLogin={() => setCurrentScreen('home')}
          onSwitchToRegister={() => setCurrentScreen('register')}
        />
      )}
      {currentScreen === 'register' && (
        <Register 
          onRegister={() => setCurrentScreen('home')}
          onSwitchToLogin={() => setCurrentScreen('login')}
        />
      )}
      {currentScreen === 'home' && (
        <HomePage onLogout={() => setCurrentScreen('login')} />
      )}
    </div>
  );
}
