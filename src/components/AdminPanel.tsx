import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  PlusCircle,
  Search,
  Gift,
  Clock,
  History,
  CheckCircle2,
  Lock,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  Users,
  Sparkles,
  AlertTriangle,
  Filter,
  Download,
  FileSpreadsheet,
  Key,
  MessageSquare,
  Activity,
  FileText,
  RefreshCw,
  X,
  Copy,
  ExternalLink
} from 'lucide-react';
import { UserProfile, RechargeTransaction, UserActivityLog } from '../types';
import {
  getUsersDb,
  adminRechargeUser,
  adminRechargeUserAsync,
  createNewUser,
  createNewUserAsync,
  syncAllUsersFromServer,
  getTransactionLogs,
  setActiveUserId,
  deleteUserAccount,
  updateUserMinutesDirectly,
  fetchUserById,
  fetchUserByIdAsync,
  adminResetUserPin,
  getUserActivityLogs,
  clearUserActivityLogs
} from '../utils/minutesManager';


interface AdminPanelProps {
  onRefreshProfile: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onRefreshProfile }) => {
  // Passcode Security State
  const [inputPasscode, setInputPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');

  // Admin Panel Tab State
  const [adminTab, setAdminTab] = useState<'USERS' | 'LOGS' | 'ACTIVITIES'>('USERS');

  // Admin Panel Data & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'GOOGLE' | 'CUSTOM'>('ALL');
  const [targetId, setTargetId] = useState('');
  const [addMinsInput, setAddMinsInput] = useState(30);
  const [actionType, setActionType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [adminNote, setAdminNote] = useState('Astrologer Consultation Adjustment');
  const [successMsg, setSuccessMsg] = useState('');

  // Syncing & Refresh State
  const [isSyncingUsers, setIsSyncingUsers] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Target User Live Lookup State
  const [asyncLookupUser, setAsyncLookupUser] = useState<UserProfile | null>(null);

  const handleSyncServerUsers = async () => {
    setIsSyncingUsers(true);
    try {
      await syncAllUsersFromServer();
      onRefreshProfile();
      setRefreshCounter(prev => prev + 1);
      setSuccessMsg('✅ Successfully synced all user accounts across devices from Cloud Server!');
    } catch (e) {
      console.error('Error syncing server users:', e);
      setSuccessMsg('❌ Error syncing with cloud server.');
    } finally {
      setIsSyncingUsers(false);
    }
  };

  // Live async lookup effect for targetId
  React.useEffect(() => {
    let active = true;
    const clean = targetId.trim();
    if (clean) {
      const local = fetchUserById(clean);
      if (local) {
        setAsyncLookupUser(local);
      } else {
        fetchUserByIdAsync(clean).then(res => {
          if (active) {
            setAsyncLookupUser(res);
            if (res) {
              setRefreshCounter(prev => prev + 1);
              onRefreshProfile();
            }
          }
        });
      }
    } else {
      setAsyncLookupUser(null);
    }
    return () => { active = false; };
  }, [targetId, refreshCounter]);

  // Edit Balance Modal State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [editMinutesValue, setEditMinutesValue] = useState<number>(0);

  // Delete User Confirmation State
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Reset User PIN State
  const [resettingUserPin, setResettingUserPin] = useState<UserProfile | null>(null);
  const [resetPinVal, setResetPinVal] = useState('1234');

  const handleResetUserPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUserPin) return;
    const res = adminResetUserPin(resettingUserPin.id, resetPinVal);
    onRefreshProfile();
    setSuccessMsg(res.message);
    setResettingUserPin(null);
  };

  // New User Creation Form
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newInitMins, setNewInitMins] = useState(15);
  const [newPin, setNewPin] = useState('1234');

  const handleExportCSV = () => {
    const users = Object.values(getUsersDb());
    const headers = ['User ID', 'Name', 'Email', 'Security PIN', 'Available Minutes', 'Total Recharged Mins', 'Account Type', 'Registration Date'];
    const rows = users.map(u => [
      `"${u.id}"`,
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${u.pin || '1234'}"`,
      u.availableMinutes ?? 0,
      u.totalRechargedMinutes ?? 0,
      `"${String(u.id).startsWith('G-') ? 'Google Auth' : 'Custom ID'}"`,
      `"${u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}"`
    ]);
    const csvStr = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AstroVeda_Users_Database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMsg('✅ User Database CSV downloaded! You can import this file directly into Google Sheets.');
  };

  const handleCopyForGoogleSheets = () => {
    const users = Object.values(getUsersDb());
    const headers = ['User ID', 'Name', 'Email', 'Security PIN', 'Available Minutes', 'Total Recharged Mins', 'Account Type', 'Registration Date'];
    const rows = users.map(u => [
      u.id,
      u.name || '',
      u.email || '',
      u.pin || '1234',
      u.availableMinutes ?? 0,
      u.totalRechargedMinutes ?? 0,
      String(u.id).startsWith('G-') ? 'Google Auth' : 'Custom ID',
      u.createdAt ? new Date(u.createdAt).toLocaleString() : ''
    ]);
    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setSuccessMsg('📋 Copied all User Data to Clipboard! Open Google Sheets (sheets.google.com) and press Ctrl+V to paste immediately.');
    }).catch(err => {
      console.error('Failed to copy TSV: ', err);
    });
  };

  const handleExportTxCSV = () => {
    const logs = getTransactionLogs() || [];
    const headers = ['Tx ID', 'User ID', 'User Name', 'Minutes Added', 'Amount Paid (INR)', 'Type', 'Payment Method', 'Notes', 'Timestamp'];
    const rows = logs.map(l => [
      `"${l.id}"`,
      `"${l.userId}"`,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      l.minutesAdded,
      l.amountPaid,
      `"${l.type}"`,
      `"${l.method || ''}"`,
      `"${(l.grantedBy || l.note || '').replace(/"/g, '""')}"`,
      `"${new Date(l.timestamp).toLocaleString()}"`
    ]);
    const csvStr = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `AstroVeda_Topup_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccessMsg('✅ Top-up Transactions CSV downloaded for Google Sheets!');
  };

  const handleVerifyPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    const validCodes = ['9905122139', '8800', '7860', '1008'];
    if (validCodes.includes(inputPasscode.trim())) {
      setIsAuthorized(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Admin Passcode! Access Denied.');
    }
  };

  const handleLockAdmin = () => {
    setIsAuthorized(false);
    setInputPasscode('');
  };

  // Auto-sync users from server continuously when authorized so newly registered IDs from other devices appear live
  React.useEffect(() => {
    if (!isAuthorized) return;

    syncAllUsersFromServer().then(() => {
      onRefreshProfile();
      setRefreshCounter(prev => prev + 1);
    });

    const timer = setInterval(() => {
      syncAllUsersFromServer().then(() => {
        onRefreshProfile();
        setRefreshCounter(prev => prev + 1);
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [isAuthorized]);

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
              className="absolute right-3 top-3 text-gray-400 hover:text-white cursor-pointer"
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

  const usersDb = getUsersDb() || {};
  const allUsers = Object.values(usersDb).filter((u): u is UserProfile => Boolean(u && u.id));
  const txLogs = (getTransactionLogs() || []).filter(Boolean);

  // Stats calculation
  const totalUsersCount = allUsers.length;
  const totalMinutesRemaining = allUsers.reduce((sum, u) => sum + (Number(u.availableMinutes) || 0), 0);
  const googleUsersCount = allUsers.filter((u) => u.id && String(u.id).startsWith('G-')).length;
  const customUsersCount = totalUsersCount - googleUsersCount;

  // Filtered Users List
  const filteredUsers = allUsers.filter((u) => {
    if (!u || !u.id) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      if (filterType === 'GOOGLE') return String(u.id).startsWith('G-');
      if (filterType === 'CUSTOM') return !String(u.id).startsWith('G-');
      return true;
    }

    const uId = String(u.id).toLowerCase();
    const uName = String(u.name || '').toLowerCase();
    const uEmail = String(u.email || '').toLowerCase();
    const uPin = String(u.pin || '').toLowerCase();

    const matchesQuery = uId.includes(q) || uName.includes(q) || uEmail.includes(q) || uPin.includes(q);
    if (!matchesQuery) return false;

    if (filterType === 'GOOGLE') return String(u.id).startsWith('G-');
    if (filterType === 'CUSTOM') return !String(u.id).startsWith('G-');
    return true;
  });

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId.trim() || addMinsInput <= 0) return;

    const res = await adminRechargeUserAsync(
      targetId,
      addMinsInput,
      'Astrologer Admin',
      adminNote || (actionType === 'ADD' ? 'Admin Grant Credit' : 'Admin Manual Deduction'),
      actionType
    );
    setSuccessMsg(res.message);
    if (res.success) {
      onRefreshProfile();
      setTargetId('');
      setAddMinsInput(30);
    }
  };

  const handleQuickAdjust = async (userId: string, mins: number, mode: 'ADD' | 'DEDUCT') => {
    const res = await adminRechargeUserAsync(
      userId,
      mins,
      'Astrologer Admin',
      mode === 'ADD' ? `Quick +${mins}m Credit` : `Quick -${mins}m Debit`,
      mode
    );
    setSuccessMsg(res.message);
    if (res.success) {
      onRefreshProfile();
    }
  };

  const handleSaveDirectEdit = () => {
    if (!editingUser) return;
    const res = updateUserMinutesDirectly(editingUser.id, editMinutesValue);
    setSuccessMsg(res.message);
    if (res.success) {
      onRefreshProfile();
      setEditingUser(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUserAccount(deletingUser.id);
    setSuccessMsg(res.message);
    if (res.success) {
      onRefreshProfile();
      setDeletingUser(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createNewUserAsync({
        id: newId.trim(),
        name: newName.trim(),
        initialMinutes: newInitMins,
        pin: newPin.trim() || '1234'
      });
      if (res.success && res.user) {
        onRefreshProfile();
        setSuccessMsg(`✅ Created Account for ${res.user.name}! User ID Assigned: ${res.user.id} (${newInitMins} Mins) | PIN: ${res.user.pin || '1234'}`);
        setNewId('');
        setNewName('');
        setNewPin('1234');
      } else {
        setSuccessMsg(`❌ Error: ${res.message || 'Failed to create account.'}`);
      }
    } catch (err: any) {
      setSuccessMsg(`❌ Error: ${err.message || 'Failed to create account.'}`);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5 w-fit">
              <ShieldCheck className="w-3.5 h-3.5" /> Hidden Astrologer Admin Control Panel
            </span>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              Master User Directory & Minutes Control
            </h1>
            <p className="text-xs text-gray-300">
              Unique numeric user IDs, PIN security protection, live lookup, and Google Sheets CSV database sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncServerUsers}
              disabled={isSyncingUsers}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold text-xs hover:bg-indigo-500/30 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              title="Sync all accounts created across devices from Cloud Server DB"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 ${isSyncingUsers ? 'animate-spin' : ''}`} />
              <span>{isSyncingUsers ? 'Syncing...' : 'Sync Cloud Users'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs hover:bg-emerald-500/30 transition-all cursor-pointer shadow-lg"
              title="Download CSV database for Google Sheets or Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleLockAdmin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs hover:bg-rose-500/30 transition-all cursor-pointer shadow-lg"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Dashboard Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
            <span>Total Accounts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">{totalUsersCount}</div>
          <div className="text-[10px] text-indigo-300">{googleUsersCount} Google, {customUsersCount} Custom</div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-300 font-medium">
            <span>Total Mins Remaining</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-200 font-mono">{totalMinutesRemaining} Mins</div>
          <div className="text-[10px] text-emerald-400/80">Active across all users</div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-blue-300 font-medium">
            <span>Google Auth Users</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
          </div>
          <div className="text-xl font-bold text-blue-200 font-mono">{googleUsersCount}</div>
          <div className="text-[10px] text-blue-300">Auto-synced via Google</div>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-1">
          <div className="flex items-center justify-between text-xs text-purple-300 font-medium">
            <span>Total Grant Audits</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-200 font-mono">{txLogs.length} Logs</div>
          <div className="text-[10px] text-purple-300">Transaction history</div>
        </div>
      </div>

      {/* Dedicated Google Spreadsheet & Multi-Device Storage Control Box */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-black/50 to-indigo-950/40 border border-emerald-500/30 rounded-2xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Google Sheets Integration & Database Backup
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30">
                  Universal Storage
                </span>
              </h3>
              <p className="text-xs text-gray-300">
                User data is stored locally, saved in Cloud Database Server, and can be copied or exported to Google Sheets with 1 click.
              </p>
            </div>
          </div>

          <a
            href="https://sheets.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-gray-200 hover:bg-white/20 hover:text-white transition-all w-fit shrink-0"
          >
            <span>Open Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <button
            onClick={handleCopyForGoogleSheets}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-200 font-bold text-xs hover:bg-emerald-600/50 transition-all cursor-pointer shadow-lg"
            title="Copies table data formatted for instant Ctrl+V paste into Google Sheets"
          >
            <Copy className="w-4 h-4 text-emerald-300" />
            <span>Copy Table for Google Sheets</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 font-bold text-xs hover:bg-indigo-600/50 transition-all cursor-pointer shadow-lg"
            title="Download UTF-8 CSV database file to upload into Google Sheets"
          >
            <Download className="w-4 h-4 text-indigo-300" />
            <span>Export Users CSV (.csv)</span>
          </button>

          <button
            onClick={handleExportTxCSV}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/30 border border-purple-400/40 text-purple-200 font-bold text-xs hover:bg-purple-600/50 transition-all cursor-pointer shadow-lg"
            title="Download Topup transactions CSV log for Google Sheets audit"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-300" />
            <span>Export Topups CSV</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: 2 Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: Direct ID Grant Form & Create User */}
        <div className="space-y-6">
          {/* Grant / Deduct Minutes Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-white font-serif flex items-center gap-2 pb-2 border-b border-white/10">
              <Gift className="w-4 h-4 text-indigo-400" />
              <span>Grant or Remove Minutes (Specific User ID)</span>
            </h3>

            <form onSubmit={handleGrantSubmit} className="space-y-3">
              {/* Action Mode Toggle: Add (+) vs Deduct (-) */}
              <div>
                <label className="text-xs text-gray-400 block mb-1">Select Admin Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('ADD')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      actionType === 'ADD'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                        : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>+ Add Minutes (Credit)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionType('DEDUCT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      actionType === 'DEDUCT'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-lg shadow-rose-500/20'
                        : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                    }`}
                  >
                    <span>- Remove Minutes (Debit)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Target User ID</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="e.g. 880101 or 904212"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
                
                {/* Live Lookup Feedback */}
                {targetId.trim() && (() => {
                  const foundUser = asyncLookupUser || fetchUserById(targetId.trim());
                  if (foundUser) {
                    return (
                      <div className="mt-2 p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center justify-between animate-fadeIn">
                        <div>
                          <span className="font-bold text-white block">{foundUser.name}</span>
                          <span className="text-[10px] text-gray-300 font-mono">ID: {foundUser.id} {foundUser.email ? `(${foundUser.email})` : ''}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                          {foundUser.availableMinutes} Mins Balance
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="mt-2 p-2 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[11px] text-amber-200 flex items-center justify-between gap-2">
                      <span>⚠️ Looking up User ID '{targetId.trim()}' on Cloud Server...</span>
                      <button
                        type="button"
                        onClick={handleSyncServerUsers}
                        className="text-[10px] underline hover:text-white font-bold shrink-0"
                      >
                        Force Sync
                      </button>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">
                  Consultation Minutes to {actionType === 'ADD' ? 'Grant (+)' : 'Deduct (-)'}
                </label>
                <div className="flex gap-2 mb-2">
                  {[5, 15, 30, 60, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAddMinsInput(m)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        addMinsInput === m
                          ? actionType === 'ADD'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 text-white border-rose-400'
                          : 'bg-black/30 text-gray-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {actionType === 'ADD' ? `+${m}m` : `-${m}m`}
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
                className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 ${
                  actionType === 'ADD'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30'
                    : 'bg-gradient-to-r from-rose-600 to-pink-600 shadow-rose-600/30'
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>
                  {actionType === 'ADD' ? `Add +${addMinsInput}` : `Remove -${addMinsInput}`} Minutes Now
                </span>
              </button>
            </form>
          </div>

          {/* Provision New Custom User ID Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-indigo-200 flex items-center gap-2 pb-2 border-b border-white/10">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Provision New Custom User ID Account</span>
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">User ID (Numeric or Text)</label>
                  <input
                    type="text"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="Auto 6-digit numeric ID"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">Leave blank to auto-generate</span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">User Full Name *</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Vikram Sharma"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">Must be letters (Not '1234')</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Initial Welcome Minutes</label>
                  <input
                    type="number"
                    value={newInitMins}
                    onChange={(e) => setNewInitMins(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Set 4-Digit Security PIN</label>
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    maxLength={10}
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">Required for user login</span>
                </div>
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

        {/* COLUMN 2: Master Directory (Google + Custom IDs + Delete + Minutes Balance) */}
        <div className="space-y-6">
          {/* All Registered Accounts Directory */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="space-y-3 pb-3 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Master Accounts Directory ({filteredUsers.length})</span>
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Hidden Admin Mode
                </span>
              </div>

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-indigo-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search user by Name, ID, Email, or PIN..."
                    className="w-full pl-8 pr-8 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                      title="Clear search query"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px] shrink-0">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterType === 'ALL' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({allUsers.length})
                  </button>
                  <button
                    onClick={() => setFilterType('GOOGLE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'GOOGLE' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Google ({googleUsersCount})
                  </button>
                  <button
                    onClick={() => setFilterType('CUSTOM')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      filterType === 'CUSTOM' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Custom ({customUsersCount})
                  </button>
                </div>
              </div>

              {searchQuery && (
                <div className="text-[11px] text-indigo-300 flex items-center justify-between pt-1 font-medium">
                  <span>Filtered results for: "{searchQuery}"</span>
                  <span className="text-gray-400">Showing {filteredUsers.length} of {allUsers.length} profiles</span>
                </div>
              )}
            </div>

            {/* Account Rows */}
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No accounts found matching search or filter.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isGoogle = String(user.id || '').startsWith('G-');
                  return (
                    <div
                      key={user.id}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-2.5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{user.name}</span>
                            {isGoogle && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-bold flex items-center gap-1">
                                <svg className="w-3 h-3" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Google Auth
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-indigo-300 font-semibold">
                              ID: {user.id}
                            </span>
                            <span className="font-mono text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-md border border-purple-400/30 flex items-center gap-1">
                              <Key className="w-2.5 h-2.5" />
                              PIN: {user.pin || '1234'}
                            </span>
                          </div>
                        </div>

                        {/* Remaining Minutes Display */}
                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-gray-400 block font-medium">Minutes Remaining</span>
                          <span className="font-mono text-sm font-extrabold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-block mt-0.5">
                            {user.availableMinutes} Mins
                          </span>
                        </div>
                      </div>

                      {/* Controls Toolbar */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1">
                          {/* Quick +15m and -15m adjusters */}
                          <button
                            onClick={() => handleQuickAdjust(user.id, 15, 'ADD')}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 hover:bg-emerald-500/30 cursor-pointer"
                            title="Add 15 Minutes"
                          >
                            +15m
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(user.id, 15, 'DEDUCT')}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold text-[11px] border border-rose-500/30 hover:bg-rose-500/30 cursor-pointer"
                            title="Deduct 15 Minutes"
                          >
                            -15m
                          </button>

                          {/* Direct Override Edit button */}
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setEditMinutesValue(user.availableMinutes);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30 hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                            title="Edit exact minute balance"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          {/* Reset PIN Button */}
                          <button
                            onClick={() => {
                              setResettingUserPin(user);
                              setResetPinVal(user.pin || '1234');
                            }}
                            className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold text-[11px] border border-purple-500/30 hover:bg-purple-500/30 cursor-pointer flex items-center gap-1"
                            title="Change user security password / PIN"
                          >
                            <Key className="w-3 h-3" />
                            <span>PIN</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {/* Switch Active User button */}
                          <button
                            onClick={() => {
                              setTargetId(user.id);
                              setActiveUserId(user.id);
                              onRefreshProfile();
                              setSuccessMsg(`Switched active view to User ID: ${user.id}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 font-bold text-[11px] hover:bg-indigo-500/30 cursor-pointer transition-all"
                          >
                            Select Active
                          </button>

                          {/* Delete Account Button */}
                          <button
                            onClick={() => setDeletingUser(user)}
                            className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 cursor-pointer transition-all"
                            title="Delete user account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="font-bold text-sm text-white flex items-center gap-2 pb-2 border-b border-white/10">
              <History className="w-4 h-4 text-indigo-400" />
              <span>Minutes Allocation Audit Log</span>
            </h3>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
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
                    <div className={`font-bold font-mono ${log.minutesAdded >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {log.minutesAdded >= 0 ? `+${log.minutesAdded}` : log.minutesAdded} Mins
                    </div>
                    <div className="text-[9px] text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Minutes Override Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0926] border border-white/20 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-white text-sm font-serif flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Override Exact Minute Balance</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300">
              Updating exact remaining minutes for <span className="font-bold text-white">{editingUser.name}</span> ({editingUser.id}).
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Set Available Minutes Balance</label>
              <input
                type="number"
                min="0"
                value={editMinutesValue}
                onChange={(e) => setEditMinutesValue(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDirectEdit}
                className="flex-1 py-2 rounded-xl bg-amber-500 text-black font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Save Balance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset User PIN Modal */}
      {resettingUserPin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <form 
            onSubmit={handleResetUserPinSubmit} 
            className="bg-[#0f0926] border border-purple-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left"
          >
            <div className="flex items-center justify-between pb-2 border-b border-purple-500/20">
              <h3 className="font-bold text-purple-300 text-sm font-serif flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-400" />
                <span>Admin Password / PIN Reset</span>
              </h3>
              <button
                type="button"
                onClick={() => setResettingUserPin(null)}
                className="text-gray-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-2">
              <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs">
                <div className="text-white font-bold">{resettingUserPin.name}</div>
                <div className="text-indigo-300 font-semibold">User ID: {resettingUserPin.id}</div>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Set New Password / PIN *</label>
                <input
                  type="text"
                  value={resetPinVal}
                  onChange={(e) => setResetPinVal(e.target.value)}
                  placeholder="e.g. 5566 or mypassword"
                  className="w-full px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResettingUserPin(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-500 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                Update PIN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0926] border border-rose-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
              <h3 className="font-bold text-rose-300 text-sm font-serif flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Confirm Account Deletion</span>
              </h3>
              <button
                onClick={() => setDeletingUser(null)}
                className="text-gray-400 hover:text-white font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-gray-300 space-y-2">
              <p>Are you sure you want to permanently delete this user account?</p>
              <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs">
                <div className="text-white font-bold">{deletingUser.name}</div>
                <div className="text-indigo-300 font-semibold">{deletingUser.id}</div>
                <div className="text-emerald-400 font-bold mt-1">{deletingUser.availableMinutes} Mins Balance</div>
              </div>
              <p className="text-[11px] text-rose-400">
                This action cannot be undone. User data and minute allocation will be erased.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

