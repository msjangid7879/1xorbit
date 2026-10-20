import React, { useState } from 'react';
import api from '../services/api';
import { X, User, Save, Upload } from 'lucide-react';

export default function UserProfileModal({ currentUser, onClose, onUpdateSuccess }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profilePic, setProfilePic] = useState(currentUser?.profile_pic || '');
  const [loading, setLoading] = useState(false);

  // Handle local image file selection & convert to Base64
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/auth/users/${currentUser.id}`, {
        name,
        bio,
        profile_pic: profilePic
      });
      if (res.data) {
        onUpdateSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111827] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <User size={16} className="text-indigo-400" /> Edit Profile
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-4">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xl overflow-hidden border border-slate-700 shadow-inner shrink-0">
              {profilePic ? (
                <img src={profilePic} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'M'
              )}
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Profile Picture (Upload Image)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500" required />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Bio / About</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows="3" placeholder="A short bio about yourself..." className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-xl text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-1.5 shadow-lg shadow-indigo-600/30">
              <Save size={14} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}