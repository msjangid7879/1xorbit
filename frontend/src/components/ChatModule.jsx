import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Send, Users, Plus, Check, CheckCheck, Paperclip, Mic, Square, X, ZoomIn, Trash2, Search, User } from 'lucide-react';

export default function ChatModule({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null); 
  const [newMessage, setNewMessage] = useState('');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [chatFilter, setChatFilter] = useState('All');

  // Profile View Modal State
  const [viewingProfileUser, setViewingProfileUser] = useState(null);

  // File & Voice State
  const [attachedFile, setAttachedFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Image Zoom Lightbox State
  const [zoomedImage, setZoomedImage] = useState(null);

  // Group creation modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchData = async () => {
    try {
      const tenantId = currentUser?.tenant_id || 1;
      const [msgRes, userRes, groupRes] = await Promise.all([
        api.get(`/chats?tenant_id=${tenantId}`).catch(() => ({ data: [] })),
        api.get(`/auth/users?tenant_id=${tenantId}`).catch(() => ({ data: [] })),
        api.get(`/chats/groups?tenant_id=${tenantId}`).catch(() => ({ data: [] }))
      ]);

      const allMsgs = Array.isArray(msgRes.data) ? msgRes.data : [];
      setMessages(allMsgs);

      const fetchedUsers = Array.isArray(userRes.data) ? userRes.data : (userRes.data.users || []);
      const filteredUsers = fetchedUsers.filter(u => u.id !== currentUser.id);
      setUsers(filteredUsers);
      
      const fetchedGroups = Array.isArray(groupRes.data) ? groupRes.data : [];
      setGroups(fetchedGroups);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark messages as read function
  const markMessagesAsRead = async (chat) => {
    if (!chat || chat.type !== 'user') return;
    try {
      // 1. Instantly update local state so unread badge clears immediately
      setMessages(prev => prev.map(m => {
        if (m.sender_id === chat.id && m.receiver_id === currentUser.id) {
          return { ...m, is_read: true };
        }
        return m;
      }));

      // 2. Call backend DB update route `/chats/read`
      await api.post('/chats/read', {
        sender_id: chat.id,
        receiver_id: currentUser.id
      }).catch(() => {});
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
    if (activeChat) {
      markMessagesAsRead(activeChat);
    }
    const interval = setInterval(() => {
      fetchData();
      if (activeChat) markMessagesAsRead(activeChat);
    }, 3000);
    return () => clearInterval(interval);
  }, [currentUser, activeChat]);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    markMessagesAsRead(chat);
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !attachedFile) || !activeChat) return;

    try {
      const tenantId = currentUser?.tenant_id || 1;
      await api.post('/chats', {
        tenant_id: tenantId,
        sender_id: currentUser.id,
        receiver_id: activeChat.type === 'user' ? activeChat.id : null,
        group_id: activeChat.type === 'group' ? activeChat.id : null,
        message: newMessage.trim() || (attachedFile?.type === 'audio' ? 'Voice Message' : `Sent file: ${attachedFile?.name}`),
        file_url: attachedFile ? attachedFile.url : null
      });
      setNewMessage('');
      setAttachedFile(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/chats/${msgId}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete message.');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedFile({
        url: reader.result,
        type: file.type.startsWith('image') ? 'image' : 'file',
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFile({
            url: reader.result,
            type: 'audio',
            name: 'Voice Note'
          });
        };
        reader.readAsDataURL(audioBlob);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert('Microphone access denied or not supported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      const tenantId = currentUser?.tenant_id || 1;
      const res = await api.post('/chats/groups', {
        tenant_id: tenantId,
        group_name: groupName,
        created_by: currentUser.id,
        members: [...selectedMembers, currentUser.id]
      });
      setGroupName('');
      setSelectedMembers([]);
      setShowGroupModal(false);
      fetchData();
      setActiveChat({ type: 'group', id: res.data.id, name: res.data.group_name, profile_pic: null });
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to calculate last message and unread count accurately
  const getChatMetadata = (chatItem) => {
    const chatMsgs = messages.filter(m => {
      if (chatItem.type === 'user') {
        return (m.sender_id === currentUser.id && m.receiver_id === chatItem.id) || 
               (m.sender_id === chatItem.id && m.receiver_id === currentUser.id);
      } else {
        return m.group_id === chatItem.id;
      }
    });

    const unreadCount = messages.filter(m => 
      chatItem.type === 'user' && 
      m.sender_id === chatItem.id && 
      m.receiver_id === currentUser.id && 
      !m.is_read
    ).length;

    if (chatMsgs.length === 0) return { lastMsg: 'No messages yet', unreadCount: 0 };
    const lastMsg = chatMsgs[chatMsgs.length - 1];
    return {
      lastMsg: lastMsg.message || 'Attachment',
      unreadCount
    };
  };

  // Combine Groups and Users into one Unified List
  const unifiedChatList = [
    ...groups.map(g => ({ type: 'group', id: g.id, name: g.group_name, profile_pic: g.profile_pic || null })),
    ...users.map(u => ({ type: 'user', id: u.id, name: u.name, profile_pic: u.profile_pic || null, username: u.username, role: u.role, department: u.department, email: u.email, phone: u.phone, bio: u.bio }))
  ];

  // Total Unread Count
  const totalUnreadCount = unifiedChatList.reduce((acc, item) => acc + getChatMetadata(item).unreadCount, 0);

  // Filter list based on search query and chat filter pills
  const filteredChatList = unifiedChatList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const meta = getChatMetadata(item);
    if (chatFilter === 'Groups') return item.type === 'group';
    if (chatFilter === 'Unread') return meta.unreadCount > 0;
    return true;
  });

  const filteredMessages = messages.filter(m => {
    if (!activeChat) return false;
    if (activeChat.type === 'user') return (m.sender_id === currentUser.id && m.receiver_id === activeChat.id) || (m.sender_id === activeChat.id && m.receiver_id === currentUser.id);
    if (activeChat.type === 'group') return m.group_id === activeChat.id;
    return false;
  });

  return (
    <div className="flex h-screen bg-[#0b0f19] text-slate-100 overflow-hidden flex-1">
      {/* Sidebar Unified Chats & Search */}
      <div className="w-80 bg-[#111827] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-sm">Chats & Channels</h2>
          <button onClick={() => setShowGroupModal(true)} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white" title="Create Group">
            <Plus size={16} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-800/60">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={15} />
            <input 
              type="text" 
              placeholder="Search or start a new chat" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0b0f19] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'All', label: 'All' },
              { id: 'Unread', label: `Unread ${totalUnreadCount > 0 ? totalUnreadCount : ''}` },
              { id: 'Groups', label: 'Groups' }
            ].map(filter => (
              <button 
                key={filter.id}
                onClick={() => setChatFilter(filter.id)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0 ${chatFilter === filter.id ? 'bg-indigo-600 text-white' : 'bg-slate-800/70 text-slate-400 hover:bg-slate-800'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Unified Chat List */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
          {filteredChatList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No chats found</div>
          ) : (
            filteredChatList.map(item => {
              const isActive = activeChat?.type === item.type && activeChat?.id === item.id;
              const { lastMsg, unreadCount } = getChatMetadata(item);

              return (
                <div 
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectChat(item)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 ${isActive ? 'bg-indigo-600/90 text-white shadow-md' : 'hover:bg-slate-800/50 text-slate-200'}`}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden border border-slate-700/80 shadow-sm relative">
                    {item.profile_pic ? (
                      <img src={item.profile_pic} alt={item.name} className="w-full h-full object-cover" />
                    ) : item.type === 'group' ? (
                      <Users size={18} />
                    ) : (
                      item.name ? item.name.charAt(0).toUpperCase() : 'U'
                    )}
                  </div>

                  {/* Name & Last Message */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-xs truncate">{item.name}</div>
                      {unreadCount > 0 && !isActive && (
                        <span className="bg-emerald-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-indigo-100 font-normal' : unreadCount > 0 ? 'text-emerald-400 font-semibold' : 'text-slate-400 font-light'}`}>
                      {lastMsg}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-[#0b0f19] ">
        <div className="p-4 bg-[#111827] border-b border-slate-800 flex justify-between items-center">
          <div>
            {activeChat ? (
              <div 
                onClick={() => {
                  if (activeChat.type === 'user') {
                    setViewingProfileUser(activeChat);
                  }
                }} 
                className={`flex items-center gap-3 ${activeChat.type === 'user' ? 'cursor-pointer group' : ''}`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden border border-slate-700 shadow-sm">
                  {activeChat.profile_pic ? (
                    <img src={activeChat.profile_pic} alt={activeChat.name} className="w-full h-full object-cover" />
                  ) : activeChat.type === 'group' ? (
                    <Users size={16} />
                  ) : (
                    activeChat.name ? activeChat.name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div>
                  <h3 className={`font-bold text-white text-sm ${activeChat.type === 'user' ? 'group-hover:text-indigo-400 transition-colors' : ''}`}>
                    {activeChat.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {activeChat.type === 'group' ? 'Group Channel' : 'Click to view profile'}
                  </p>
                </div>
              </div>
            ) : (
              <h3 className="font-bold text-white text-sm">Select a Chat</h3>
            )}
          </div>
        </div>

        {/* Message History */}
        <div className=" flex-1  overflow-y-auto no-scrollbar p-6 space-y-4 ">
          {!activeChat ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Select a user or group from the sidebar to start chatting.
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No messages yet. Send a message, image, or task command!
            </div>
          ) : (
            filteredMessages.map(m => {
              const isMe = m.sender_id === currentUser.id;
              const canDelete = isMe || currentUser?.is_company_admin;
              const isImage = m.file_url && (m.file_url.startsWith('data:image') || m.file_url.match(/\.(jpeg|jpg|png|gif)$/i));
              const isAudio = m.file_url && m.file_url.startsWith('data:audio');

              return (
                <div key={m.id} className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[11px] text-indigo-400 font-semibold mb-1">
                    {isMe ? 'You' : (m.sender_name || 'User')}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {canDelete && isMe && (
                      <button onClick={() => handleDeleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity" title="Delete Message">
                        <Trash2 size={14} />
                      </button>
                    )}
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-[#111827] border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                      {m.message && <p className="mb-1">{m.message}</p>}
                      {isImage && (
                        <div className="relative group/img cursor-pointer mt-1" onClick={() => setZoomedImage(m.file_url)}>
                          <img src={m.file_url} alt="Attachment" className="rounded-xl max-h-48 object-cover w-full hover:opacity-90 transition-opacity" />
                        </div>
                      )}
                      {isAudio && <audio controls src={m.file_url} className="mt-1 w-full h-8" />}
                    </div>
                    {canDelete && !isMe && (
                      <button onClick={() => handleDeleteMessage(m.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity" title="Delete Message">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                    <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    
                    {/* Read Status Ticks (WhatsApp Blue double ticks on read) */}
                    {isMe && (
                      m.is_read ? (
                        <CheckCheck size={14} className="text-sky-400 font-bold" title="Read" />
                      ) : (
                        <Check size={14} className="text-slate-400" title="Sent" />
                      )
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Attachment Preview */}
        {attachedFile && (
          <div className="px-4 py-2 bg-[#111827] border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {attachedFile.type === 'image' ? (
                <img src={attachedFile.url} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-slate-700" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-300 text-xs font-bold">FILE</div>
              )}
              <div>
                <p className="text-xs font-semibold text-white">{attachedFile.name}</p>
                <p className="text-[10px] text-slate-400">Ready to send</p>
              </div>
            </div>
            <button onClick={() => setAttachedFile(null)} className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg"><X size={18} /></button>
          </div>
        )}

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-[#111827] border-t border-slate-800 flex items-center gap-3">
          <label className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer" title="Attach Image or File">
            <Paperclip size={18} />
            <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
          </label>

          {isRecording ? (
            <button type="button" onClick={stopRecording} className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl flex items-center gap-2 animate-pulse" title="Stop Recording">
              <Square size={16} /> Stop
            </button>
          ) : (
            <button type="button" onClick={startRecording} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl" title="Record Voice Message">
              <Mic size={18} />
            </button>
          )}

          <input 
            type="text" 
            placeholder={isRecording ? "Recording voice note..." : "Type a message or use /task [Task Title]..."} 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isRecording || !activeChat}
            className="flex-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" disabled={!activeChat} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-600/35">
            <Send size={16} /> Send
          </button>
        </form>
      </div>

      {/* Image Zoom Lightbox Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setZoomedImage(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button onClick={() => setZoomedImage(null)} className="absolute -top-10 right-0 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-full"><X size={20} /></button>
            <img src={zoomedImage} alt="Zoomed Preview" className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* View User Profile Modal */}
      {viewingProfileUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2"><User size={16} className="text-indigo-400" /> User Profile</h3>
              <button onClick={() => setViewingProfileUser(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="flex flex-col items-center space-y-3 py-2">
              <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-2xl overflow-hidden border border-slate-700 shadow-inner">
                {viewingProfileUser.profile_pic ? (
                  <img src={viewingProfileUser.profile_pic} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  viewingProfileUser.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="text-center">
                <h4 className="font-bold text-white text-base">{viewingProfileUser.name}</h4>
                <p className="text-xs text-indigo-400 font-medium">@{viewingProfileUser.username} • {viewingProfileUser.role || 'Employee'}</p>
              </div>
            </div>
            <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-slate-400">Department:</span><span className="text-slate-200 font-medium">{viewingProfileUser.department || 'Operations'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Email:</span><span className="text-slate-200 font-medium">{viewingProfileUser.email || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Phone:</span><span className="text-slate-200 font-medium">{viewingProfileUser.phone || 'N/A'}</span></div>
              <div className="pt-2 border-t border-slate-800"><span className="text-slate-400 block mb-1">Bio:</span><p className="text-slate-300 italic">{viewingProfileUser.bio || 'No bio provided yet.'}</p></div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setViewingProfileUser(null)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Create New Chat Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Group Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Operations Core Team" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)} 
                  className="w-full mt-1 bg-[#0b0f19] border border-slate-700 rounded-xl px-3 py-2 text-sm text-white" 
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-2">Select Members</label>
                <div className="space-y-2 max-h-40 overflow-y-auto bg-[#0b0f19] p-3 rounded-xl border border-slate-800">
                  {users.map(u => (
                    <label key={u.id} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(u.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMembers([...selectedMembers, u.id]);
                          else setSelectedMembers(selectedMembers.filter(id => id !== u.id));
                        }}
                        className="rounded bg-slate-800 border-slate-700 text-indigo-600"
                      />
                      <span>{u.name} (@{u.username})</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowGroupModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">Create Group</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}