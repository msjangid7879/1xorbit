import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PlusCircle, Trash2, X, Paperclip, Eye, Download, Edit3 } from 'lucide-react';

export default function MasterTasks({ currentUser }) {
  const [masterTasks, setMasterTasks] = useState([]);
  const [users, setUsers] = useState([]);

  // Form State
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [frequency, setFrequency] = useState('Daily');
  const [scheduleDayDate, setScheduleDayDate] = useState('Everyday');
  const [department, setDepartment] = useState('Operations');
  const [remarks, setRemarks] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);

  // Filters & Sorting
  const [filterFreq, setFilterFreq] = useState('All Frequencies');
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterUser, setFilterUser] = useState('All Users');
  const [sortOrder, setSortOrder] = useState('Newest First');

  // Preview Modal State
  const [previewAttachment, setPreviewAttachment] = useState(null);

  // Edit State
  const [editingTask, setEditingTask] = useState(null);

  const isAdmin = currentUser?.is_company_admin;

  const fetchMasterTasks = async () => {
    try {
      const tenantId = currentUser?.tenant_id || 1;
      const [taskRes, userRes] = await Promise.all([
        api.get(`/master-tasks?tenant_id=${tenantId}`),
        api.get(`/auth/users?tenant_id=${tenantId}`).catch(() => ({ data: [] }))
      ]);
      setMasterTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
      setUsers(Array.isArray(userRes.data) ? userRes.data : []);
    } catch (err) {
      console.error(err);
      setMasterTasks([]);
    }
  };

  useEffect(() => {
    fetchMasterTasks();
  }, [currentUser]);

  // Handle File Selection
  const handleFileSelect = (e, isEditing = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileData = reader.result;
      if (isEditing) {
        setEditingTask({ ...editingTask, reference_image: fileData });
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

  const handleFrequencyChange = (e) => {
    const newFreq = e.target.value;
    setFrequency(newFreq);
    if (newFreq === 'Daily') setScheduleDayDate('Everyday');
    else if (newFreq === 'Weekly') setScheduleDayDate('Monday');
    else if (newFreq === 'Monthly') setScheduleDayDate('1st');
  };

  const handleEditFrequencyChange = (e) => {
    const newFreq = e.target.value;
    if (!editingTask) return;
    let defaultDay = 'Everyday';
    if (newFreq === 'Weekly') defaultDay = 'Monday';
    else if (newFreq === 'Monthly') defaultDay = '1st';
    setEditingTask({ ...editingTask, frequency: newFreq, schedule_day_date: defaultDay });
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const tenantId = currentUser?.tenant_id || 1;
      await api.post('/master-tasks', {
        tenant_id: tenantId,
        title,
        assignee_id: assigneeId ? parseInt(assigneeId) : currentUser?.id,
        frequency,
        schedule_day_date: scheduleDayDate,
        department,
        remarks,
        reference_image: attachedFile || null
      });
      setTitle('');
      setAssigneeId('');
      setFrequency('Daily');
      setScheduleDayDate('Everyday');
      setRemarks('');
      setAttachedFile(null);
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to create master schedule.');
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;
    try {
      await api.put(`/master-tasks/${editingTask.id}`, {
        title: editingTask.title,
        assignee_id: editingTask.assignee_id ? parseInt(editingTask.assignee_id) : null,
        frequency: editingTask.frequency,
        schedule_day_date: editingTask.schedule_day_date,
        department: editingTask.department,
        remarks: editingTask.remarks,
        reference_image: editingTask.reference_image
      });
      setEditingTask(null);
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
      alert('Failed to update schedule.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this master schedule?')) return;
    try {
      await api.delete(`/master-tasks/${id}`);
      fetchMasterTasks();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Sort Logic
  const filteredTasks = masterTasks.filter(t => {
    if (filterFreq !== 'All Frequencies' && t.frequency !== filterFreq) return false;
    if (filterDept !== 'All Departments' && t.department !== filterDept) return false;
    if (filterUser !== 'All Users' && (t.assignee_name || '') !== filterUser) return false;
    return true;
  }).sort((a, b) => {
    if (sortOrder === 'Newest First') return b.id - a.id;
    return a.id - b.id;
  });

  return (
    <div className="p-6 space-y-6 bg-[#0b0f19] min-h-screen text-slate-100 no-scrollbar">
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { overflow: hidden; height: 100vh; }
      `}</style>

      {/* Header Banner */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Recurring Tasks & Auto-Penalties</h1>
        <p className="text-sm text-slate-400 mt-1">Configure automated recurring schedules, KPIs/Remarks, and reference images.</p>
      </div>

      {/* Setup New Master Recurring Task Form */}
      {isAdmin && (
        <div className="bg-[#111827] border border-slate-800 p-5 rounded-2xl mb-6 shadow-xl">
          {/* Aapka poora Setup New Master Recurring Task ka form yahan rahega */}

          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-400" /> Setup New Master Recurring Task
            </h3>
            <form onSubmit={handleCreateSchedule} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  placeholder="Master Task Title (e.g. Daily Cleaning)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <select
                  value={assigneeId}
                  onChange={handleAssigneeSelect}
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="">Select Assignee User</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>
                  ))}
                </select>
                <select
                  value={frequency}
                  onChange={handleFrequencyChange}
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
                <select
                  value={scheduleDayDate}
                  onChange={(e) => setScheduleDayDate(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                >
                  {frequency === 'Daily' && <option value="Everyday">Everyday</option>}
                  {frequency === 'Weekly' && (
                    <>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </>
                  )}
                  {frequency === 'Monthly' && (
                    Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={`${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`}>
                        {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                      </option>
                    ))
                  )}
                </select>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!!assigneeId}
                  className={`bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none ${assigneeId ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <option value="Operations">Operations</option>
                  <option value="Jewellery Tech">Jewellery Tech</option>
                  <option value="Back-Office">Back-Office</option>
                  <option value="Management">Management</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                <input
                  type="text"
                  placeholder="Remarks / KPI (e.g. 100% accuracy required)"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2">
                    <label className="cursor-pointer flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 w-full">
                      <Paperclip size={16} />
                      <span className="truncate">{attachedFile ? 'Reference Image Attached' : 'Upload Reference Image'}</span>
                      <input type="file" onChange={(e) => handleFileSelect(e, false)} className="hidden" />
                    </label>
                  </div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow-md transition-all shrink-0">
                    Create Schedule
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter & Sort Bar */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-[#111827] border border-slate-800 p-3.5 rounded-2xl">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Filter By:</span>
          <select value={filterFreq} onChange={(e) => setFilterFreq(e.target.value)} className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white">
            <option>All Frequencies</option>
            <option>Daily</option>
            <option>Weekly</option>
            <option>Monthly</option>
          </select>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white">
            <option>All Departments</option>
            <option>Operations</option>
            <option>Jewellery Tech</option>
            <option>Back-Office</option>
            <option>Management</option>
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white">
            <option>All Users</option>
            {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Sort By:</span>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-[#0b0f19] border border-slate-700 rounded-lg px-2.5 py-1.5 text-white">
            <option>Newest First</option>
            <option>Oldest First</option>
          </select>
        </div>
      </div>

      {/* Active Master Schedules Table (Expanded height to fill blank space) */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
          <h3 className="font-bold text-slate-200 text-sm">Active Master Schedules</h3>
          <span className="text-xs text-slate-400">{filteredTasks.length} master tasks shown</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto no-scrollbar">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="sticky top-0 bg-[#111827] border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider z-10">
              <tr>
                <th className="p-4">Master Task & KPI (Remarks)</th>
                <th className="p-4">Assignee</th>
                <th className="p-4">Frequency</th>
                <th className="p-4">Day / Date</th>
                <th className="p-4">Department</th>
                <th className="p-4">Reference</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500">No master schedules found.</td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0" />
                        {task.title}
                      </div>
                      {task.remarks && <div className="text-[11px] text-slate-400 mt-0.5 italic">KPI: {task.remarks}</div>}
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-300">
                      {task.assignee_name ? `${task.assignee_name} (@${task.assignee_username})` : 'Unassigned'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2.5 py-1 rounded-lg">
                        {task.frequency}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-semibold text-amber-400">
                      {task.schedule_day_date || task.day_date || 'Everyday'}
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">
                        {task.department}
                      </span>
                    </td>
                    <td className="p-4">
                      {task.reference_image ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPreviewAttachment(task.reference_image)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg flex items-center gap-1 text-xs"
                            title="Preview Reference"
                          >
                            <Eye size={14} /> Preview
                          </button>
                          <a
                            href={task.reference_image}
                            download={`master_task_${task.id}_reference`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg flex items-center gap-1 text-xs"
                            title="Download Reference"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-600">None</span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {isAdmin ? (
                        <>
                          <button onClick={() => setEditingMasterTask(task)} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg" title="Edit Master Task">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => handleDeleteMasterTask(task.id)} className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded-lg" title="Delete Master Task">
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-500 italic">View Only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference Image Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setPreviewAttachment(null)}>
          <div className="relative max-w-3xl max-h-full">
            <button onClick={() => setPreviewAttachment(null)} className="absolute -top-10 right-0 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full">
              <X size={20} />
            </button>
            <img src={previewAttachment} alt="Reference Attachment" className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* Edit Master Task Modal with Dynamic Day / Date */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Edit Master Schedule</h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Master Task Title</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
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
                  <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                  <select
                    value={editingTask.frequency}
                    onChange={handleEditFrequencyChange}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Day / Date</label>
                <select
                  value={editingTask.schedule_day_date || 'Everyday'}
                  onChange={(e) => setEditingTask({ ...editingTask, schedule_day_date: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none"
                >
                  {editingTask.frequency === 'Daily' && <option value="Everyday">Everyday</option>}
                  {editingTask.frequency === 'Weekly' && (
                    <>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </>
                  )}
                  {editingTask.frequency === 'Monthly' && (
                    Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={`${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`}>
                        {i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Remarks / KPI</label>
                <input
                  type="text"
                  value={editingTask.remarks || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, remarks: e.target.value })}
                  className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reference Image</label>
                <div className="flex items-center gap-2 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2">
                  <label className="cursor-pointer flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 w-full">
                    <Paperclip size={16} />
                    <span className="truncate">{editingTask.reference_image ? 'Replace Reference Image' : 'Upload Reference Image'}</span>
                    <input type="file" onChange={(e) => handleFileSelect(e, true)} className="hidden" />
                  </label>
                  {editingTask.reference_image && (
                    <button type="button" onClick={() => setEditingTask({ ...editingTask, reference_image: null })} className="text-slate-400 hover:text-rose-400 text-xs">
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
                  Update Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}