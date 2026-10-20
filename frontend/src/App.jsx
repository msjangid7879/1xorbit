import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MasterTasks from './components/MasterTasks';
import ChatModule from './components/ChatModule';
import UserManagement from './components/UserManagement';
import UserProfileModal from './components/UserProfileModal';

export default function App() {
  const [isLaunched, setIsLaunched] = useState(() => {
    return localStorage.getItem('isLaunched') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Profile Edit Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Smart default active tab based on user permissions
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const u = JSON.parse(savedUser);
      if (u.is_company_admin) return 'dashboard';
      let p = {};
      try { p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {}); } catch(e){}
      
      if (p.can_view_dashboard !== false) return 'dashboard';
      if (p.can_view_master_tasks === true) return 'master-tasks';
      if (p.can_assign_tasks === true) return 'tasks-board';
      if (p.can_view_chats === true) return 'chats';
    }
    return 'dashboard';
  });

  const [highlightedTaskId, setHighlightedTaskId] = useState(null);

  const handleUpdateProfileSuccess = (updatedUser) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
  };

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsLaunched(true);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('isLaunched', 'true');

    // Set initial tab based on permissions
    let p = {};
    try { p = typeof userData.permissions === 'string' ? JSON.parse(userData.permissions) : (userData.permissions || {}); } catch(e){}
    
    if (userData.is_company_admin || p.can_view_dashboard !== false) {
      setActiveTab('dashboard');
    } else if (p.can_view_master_tasks === true) {
      setActiveTab('master-tasks');
    } else if (p.can_assign_tasks === true) {
      setActiveTab('tasks-board');
    } else if (p.can_view_chats === true) {
      setActiveTab('chats');
    }
  };

  const handleLogout = () => {
    setIsLaunched(false);
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLaunched');
  };

  if (!isLaunched || !currentUser) {
    return <LandingPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex bg-[#0b0f19] text-slate-100 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        setHighlightedTaskId={setHighlightedTaskId}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      
      <main className="flex-1 overflow-y-auto no-scrollbar h-screen">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} highlightedTaskId={highlightedTaskId} />}
        {activeTab === 'master-tasks' && <MasterTasks currentUser={currentUser} />}
        {activeTab === 'tasks-board' && (
          <div className="p-8 text-white">
            <h2 className="text-xl font-bold">Tasks Kanban Board</h2>
          </div>
        )}
        {activeTab === 'chats' && <ChatModule currentUser={currentUser} />}
        {activeTab === 'scorecards' && (
          <div className="p-8 text-white">
            <h2 className="text-xl font-bold">Team Performance Scorecards</h2>
          </div>
        )}
        {activeTab === 'users' && <UserManagement currentUser={currentUser} />}
      </main>

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <UserProfileModal 
          currentUser={currentUser} 
          onClose={() => setShowProfileModal(false)}
          onUpdateSuccess={handleUpdateProfileSuccess}
        />
      )}
    </div>
  );
}