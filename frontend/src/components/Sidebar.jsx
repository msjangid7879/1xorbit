import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  MessageSquare,
  Award,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  CheckCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, setHighlightedTaskId, onOpenProfile }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [prevCount, setPrevCount] = useState(0);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master-tasks', label: 'Master Tasks & Penalty', icon: CalendarCheck },
    { id: 'tasks-board', label: 'Tasks Board', icon: CheckSquare },
    { id: 'chats', label: 'Chats & Channels', icon: MessageSquare },
    { id: 'scorecards', label: 'Team Scorecards', icon: Award },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
  ];

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const tenantId = currentUser?.tenant_id || 1;
      const res = await api.get(`/tasks?tenant_id=${tenantId}`);
      if (Array.isArray(res.data)) {
        const readIds = JSON.parse(localStorage.getItem(`read_notifications_${currentUser?.id}`) || '[]');
        const unreadTasks = res.data.filter(t =>
          (String(t.assignee_id) === String(currentUser?.id) || t.is_master_task) &&
          t.status !== 'Done' &&
          !readIds.includes(t.id)
        );

        if (prevCount > 0 && unreadTasks.length > prevCount) {
          playNotificationSound();
        }
        setPrevCount(unreadTasks.length);
        setNotifications(unreadTasks.slice(0, 5));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser, prevCount]);

  const handleNotificationClick = (notif) => {
    setShowDropdown(false);
    if (setHighlightedTaskId) setHighlightedTaskId(notif.id);
    setActiveTab('dashboard');

    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${currentUser?.id}`) || '[]');
    if (!readIds.includes(notif.id)) {
      readIds.push(notif.id);
      localStorage.setItem(`read_notifications_${currentUser?.id}`, JSON.stringify(readIds));
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
  };

  const handleMarkAllRead = () => {
    const readIds = JSON.parse(localStorage.getItem(`read_notifications_${currentUser?.id}`) || '[]');
    notifications.forEach(n => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem(`read_notifications_${currentUser?.id}`, JSON.stringify(readIds));
    setNotifications([]);
  };

  return (
    <div className={`bg-[#0b0f19] border-r border-slate-800/80 h-screen flex flex-col justify-between transition-all duration-300 relative select-none shrink-0 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-7 bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-full border-2 border-[#0b0f19] shadow-lg transition-transform hover:scale-110 z-30"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="p-4 space-y-6">
        {/* Clickable Profile Card with Image Support */}
        <div
          onClick={onOpenProfile}
          className={`flex items-center gap-3 px-2 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 relative cursor-pointer hover:border-indigo-500/50 transition-all ${isCollapsed ? 'justify-center' : 'justify-between'}`}
          title="Edit Profile"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-md overflow-hidden border border-slate-700">
              {currentUser?.profile_pic && currentUser.profile_pic.trim() !== '' ? (
                <img src={currentUser.profile_pic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'M'
              )}
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <div className="font-semibold text-xs text-slate-100 truncate">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 font-medium truncate">{currentUser?.role || 'Employee'}</div>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors relative"
              >
                <Bell size={16} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute left-0 mt-2 w-72 bg-[#111827] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/60">
                    <span className="font-bold text-xs text-slate-200">Unread Notifications</span>
                    {notifications.length > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">No unread notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <button key={notif.id} onClick={() => handleNotificationClick(notif)} className="w-full p-3 hover:bg-indigo-950/30 transition-colors text-left block">
                          <div className="font-medium text-xs text-slate-200 truncate">{notif.title}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] text-indigo-400 font-medium">{notif.is_master_task ? 'System-Generated' : 'Assigned Task'}</span>
                            <span className="text-[10px] text-amber-400 font-semibold">{notif.status || 'Todo'}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            if (item.adminOnly && !currentUser?.is_company_admin) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-medium transition-all group relative ${isActive ? 'bg-indigo-600/90 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'} ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon size={18} className={`shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80">
        <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
          <LogOut size={18} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}