import React from 'react'
import "../../styles/home.css"
export default function Home() {
    const menuItems = [
  {
    id: 'live-camera',
    title: 'Live Camera',
    description: 'Monitor camera feeds in real-time',
    icon: "📷",
  },
  {
    id: 'faces',
    title: 'Faces',
    description: 'Manage recognized faces database',
    icon: "👥",
  },
  {
    id: 'alerts',
    title: 'Alerts',
    description: 'View security alerts & notifications',
    icon: "⚠️",
  },
  {
    id: 'reports',
    title: 'Reports',
    description: 'Generate security reports',
    icon: "📊",
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure system preferences',
    icon: "⚙️",
  },
  {
    id: 'profile',
    title: 'Profile',
    description: 'Manage your account details',
    icon: "👤",
  }
];
  return (
    <div className="home-main-container">
        <div className="logo-container">
            <h1>DeepVision</h1>
            <img src="/logo.png" alt="DeepVision Logo" className="logo-image" />
        </div>
        <div className="menu-grid">
            {menuItems.map(item => (
                <div key={item.id} className="menu-item">
                    <div className="menu-icon">{item.icon}</div>
                    <h2 className="menu-title">{item.title}</h2>
                    <p className="menu-description">{item.description}</p>
                </div>
            ))}
        </div>
    </div>
  )
}
