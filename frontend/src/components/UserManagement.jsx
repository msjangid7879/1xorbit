import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, PlusCircle, Trash2, Edit2, Shield, X, Search } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const isAdmin = currentUser?.is_company_admin;

  // Toggle Form Visibility State
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State (Used for both Add & Edit)
  const [editingUserId, setEditingUserId] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Operations');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [tempImage, setTempImage] = useState(null);

  // Permissions State (All 6 Sidebar Tabs)
  const [permissions, setPermissions] = useState({
    can_view_dashboard: true,
    can_view_master_tasks: false,
    can_view_tasks_board: true,
    can_view_chats: true,
    can_view_scorecards: false,
    can_manage_users: false
  });

  const fetchUsers = async () => {
    try {
      const tenantId = currentUser?.tenant_id || 1;
      const res = await api.get(`/auth/users?tenant_id=${tenantId}`);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [currentUser]);

  // Handle Image File Select for Cropper
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const tenantId = currentUser?.tenant_id || 1;

      if (editingUserId) {
        await api.put(`/auth/users/${editingUserId}`, {
          name,
          email,
          phone,
          department,
          role: 'Employee',
          bio,
          profile_pic: profilePic,
          permissions
        });
        alert('User updated successfully!');
      } else {
        await api.post('/auth/users', {
          tenant_id: tenantId,
          username,
          password,
          name,
          email,
          phone,
          role: 'Employee',
          department,
          bio,
          profile_pic: profilePic,
          permissions
        });
        alert('Employee account created successfully!');
      }

      resetForm();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setEditingUserId(null);
    setUsername('');
    setPassword('');
    setName('');
    setEmail('');
    setPhone('');
    setDepartment('Operations');
    setBio('');
    setProfilePic('');
    setTempImage(null);
    setPermissions({
      can_view_dashboard: true,
      can_view_master_tasks: false,
      can_view_tasks_board: true,
      can_view_chats: true,
      can_view_scorecards: false,
      can_manage_users: false
    });
    setShowAddForm(false);
  };

  const handleOpenEdit = (u) => {
    setEditingUserId(u.id);
    setUsername(u.username);
    setName(u.name || '');
    setEmail(u.email || '');
    setPhone(u.phone || '');
    setDepartment(u.department || 'Operations');
    setBio(u.bio || '');
    setProfilePic(u.profile_pic || '');
    setPassword('');
    try {
      const p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {});
      setPermissions(p);
    } catch (e) {
      setPermissions({});
    }
    setShowAddForm(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter users based on search term and department
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || u.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  if (!isAdmin) {
    return (
      <div className="p-8 bg-[#0b0f19] min-h-screen text-slate-100 flex items-center justify-center">
        <div className="bg-[#111827] border border-slate-800 p-8 rounded-2xl text-center space-y-3 max-w-md">
          <Shield className="mx-auto text-amber-400" size={32} />
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-xs text-slate-400">Only Company Admins can manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#0b0f19] min-h-screen text-slate-100">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User & Access Management</h1>
          <p className="text-sm text-slate-400 mt-1">Create employee login credentials and control precise sidebar module permissions.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
        >
          <PlusCircle size={16} /> Add New Employee
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111827] border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by name or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-medium">Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-[#0b0f19] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Departments</option>
            <option value="Operations">Operations</option>
            <option value="Jewellery Tech">Jewellery Tech</option>
            <option value="Back-Office">Back-Office</option>
            <option value="Management">Management</option>
          </select>
        </div>
      </div>

      {/* Unified Add / Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl w-full max-w-2xl space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PlusCircle size={18} className="text-indigo-400" />
                {editingUserId ? `Edit User & Rights: ${username}` : 'Add New Employee & Assign Rights'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={18} /></button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Login Username</label>
                  <input type="text" placeholder="e.g. ravi_ops" value={username} onChange={(e) => setUsername(e.target.value)} disabled={editingUserId} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none disabled:opacity-50" required />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Login Password {editingUserId && '(Leave blank)'}</label>
                  <input type="password" placeholder="******" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none" required={!editingUserId} />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Full Name</label>
                  <input type="text" placeholder="Ravi Suthar" value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Email</label>
                  <input type="email" placeholder="ravi@company.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Phone</label>
                  <input type="text" placeholder="+919876543210" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Department</label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none">
                    <option>Operations</option>
                    <option>Jewellery Tech</option>
                    <option>Back-Office</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>

              {/* Profile Picture Upload & Bio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white overflow-hidden shrink-0 border border-slate-700">
                    {profilePic ? (
                      <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      name ? name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 font-medium mb-1 block">Profile Picture</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium mb-1 block">Bio (Optional)</label>
                  <input type="text" placeholder="Short bio..." value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-[#0b0f19] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none" />
                </div>
              </div>

              {/* All 6 Module Permissions Checkboxes */}
              <div className="pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-3">Module & Feature Permissions (All 6 Sidebar Tabs)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_view_dashboard === true} onChange={(e) => setPermissions({ ...permissions, can_view_dashboard: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>Dashboard Overview</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_view_master_tasks === true} onChange={(e) => setPermissions({ ...permissions, can_view_master_tasks: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>Master Tasks & Penalty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_view_tasks_board === true} onChange={(e) => setPermissions({ ...permissions, can_view_tasks_board: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>Tasks Board</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_view_chats === true} onChange={(e) => setPermissions({ ...permissions, can_view_chats: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>Chats & Channels</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_view_scorecards === true} onChange={(e) => setPermissions({ ...permissions, can_view_scorecards: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>Team Scorecards</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                    <input type="checkbox" checked={permissions.can_manage_users === true} onChange={(e) => setPermissions({ ...permissions, can_manage_users: e.target.checked })} className="rounded bg-slate-800 border-slate-700 text-indigo-600" />
                    <span>User Management Access</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-medium">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md">
                  {editingUserId ? 'Save Changes' : 'Create Employee Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cropper Modal */}
      {tempImage && (
        <ImageCropperModal
          imageSrc={tempImage}
          onClose={() => setTempImage(null)}
          onCropComplete={(croppedImg) => setProfilePic(croppedImg)}
        />
      )}

      {/* Users Table */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="font-bold text-slate-200">Registered Team Members & Permissions ({filteredUsers.length})</h3>
        </div>
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/40">
              <th className="p-4">User & Login ID</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Role & Dept</th>
              <th className="p-4">Active Rights</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-xs text-slate-500">No users found matching your filter</td>
              </tr>
            ) : (
              filteredUsers.map(u => {
                let p = {};
                try {
                  p = typeof u.permissions === 'string' ? JSON.parse(u.permissions) : (u.permissions || {});
                } catch (e) { p = {}; }

                return (
                  <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white flex items-center gap-3">
                        {u.profile_pic && u.profile_pic.trim() !== '' ? (
                          <img
                            src={u.profile_pic}
                            alt={u.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-sm shrink-0"
                            onError={(e) => { e.target.style.display = 'none'; }} // Fallback if image fails to load
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-xs text-white font-bold shrink-0 shadow-sm">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            {u.name} {u.is_company_admin && <span className="bg-indigo-950 text-indigo-400 text-[10px] px-2 py-0.5 rounded border border-indigo-800">Admin</span>}
                          </div>
                          <div className="text-xs text-slate-400 font-normal">Username: @{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-300">
                      <div>Email: {u.email || 'N/A'}</div>
                      <div>Phone: {u.phone || 'N/A'}</div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md">{u.department || 'Operations'}</span>
                    </td>
                    <td className="p-4 text-xs text-slate-300 space-y-0.5">
                      <div>Dashboard: {p.can_view_dashboard ? '✅' : '❌'}</div>
                      <div>Master Tasks: {p.can_view_master_tasks ? '✅' : '❌'}</div>
                      <div>Tasks Board: {p.can_view_tasks_board ? '✅' : '❌'}</div>
                      <div>Chats: {p.can_view_chats ? '✅' : '❌'}</div>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleOpenEdit(u)} className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg" title="Edit User">
                        <Edit2 size={14} />
                      </button>
                      {!u.is_company_admin && (
                        <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded-lg" title="Delete User">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}