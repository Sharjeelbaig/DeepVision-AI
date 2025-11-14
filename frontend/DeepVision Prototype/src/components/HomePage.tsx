import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Camera, Users, AlertTriangle, FileText, Settings, User, Shield, LogOut } from 'lucide-react';

interface HomePageProps {
  onLogout: () => void;
}

const menuItems = [
  {
    id: 'live-camera',
    title: 'Live Camera',
    description: 'Monitor camera feeds in real-time',
    icon: Camera,
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'faces',
    title: 'Faces',
    description: 'Manage recognized faces database',
    icon: Users,
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'alerts',
    title: 'Alerts',
    description: 'View security alerts & notifications',
    icon: AlertTriangle,
    color: 'from-red-500 to-red-600'
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Generate security reports',
    icon: FileText,
    color: 'from-green-500 to-green-600'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system preferences',
    icon: Settings,
    color: 'from-orange-500 to-orange-600'
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Manage your account details',
    icon: User,
    color: 'from-cyan-500 to-cyan-600'
  }
];

export function HomePage({ onLogout }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white text-xl">DeepVision</h1>
                <p className="text-slate-400 text-sm">Security Dashboard</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={onLogout}
              className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-white text-2xl mb-2">Welcome to DeepVision</h2>
          <p className="text-slate-400">
            Your intelligent facial recognition security system for intruder detection
          </p>
        </div>

        {/* Grid of Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="border-slate-800 bg-slate-900/50 backdrop-blur hover:bg-slate-900/70 transition-all cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white mb-1">{item.title}</h3>
                      <p className="text-slate-400 text-sm">{item.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Status Bar */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Cameras</p>
                  <p className="text-white text-2xl mt-1">8</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Registered Faces</p>
                  <p className="text-white text-2xl mt-1">142</p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Alerts Today</p>
                  <p className="text-white text-2xl mt-1">3</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
