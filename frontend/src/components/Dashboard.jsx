import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, Trash2, MessageSquare, X, FilterX, Paperclip, Eye, Download, Edit3, UserCheck, UserPlus } from 'lucide-react';

export default function Dashboard({ currentUser, highlightedTaskId }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // New task form state & Modal toggle
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // Table View Filter State ("all", "assigned_by_me", "assigned_to_me")
  const [tableFilterTab, setTableFilterTab] = useState('all');

  // Edit Task State
  const [editingTask, setEditingTask] = useState(null);

  // Interactive Chart Filters State
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(null);
  const [selectedDeptFilter, setSelectedDeptFilter] = useState(null);
  const [selectedAssignedByFilter, setSelectedAssignedByFilter] = useState(null);
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState(null);

  // Attachment Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Task Conversation Modal State
  const [activeTaskForChat, setActiveTaskForChat] = useState(null);
  const [taskComments, setTaskComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const isAdmin = currentUser?.is_company_admin;
  const tenantId = currentUser?.tenant_id || 1;

  // Fetch Unread Comment Counts per Task
  const fetchUnreadCounts = async () => {
    try {
      const res = await api.get(`/task-comments/unread/counts?tenant_id=${tenantId}`);
      const countsMap = {};
      if (Array.isArray(res.data)) {
        res.data.forEach(item => {
          countsMap[item.task_id] = parseInt(item.unread_count, 10);
        });
      }
      setUnreadCounts(countsMap);
    } catch (err) {
      console.error('Error fetching unread counts:', err);
    }
  };

  const openTaskChat = async (task) => {
    setActiveTaskForChat(task);
    try {
      const res = await api.get(`/task-comments/${task.id}`);
      setTaskComments(Array.isArray(res.data) ? res.data : []);

      // Mark task comments as read when chat opens
      await api.post(`/task-comments/${task.id}/read`, {
        user_id: currentUser.id
      });

      // Refresh unread counts immediately
      fetchUnreadCounts();
    } catch (err) {
      console.error(err);
      setTaskComments([]);
    }
  };

  const fetchData = async () => {
    try {
      const [taskRes, masterRes, userRes] = await Promise.all([
        api.get(`/tasks?tenant_id=${tenantId}`),
        api.get(`/master-tasks?tenant_id=${tenantId}`).catch(() => ({ data: [] })),
        api.get(`/auth/users?tenant_id=${tenantId}`).catch(() => ({ data: [] }))
      ]);

      const existingTasks = taskRes.data;
      const masterTasks = masterRes.data;

      const todayObj = new Date();
      const todayStr = todayObj.toISOString().split('T')[0];
      const currentDayName = todayObj.toLocaleDateString('en-US', { weekday: 'long' });
      const currentDateNum = todayObj.getDate();

      for (const master of masterTasks) {
        const scheduleDay = master.schedule_day_date || master.day_date || 'Everyday';
        let isTodayScheduled = false;
        if (master.frequency === 'Daily' || scheduleDay === 'Everyday') {
          isTodayScheduled = true;
        } else if (master.frequency === 'Weekly') {
          isTodayScheduled = (scheduleDay.toLowerCase() === currentDayName.toLowerCase());
        } else if (master.frequency === 'Monthly') {
          const dayNumStr = parseInt(scheduleDay) || 1;
          isTodayScheduled = (currentDateNum === dayNumStr);
        }

        if (isTodayScheduled) {
          const alreadyExists = existingTasks.some(
            t => t.title.trim().toLowerCase() === master.title.trim().toLowerCase() &&
              t.is_master_task &&
              t.created_at && t.created_at.startsWith(todayStr)
          );

          if (!alreadyExists) {
            await api.post('/tasks', {
              tenant_id: tenantId,
              title: master.title,
              department: master.department || 'Operations',
              priority: 'Urgent',
              assignee_id: master.assignee_id,
              file_url: master.reference_image,
              status: 'Todo',
              is_master_task: true,
              created_by: null
            }).catch(err => console.error('Auto trigger error:', err));
          }
        }
      }

      const updatedTaskRes = await api.get(`/tasks?tenant_id=${tenantId}`);

      const filteredTasks = updatedTaskRes.data.filter(t => {
        if (!t.is_master_task) return true;
        const matchingMaster = masterTasks.find(m => m.title.trim().toLowerCase() === t.title.trim().toLowerCase());
        if (!matchingMaster) return true;

        const sched = matchingMaster.schedule_day_date || matchingMaster.day_date || 'Everyday';
        if (matchingMaster.frequency === 'Daily' || sched === 'Everyday') return true;
        if (matchingMaster.frequency === 'Weekly') {
          return sched.toLowerCase() === currentDayName.toLowerCase();
        }
        if (matchingMaster.frequency === 'Monthly') {
          return parseInt(sched) === currentDateNum;
        }
        return true;
      });

      setTasks(filteredTasks);
      setUsers(userRes.data);
      fetchUnreadCounts();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle File Selection
  const handleFileSelect = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileData = {
        url: reader.result,
        name: file.name,
        type: file.type.startsWith('image') ? 'image' : 'file'
      };
      if (isEditing) {
        setEditingTask({ ...editingTask, file_url: fileData.url });
      } else {
        setAttachedFile(fileData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAssigneeSelect = (e) => {
    const selectedUserId = e.target.value;
    setAssigneeId(selectedUserId);
    if (selectedUserId) {
      const selectedUser = users.find(u => String(u.id) === String(selectedUserId));
      if (selectedUser && selectedUser.department) {
        setDepartment(selectedUser.department);
      }
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await api.post('/tasks', {
        tenant_id: tenantId,
        title,
        department,
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId) : currentUser?.id,
        created_by: currentUser?.id,
        file_url: attachedFile ? attachedFile.url : null,
        status: 'Todo'
      });
      setTitle('');
      setAssigneeId('');
      setAttachedFile(null);
      setShowAssignModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to assign task.');
    }
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    try {
      await api.put(`/tasks/${editingTask.id}`, {
        title: editingTask.title,
        department: editingTask.department || 'Operations',
        priority: editingTask.priority || 'Medium',
        assignee_id: editingTask.assignee_id ? parseInt(editingTask.assignee_id) : null,
        file_url: editingTask.file_url || null,
        status: editingTask.status || 'Todo'
      });
      setEditingTask(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to update task.');
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTaskForChat) return;
    try {
      const res = await api.post(`/task-comments/${activeTaskForChat.id}`, {
        user_id: currentUser.id,
        comment: newComment
      });
      setTaskComments([...taskComments, res.data]);
      setNewComment('');
      fetchUnreadCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      await api.patch(`/tasks/${id}/status`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
      fetchData();
    }
  };

  const handleAssigneeChange = async (id, newAssigneeId) => {
    try {
      await api.patch(`/tasks/${id}/assignee`, { assignee_id: newAssigneeId ? parseInt(newAssigneeId) : null });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!isAdmin && task.is_master_task) {
      alert('Master tasks cannot be deleted by employees.');
      return;
    }
    if (!isAdmin && task.created_by !== currentUser?.id) {
      alert('You can only delete tasks created by you.');
      return;
    }
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${task.id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllFilters = () => {
    setSelectedStatusFilter(null);
    setSelectedDeptFilter(null);
    setSelectedAssignedByFilter(null);
    setSelectedPriorityFilter(null);
    setTableFilterTab('all');
  };

  const baseTasks = tasks.filter(t => {
    if (isAdmin) return true;
    return t.assignee_id === currentUser?.id || t.created_by === currentUser?.id;
  });

  let tabFilteredTasks = baseTasks.filter(t => {
    if (tableFilterTab === 'assigned_by_me') {
      return t.created_by === currentUser?.id;
    } else if (tableFilterTab === 'assigned_to_me') {
      return t.assignee_id === currentUser?.id;
    }
    return true;
  });

  const visibleTasks = tabFilteredTasks.filter(t => {
    if (selectedStatusFilter && t.status !== selectedStatusFilter) return false;
    if (selectedDeptFilter && (t.department || 'Operations') !== selectedDeptFilter) return false;
    if (selectedAssignedByFilter) {
      const creatorName = t.created_by_name || t.creator_name || currentUser?.name || 'Admin / System';
      if (creatorName !== selectedAssignedByFilter) return false;
    }
    if (selectedPriorityFilter && t.priority !== selectedPriorityFilter) return false;
    return true;
  });

  const totalTasks = baseTasks.length;
  const inProgressTasks = baseTasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks = baseTasks.filter(t => t.status === 'Pending History' || t.status === 'Todo' || t.status === 'Pending / Unfinished').length;
  const completedTasks = baseTasks.filter(t => t.status === 'Done').length;

  const todoCount = baseTasks.filter(t => t.status === 'Todo').length;
  const inProgressCount = inProgressTasks;
  const pendingHistoryCount = baseTasks.filter(t => t.status === 'Pending History' || t.status === 'Pending / Unfinished').length;
  const doneCount = completedTasks;

  const urgentCount = baseTasks.filter(t => t.priority === 'Urgent').length;
  const highCount = baseTasks.filter(t => t.priority === 'High').length;
  const mediumCount = baseTasks.filter(t => t.priority === 'Medium' || t.priority === 'Low').length;

  const opsCount = baseTasks.filter(t => t.department === 'Operations').length;
  const techCount = baseTasks.filter(t => t.department === 'Jewellery Tech').length;
  const backOfficeCount = baseTasks.filter(t => t.department === 'Back-Office').length;

  const assignedByCounts = {};
  baseTasks.forEach(t => {
    const creatorName = t.created_by_name || t.creator_name || currentUser?.name || 'Admin / System';
    assignedByCounts[creatorName] = (assignedByCounts[creatorName] || 0) + 1;
  });
  const assignedByColors = ['#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#84cc16'];

  const hasActiveFilters = selectedStatusFilter || selectedDeptFilter || selectedAssignedByFilter || selectedPriorityFilter || tableFilterTab !== 'all';
  const renderDonutChart = (data, activeFilter, setFilter) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0) {
      return (
        <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex items-center justify-center text-xs text-slate-500">
          No Data
        </div>
      );
    }

    let cumulativePercent = 0;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="relative w-28 h-28 flex items-center justify-center cursor-pointer group">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {data.map((item, index) => {
            if (item.value === 0) return null;
            const percent = (item.value / total) * 100;
            const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -((cumulativePercent / 100) * circumference);
            cumulativePercent += percent;
            const isSelected = activeFilter === item.rawLabel || activeFilter === item.label;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isSelected ? "20" : "16"}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                onClick={() => setFilter(isSelected ? null : (item.rawLabel || item.label))}
                className="transition-all duration-300 hover:opacity-80"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-base font-extrabold text-white">{total}</span>
          <span className="text-[9px] text-slate-400">Total</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-[#0b0f19] min-h-screen text-slate-100 no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { overflow: hidden; height: 100vh; }
      `}</style>

      {/* Header Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Automated master task monitoring, pending penalty logs, and employee performance scores.</p>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors shadow-md"
          >
            <FilterX size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-slate-400 font-medium">Total Tasks</p>
          <p className="text-3xl font-extrabold mt-2 text-white">{totalTasks}</p>
        </div>
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-rose-400 font-medium">Pending / Penalty Log</p>
          <p className="text-3xl font-extrabold mt-2 text-rose-500">{pendingTasks}</p>
        </div>
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-emerald-400 font-medium">Completed Tasks</p>
          <p className="text-3xl font-extrabold mt-2 text-emerald-500">{completedTasks}</p>
        </div>
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl shadow-sm">
          <p className="text-xs text-indigo-400 font-medium">In Progress</p>
          <p className="text-3xl font-extrabold mt-2 text-indigo-300">{inProgressTasks}</p>
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
        {/* Status Breakdown */}
        <div className={`bg-[#111827] border ${selectedStatusFilter ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-800'} p-4 rounded-2xl space-y-3 flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-200">1. Status Breakdown</h3>
            <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800">Click to Filter</span>
          </div>
          <div className="flex items-center justify-around py-1">
            {renderDonutChart([
              { label: 'Todo', rawLabel: 'Todo', value: todoCount, color: '#f59e0b' },
              { label: 'In Prog', rawLabel: 'In Progress', value: inProgressCount, color: '#6366f1' },
              { label: 'Pend', rawLabel: 'Pending / Unfinished', value: pendingHistoryCount, color: '#f43f5e' },
              { label: 'Done', rawLabel: 'Done', value: doneCount, color: '#10b981' }
            ], selectedStatusFilter, setSelectedStatusFilter)}
            <div className="space-y-1.5 text-[11px]">
              <div onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Todo' ? null : 'Todo')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-amber-500"></span><span className={selectedStatusFilter === 'Todo' ? 'text-indigo-400 font-bold' : 'text-slate-300'}>Todo ({todoCount})</span></div>
              <div onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'In Progress' ? null : 'In Progress')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-indigo-500"></span><span className={selectedStatusFilter === 'In Progress' ? 'text-indigo-400 font-bold' : 'text-slate-300'}>In Prog ({inProgressCount})</span></div>
              <div onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Pending / Unfinished' ? null : 'Pending / Unfinished')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-rose-500"></span><span className={selectedStatusFilter === 'Pending / Unfinished' ? 'text-indigo-400 font-bold' : 'text-slate-300'}>Pend ({pendingHistoryCount})</span></div>
              <div onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Done' ? null : 'Done')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-emerald-500"></span><span className={selectedStatusFilter === 'Done' ? 'text-indigo-400 font-bold' : 'text-slate-300'}>Done ({doneCount})</span></div>
            </div>
          </div>
        </div>

        {/* Department Breakdown (Admin Only) */}
        {isAdmin && (
          <div className={`bg-[#111827] border ${selectedDeptFilter ? 'border-purple-500 ring-1 ring-purple-500' : 'border-slate-800'} p-4 rounded-2xl space-y-3 flex flex-col justify-between`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-200">2. Dept Breakdown</h3>
              <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800">Click to Filter</span>
            </div>
            <div className="flex items-center justify-around py-1">
              {renderDonutChart([
                { label: 'Operations', rawLabel: 'Operations', value: opsCount, color: '#a855f7' },
                { label: 'Tech', rawLabel: 'Jewellery Tech', value: techCount, color: '#3b82f6' },
                { label: 'Back', rawLabel: 'Back-Office', value: backOfficeCount, color: '#ec4899' }
              ], selectedDeptFilter, setSelectedDeptFilter)}
              <div className="space-y-1.5 text-[11px]">
                <div onClick={() => setSelectedDeptFilter(selectedDeptFilter === 'Operations' ? null : 'Operations')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-purple-500"></span><span className={selectedDeptFilter === 'Operations' ? 'text-purple-400 font-bold' : 'text-slate-300'}>Ops ({opsCount})</span></div>
                <div onClick={() => setSelectedDeptFilter(selectedDeptFilter === 'Jewellery Tech' ? null : 'Jewellery Tech')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-blue-500"></span><span className={selectedDeptFilter === 'Jewellery Tech' ? 'text-purple-400 font-bold' : 'text-slate-300'}>Tech ({techCount})</span></div>
                <div onClick={() => setSelectedDeptFilter(selectedDeptFilter === 'Back-Office' ? null : 'Back-Office')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-pink-500"></span><span className={selectedDeptFilter === 'Back-Office' ? 'text-purple-400 font-bold' : 'text-slate-300'}>Back ({backOfficeCount})</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Assigned By Breakdown */}
        <div className={`bg-[#111827] border ${selectedAssignedByFilter ? 'border-cyan-500 ring-1 ring-cyan-500' : 'border-slate-800'} p-4 rounded-2xl space-y-3 flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-200">{isAdmin ? '3. Assigned By' : '2. Assigned By'}</h3>
            <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800">Click to Filter</span>
          </div>
          <div className="flex items-center justify-around py-1">
            {renderDonutChart(
              Object.keys(assignedByCounts).map((name, idx) => ({
                label: name,
                rawLabel: name,
                value: assignedByCounts[name],
                color: assignedByColors[idx % assignedByColors.length]
              })),
              selectedAssignedByFilter,
              setSelectedAssignedByFilter
            )}
            <div className="space-y-1.5 text-[11px] max-h-24 overflow-y-auto no-scrollbar">
              {Object.keys(assignedByCounts).map((name, idx) => (
                <div key={name} onClick={() => setSelectedAssignedByFilter(selectedAssignedByFilter === name ? null : name)} className="flex items-center gap-1.5 cursor-pointer hover:text-white">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: assignedByColors[idx % assignedByColors.length] }}></span>
                  <span className={selectedAssignedByFilter === name ? 'text-cyan-400 font-bold truncate max-w-[90px]' : 'text-slate-300 truncate max-w-[90px]'}>{name} ({assignedByCounts[name]})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className={`bg-[#111827] border ${selectedPriorityFilter ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-800'} p-4 rounded-2xl space-y-3 flex flex-col justify-between`}>
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-200">{isAdmin ? '4. Priority' : '3. Priority'}</h3>
            <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded border border-rose-800">Click to Filter</span>
          </div>
          <div className="flex items-center justify-around py-1">
            {renderDonutChart([
              { label: 'Urgent', rawLabel: 'Urgent', value: urgentCount, color: '#e11d48' },
              { label: 'High', rawLabel: 'High', value: highCount, color: '#d97706' },
              { label: 'Med/Low', rawLabel: 'Medium', value: mediumCount, color: '#0284c7' }
            ], selectedPriorityFilter, setSelectedPriorityFilter)}
            <div className="space-y-1.5 text-[11px]">
              <div onClick={() => setSelectedPriorityFilter(selectedPriorityFilter === 'Urgent' ? null : 'Urgent')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-rose-600"></span><span className={selectedPriorityFilter === 'Urgent' ? 'text-rose-400 font-bold' : 'text-slate-300'}>Urgent ({urgentCount})</span></div>
              <div onClick={() => setSelectedPriorityFilter(selectedPriorityFilter === 'High' ? null : 'High')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-amber-600"></span><span className={selectedPriorityFilter === 'High' ? 'text-rose-400 font-bold' : 'text-slate-300'}>High ({highCount})</span></div>
              <div onClick={() => setSelectedPriorityFilter(selectedPriorityFilter === 'Medium' ? null : 'Medium')} className="flex items-center gap-1.5 cursor-pointer hover:text-white"><span className="w-2 h-2 rounded-full bg-sky-600"></span><span className={selectedPriorityFilter === 'Medium' ? 'text-rose-400 font-bold' : 'text-slate-300'}>Med/Low ({mediumCount})</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Tracking & Penalty Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-wrap gap-3 justify-between items-center bg-slate-900/40">
          <div>
            <h3 className="font-bold text-slate-200">Task Tracking & Penalty Table</h3>
            <span className="text-xs text-slate-400">{visibleTasks.length} tasks shown {hasActiveFilters && '(Filtered)'}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-[#0b0f19] border border-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => setTableFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableFilterTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                All Tasks
              </button>
              <button
                onClick={() => setTableFilterTab('assigned_by_me')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableFilterTab === 'assigned_by_me' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <UserPlus size={14} /> Assigned By Me
              </button>
              <button
                onClick={() => setTableFilterTab('assigned_to_me')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tableFilterTab === 'assigned_to_me' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                <UserCheck size={14} /> Assigned To Me
              </button>
            </div>

            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <PlusCircle size={16} /> Assign New Task
            </button>
          </div>
        </div>

        {/* Scrollable Container */}
        <div className="max-h-[380px] overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-[#111827] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider z-10">
              <tr>
                <th className="p-4">Task Details</th>
                <th className="p-4">Assignee / Dept</th>
                <th className="p-4">Assigned By</th>
                <th className="p-4">Attachment</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {visibleTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No tasks found matching your filter.</td>
                </tr>
              ) : (
                visibleTasks.map(task => {
                  const canEditAssignee = isAdmin || (!task.is_master_task && task.created_by === currentUser?.id);
                  const canDelete = isAdmin || (!task.is_master_task && task.created_by === currentUser?.id);
                  const unreadCount = unreadCounts[task.id] || 0;

                  return (
                    <tr key={task.id} className={Number(highlightedTaskId) === Number(task.id) ? 'bg-indigo-900/60 border border-indigo-500' : 'hover:bg-slate-900/30'}>
                      <td className="p-4 font-medium text-slate-200">
                        {task.title}
                        {task.is_master_task && <span className="ml-2 text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded">Master</span>}
                      </td>
                      <td className="p-4 space-y-1">
                        {canEditAssignee ? (
                          <select
                            value={task.assignee_id || ''}
                            onChange={(e) => handleAssigneeChange(task.id, e.target.value)}
                            className="text-xs bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
                          >
                            <option value="">Unassigned</option>
                            {users.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs font-semibold text-slate-300 px-1">{task.assignee_name || 'Assigned'}</span>
                        )}
                        <div>
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{task.department}</span>
                        </div>
                      </td>
                      <td className="p-4 space-y-1">
                        <span className="font-semibold text-cyan-300 text-xs">
                          {task.created_by_name || task.creator_name || currentUser?.name || 'System-Generated'}
                        </span>
                        <div className="text-[10px] text-slate-500">Task Creator</div>
                      </td>
                      <td className="p-4">
                        {task.file_url ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewAttachment(task.file_url)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg flex items-center gap-1 text-xs"
                              title="Preview File"
                            >
                              <Eye size={14} /> Preview
                            </button>
                            <a
                              href={task.file_url}
                              download={`task_${task.id}_attachment`}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg flex items-center gap-1 text-xs"
                              title="Download File"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${task.priority === 'Urgent' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          task.priority === 'High' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-slate-800 text-slate-300'
                          }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border focus:outline-none ${task.status === 'Done' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                            (task.status === 'Pending History' || task.status === 'Pending / Unfinished') ? 'bg-rose-950 border-rose-800 text-rose-400' : 'bg-amber-950 border-amber-800 text-amber-400'
                            }`}
                        >
                          <option value="Todo">Todo</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          <option value="Pending / Unfinished">Pending / Unfinished</option>
                        </select>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {canEditAssignee && (
                          <button onClick={() => setEditingTask(task)} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg" title="Edit Task">
                            <Edit3 size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => handleDeleteTask(task)} className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded-lg" title="Delete Task">
                            <Trash2 size={14} />
                          </button>
                        )}

                        {/* Task Conversation Action Button with Unread Badge */}
                        <button
                          onClick={() => openTaskChat(task)}
                          className="relative p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Task Conversation"
                        >
                          <MessageSquare size={14} />
                          {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                              {unreadCount}
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign New Task Modal, Edit Modal, Preview Modal & Task Conversation Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PlusCircle size={18} className="text-indigo-400" /> Assign New Task
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Task Title</label>
                <input
                  type="text"
                  placeholder="Task Title (e.g. Office Cleaning)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Assignee User</label>
                  <select
                    value={assigneeId}
                    onChange={handleAssigneeSelect}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">Select Assignee User</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Department (Locked)</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={!!assigneeId}
                    className={`w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none ${assigneeId ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <option>Operations</option>
                    <option>Jewellery Tech</option>
                    <option>Back-Office</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Attachment</label>
                  <div className="flex items-center gap-2 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2">
                    <label className="cursor-pointer flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 w-full">
                      <Paperclip size={16} />
                      <span className="truncate">{attachedFile ? attachedFile.name : 'Attach File'}</span>
                      <input type="file" onChange={(e) => handleFileSelect(e, false)} className="hidden" />
                    </label>
                    {attachedFile && (
                      <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-rose-400 text-xs">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Assignee</label>
                  <select
                    value={editingTask.assignee_id || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee_id: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Priority</label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Attachment</label>
                <div className="flex items-center gap-2 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2">
                  <label className="cursor-pointer flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 w-full">
                    <Paperclip size={16} />
                    <span className="truncate">{editingTask.file_url ? 'Replace File' : 'Attach File'}</span>
                    <input type="file" onChange={(e) => handleFileSelect(e, true)} className="hidden" />
                  </label>
                  {editingTask.file_url && (
                    <button type="button" onClick={() => setEditingTask({ ...editingTask, file_url: null })} className="text-slate-400 hover:text-rose-400 text-xs">
                      Remove
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md">
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAttachment(null)}>
          <div className="relative max-w-3xl max-h-full">
            <button onClick={() => setPreviewAttachment(null)} className="absolute -top-10 right-0 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full">
              <X size={20} />
            </button>
            {previewAttachment.startsWith('data:image') || previewAttachment.match(/\.(jpeg|jpg|png|gif)$/i) ? (
              <img src={previewAttachment} alt="Task Attachment" className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
            ) : (
              <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl text-center space-y-4">
                <Paperclip size={48} className="text-indigo-400 mx-auto" />
                <p className="text-sm font-semibold text-white">Document Attachment</p>
                <a href={previewAttachment} download="task_attachment" className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-medium">
                  <Download size={14} /> Download Document
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Conversation Modal */}
      {activeTaskForChat && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg flex flex-col h-[500px] shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">Conversation: {activeTaskForChat.title}</h3>
                <p className="text-xs text-slate-400">Department: {activeTaskForChat.department}</p>
              </div>
              <button onClick={() => setActiveTaskForChat(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {taskComments.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                  No discussion yet on this task. Start the conversation below!
                </div>
              ) : (
                taskComments.map(c => {
                  const isMe = c.user_id === currentUser.id;
                  return (
                    <div key={c.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-400 mb-0.5">{isMe ? 'You' : c.user_name} (@{c.user_username})</span>
                      <div className={`max-w-xs px-3 py-2 rounded-xl text-xs ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none'}`}>
                        {c.comment}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-0.5">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendComment} className="p-3 bg-slate-900/60 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="Type a message about this task..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-medium shadow-md">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}