import React, { useState } from 'react';
import { ShieldCheck, UserCheck, PlusCircle, Search, Gift, Clock, History, CheckCircle2, Lock, KeyRound, LogOut, Eye, EyeOff } from 'lucide-react';
import { UserProfile, RechargeTransaction } from '../types';
import {
  getUsersDb,
  adminRechargeUser,
  createNewUser,
  getTransactionLogs,
  setActiveUserId
} from '../utils/minutesManager';

interface AdminPanelProps {
  onRefreshProfile: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshProfile }) => {
  // Passcode Security State
  const [inputPasscode, setInputPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    return sessionStorage.getItem('astroveda_admin_auth') === 'true';
  });
  const [authError, setAuthError] = useState('');

  // Admin Panel Data State
  const [searchQuery, setSearchQuery] = useState('');
  const [targetId, setTargetId] = useState('');
  const [addMinsInput, setAddMinsInput] = useState(30);
  const [adminNote, setAdminNote] = useState('Astrologer Consultation Grant');
  const [successMsg, setSuccessMsg] = useState('');

  // New User Creation Form
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newInitMins, setNewInitMins] = useState(15);

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPasscode.trim() === '9905122139') {
      setIsAuthorized(true);
      sessionStorage.setItem('astroveda_admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect Admin Passcode! Access Denied.');
    }
  };

  const handleLockAdmin = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem('astroveda_admin_auth');
    setInputPasscode('');
  };

  // Render Lock Screen if not authorized
  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20">
          <Lock className="w-8 h-8 text-indigo-400" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-serif text-white">Astrologer Admin Access</h2>
          <p className="text-xs text-gray-400">
            This panel is passcode protected. Enter secret code to assign minutes and manage accounts.
          </p>
        </div>

        <form onSubmit={handleVerifyPasscode} className="space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            <input
              type={showPasscode ? 'text' : 'password'}
              value={inputPasscode}
              onChange={(e) => {
                setInputPasscode(e.target.value);
                if (authError) setAuthError('');
              }}
              placeholder="Enter Admin Access Code"
              className="w-full pl-9 pr-10 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono tracking-widest focus:outline-none focus:border-indigo-500 text-center text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {authError && (
            <p className="text-xs text-rose-400 font-medium bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
              {authError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:brightness-110 cursor-pointer transition-all"
          >
            Authenticate Admin Access
          </button>
        </form>
      </div>
    );
  }

  const usersDb = getUsersDb();
  const allUsers = Object.values(usersDb);
  const txLogs = getTransactionLogs();

  const filteredUsers = allUsers.filter(
    (u) =>
      u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || addMinsInput <= 0) return;

    const res = adminRechargeUser(targetId, addMinsInput, 'Astrologer Admin', adminNote);
    if (res.success) {
      setSuccessMsg(res.message);
      onRefreshProfile();
      setTargetId('');
      setAddMinsInput(30);
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim()) return;
    createNewUser(newId, newName || 'Astro User', newInitMins);
    onRefreshProfile();
    setSuccessMsg(`Created user ID: ${newId.toUpperCase()} with ${newInitMins} Mins.`);
    setNewId('');
    setNewName('');
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" /> Astrologer Admin Control
            </span>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              User ID Minutes Management & Allocation
            </h1>
            <p className="text-xs text-gray-300">
              Search any User ID, grant consultation minutes, inspect logs, or provision new client accounts.
            </p>
          </div>

          <button
            onClick={handleLockAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/30 transition-all cursor-pointer self-start sm:self-center"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock Admin</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: Direct ID Grant Form & Create User */}
        <div className="space-y-6">
          {/* Grant Minutes Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white font-serif flex items-center gap-2 pb-2 border-b border-white/10">
              <Gift className="w-4 h-4 text-indigo-400" />
              <span>Grant Minutes to Specific User ID</span>
            </h3>

            <form onSubmit={handleGrantSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Target User ID</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="e.g. USER-9821 or CUST-108"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Consultation Minutes to Grant</label>
                <div className="flex gap-2 mb-2">
                  {[15, 30, 60, 120, 300].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAddMinsInput(m)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addMinsInput === m
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400'
                          : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      +{m}m
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={addMinsInput}
                  onChange={(e) => setAddMinsInput(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Grant Reason / Note</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110"
              >
                <Gift className="w-4 h-4" />
                <span>Grant {addMinsInput} Minutes Now</span>
              </button>
            </form>
          </div>

          {/* Provision New User ID Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-indigo-200 flex items-center gap-2 pb-2 border-b border-white/10">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Provision New User ID Account</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">User ID</label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="USER-777"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">User Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Vikram"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Initial Welcome Minutes</label>
                <input
                  type="number"
                  value={newInitMins}
                  onChange={(e) => setNewInitMins(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 font-bold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create User ID Account</span>
              </button>
            </form>
          </div>
        </div>

        {/* COLUMN 2: User Directory & Live Recharge Logs */}
        <div className="space-y-6">
          {/* Registered Users Directory */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-white">Registered Users Directory ({allUsers.length})</h3>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ID..."
                  className="w-full pl-8 pr-3 py-1 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-black/30 border border-white/5 text-xs"
                >
                  <div>
                    <div className="font-bold text-white">{user.name}</div>
                    <div className="font-mono text-[10px] text-gray-400">{user.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      {user.availableMinutes} Mins
                    </span>
                    <button
                      onClick={() => {
                        setTargetId(user.id);
                        setActiveUserId(user.id);
                        onRefreshProfile();
                      }}
                      className="px-2.5 py-1 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold hover:bg-indigo-500/30 cursor-pointer transition-all"
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recharge Logs */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-white/10">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Minutes Allocation Audit Log</span>
            </h3>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
              {txLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-2xl bg-black/30 border border-white/5 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-white">
                      {log.userId} <span className="font-normal text-gray-400">({log.userName})</span>
                    </div>
                    <div className="text-[10px] text-gray-400">{log.note || log.method}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-400">+{log.minutesAdded} Mins</div>
                    <div className="text-[9px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
