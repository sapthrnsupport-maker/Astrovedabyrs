import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  PlusCircle,
  ShieldCheck,
  User,
  Check,
  ChevronDown,
  Compass,
  Heart,
  Hash,
  MessageSquare,
  Sun,
  Lock,
  Globe,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithGoogleAccount, createNewUser, fetchUserById, verifyUserPin } from '../utils/minutesManager';
import { PrivateProfileModal } from './PrivateProfileModal';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userProfile: UserProfile;
  onRefreshProfile: () => void;
  onOpenRechargeModal: (mode?: 'USER_BUY' | 'ADMIN_GRANT') => void;
  isConsultationActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProfile,
  onRefreshProfile,
  onOpenRechargeModal,
  isConsultationActive
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [googleSuccessMsg, setGoogleSuccessMsg] = useState('');

  const [newUserIdInput, setNewUserIdInput] = useState('');
  const [newUserNameInput, setNewUserNameInput] = useState('');
  const [userPinInput, setUserPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Live User Lookup
  const matchedExistingUser = newUserIdInput.trim() ? fetchUserById(newUserIdInput.trim()) : null;

  const handleGoogleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmailInput.trim()) return;

    loginWithGoogleAccount(googleEmailInput.trim(), googleNameInput.trim() || googleEmailInput.split('@')[0]);
    onRefreshProfile();
    setGoogleSuccessMsg(`Successfully signed in with Google! ID: ${userProfile.id}`);
    setTimeout(() => {
      setShowGoogleModal(false);
      setGoogleSuccessMsg('');
      setShowUserDropdown(false);
    }, 1200);
  };

  const handleQuickGoogleDemo = (email: string, name: string) => {
    loginWithGoogleAccount(email, name);
    onRefreshProfile();
    setGoogleSuccessMsg(`Signed in as ${name} (${email})`);
    setTimeout(() => {
      setShowGoogleModal(false);
      setGoogleSuccessMsg('');
      setShowUserDropdown(false);
    }, 1000);
  };

  const handleCustomIdAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const targetId = newUserIdInput.trim();
    if (!targetId) return;

    // Check if user already exists
    const existing = fetchUserById(targetId);

    if (existing) {
      // Existing User -> Verify Security PIN
      if (!userPinInput.trim()) {
        setLoginError('Security PIN is required to log in!');
        return;
      }

      const res = verifyUserPin(targetId, userPinInput.trim());
      if (res.success) {
        onRefreshProfile();
        setNewUserIdInput('');
        setUserPinInput('');
        setNewUserNameInput('');
        setIsCreatingUser(false);
        setShowUserDropdown(false);
      } else {
        setLoginError(res.message);
      }
    } else {
      // Strict Check: Reject creating new users from Navbar
      setLoginError(`❌ User ID '${targetId}' does NOT exist! New accounts can only be created by the Admin. Please contact Admin or check your ID.`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/5 backdrop-blur-xl border-b border-white/10 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('kundali')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-[#080312] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg font-bold bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
                  AstroVeda
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-400 hidden sm:block">Vedic Astrology & Minutes Engine</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User ID Profile Selector Dropdown */}
            <div className="relative">
              <button
                id="user-profile-selector"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-white backdrop-blur-md"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-[10px]">
                  {userProfile.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <div className="font-semibold text-white truncate max-w-[100px]">{userProfile.name}</div>
                  <div className="text-[10px] text-indigo-300 font-mono">{userProfile.id}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0a0518]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-semibold text-indigo-200">Account & Authentication</span>
                    <span className="text-[10px] text-gray-400 font-mono">Protected</span>
                  </div>

                  {/* Active Profile Info Box */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs">{userProfile.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                        {userProfile.availableMinutes} Mins
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">ID: {userProfile.id}</div>
                  </div>

                  {/* Private Profile & Password Section Button */}
                  <button
                    onClick={() => {
                      setShowPrivateModal(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-200 font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-400" />
                      <span>Private Section & Password</span>
                    </span>
                    <span className="text-[10px] bg-purple-500/30 text-purple-200 px-1.5 py-0.5 rounded font-mono">Change PIN</span>
                  </button>

                  {/* Google Sign-In Button ("Id banane ke liye google sign kro") */}
                  <button
                    onClick={() => {
                      setShowGoogleModal(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-white text-gray-900 font-bold text-xs flex items-center justify-center gap-2 hover:bg-gray-100 transition-all cursor-pointer shadow-lg"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Sign in with Google</span>
                  </button>

                  {/* Switch to Custom ID option */}
                  <div className="pt-2 border-t border-white/10 space-y-2">
                    <button
                      onClick={() => {
                        setIsCreatingUser(!isCreatingUser);
                        setLoginError('');
                      }}
                      className="w-full text-left text-[11px] text-indigo-300 hover:underline font-medium flex items-center justify-between"
                    >
                      <span className="flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Login with Unique User ID</span>
                      </span>
                      <span>{isCreatingUser ? 'Close' : 'Open'}</span>
                    </button>

                    {isCreatingUser && (
                      <form onSubmit={handleCustomIdAuthSubmit} className="space-y-2 pt-1">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-0.5">User ID (6-digit or custom)</label>
                          <input
                            type="text"
                            value={newUserIdInput}
                            onChange={(e) => {
                              setNewUserIdInput(e.target.value);
                              if (loginError) setLoginError('');
                            }}
                            placeholder="e.g. 880101"
                            className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                            required
                          />
                        </div>

                        {/* Live User Detection Banner */}
                        {matchedExistingUser ? (
                          <div className="p-2 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-200 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <div>
                              <div className="font-bold text-white">{matchedExistingUser.name}</div>
                              <div className="text-[10px] text-emerald-300/90 font-mono">
                                Account Active • Balance: {matchedExistingUser.availableMinutes} Mins
                              </div>
                            </div>
                          </div>
                        ) : newUserIdInput.trim() ? (
                          <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-lg text-[10px] text-amber-200">
                            ⚠️ User ID '{newUserIdInput.trim()}' not found. Contact Admin to create account.
                          </div>
                        ) : null}

                        {/* PIN / Password Input */}
                        {newUserIdInput.trim() && (
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-0.5">
                              Enter Security PIN / Password *
                            </label>
                            <div className="relative">
                              <input
                                type={showPin ? 'text' : 'password'}
                                value={userPinInput}
                                onChange={(e) => {
                                  setUserPinInput(e.target.value);
                                  if (loginError) setLoginError('');
                                }}
                                placeholder="PIN / Password (e.g. 1234)"
                                className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500 pr-8"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                              >
                                {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {loginError && (
                          <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-[10px] text-red-200">
                            {loginError}
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Verify PIN & Access Account</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Consultation Minutes Badge */}
            <div
              onClick={() => onOpenRechargeModal('USER_BUY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border backdrop-blur-md cursor-pointer transition-all ${
                userProfile.availableMinutes <= 0
                  ? 'bg-rose-600/30 border-rose-500/60 text-rose-200 animate-pulse shadow-lg shadow-rose-600/40'
                  : isConsultationActive
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 animate-pulse shadow-lg shadow-emerald-500/20'
                  : userProfile.availableMinutes <= 2
                  ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/15'
              }`}
              title="Click to top up consultation minutes"
            >
              {userProfile.availableMinutes <= 0 ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
              ) : (
                <Clock className="w-3.5 h-3.5 text-indigo-300" />
              )}
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">
                  {userProfile.availableMinutes} <span className="text-[10px] font-normal text-gray-300">Mins</span>
                </span>
                {userProfile.availableMinutes <= 0 ? (
                  <span className="text-[9px] font-bold text-rose-300 uppercase tracking-tight">
                    Recharge Needed
                  </span>
                ) : isConsultationActive ? (
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Session
                  </span>
                ) : null}
              </div>
            </div>

            {/* Top-Up Buy Button */}
            <button
              id="topup-minutes-btn"
              onClick={() => onOpenRechargeModal('USER_BUY')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-lg transition-all ${
                userProfile.availableMinutes <= 0
                  ? 'bg-gradient-to-r from-amber-500 to-rose-600 text-white shadow-rose-600/40 animate-pulse hover:scale-105'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-indigo-600/30 hover:brightness-110 active:scale-95'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Top Up</span>
            </button>

            {/* Admin / Astrologer ID Recharge Panel Button */}
            <button
              id="admin-grant-btn"
              onClick={() => onOpenRechargeModal('ADMIN_GRANT')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-indigo-200 hover:bg-white/15 transition-all text-xs font-medium backdrop-blur-md"
              title="Astrologer Admin Panel: Grant minutes to any ID"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span className="hidden md:inline">Recharge ID</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-t border-white/10 scrollbar-none text-xs">
          {[
            { id: 'kundali', label: 'Janm Kundali', icon: Compass },
            { id: 'chat', label: 'Guruji AI Chat', icon: MessageSquare, badge: 'Live' },
            { id: 'numerology', label: 'Moolank & Numerology', icon: Hash },
            { id: 'compatibility', label: 'Gun Milan Match', icon: Heart },
            { id: 'rashifal', label: 'Daily Rashifal & Panchang', icon: Sun },
            { id: 'admin', label: 'Admin Panel', icon: Lock }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/60 to-purple-600/60 text-white border border-white/20 backdrop-blur-md shadow-lg shadow-indigo-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-300' : 'text-gray-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500 text-white shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Google Sign-In Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f0926] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-left relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-bold text-white text-base font-serif">Sign in with Google Account</h3>
              </div>
              <button
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-300">
              Sign in with your Google account to create your personal AstroVeda ID and claim 15 free welcome minutes!
            </p>

            {googleSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 font-bold">
                {googleSuccessMsg}
              </div>
            )}

            {/* One-Click Quick Google Login Options */}
            <div className="space-y-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Quick One-Click Sign In
              </span>
              <button
                type="button"
                onClick={() => handleQuickGoogleDemo('sapthrn.support@gmail.com', 'Sapthrn Support')}
                className="w-full p-3 bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl text-xs text-left text-white flex items-center justify-between cursor-pointer transition-all"
              >
                <div>
                  <div className="font-bold">Sapthrn Support</div>
                  <div className="text-[10px] text-indigo-300 font-mono">sapthrn.support@gmail.com</div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Instant
                </span>
              </button>
            </div>

            {/* Custom Google Email Form */}
            <form onSubmit={handleGoogleSignInSubmit} className="space-y-3 pt-2 border-t border-white/10">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                Or enter custom Google Email
              </span>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Google Email Address</label>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="e.g. yourname@gmail.com"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="e.g. Rohit Sharma"
                  className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 font-bold text-xs hover:bg-white/15 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:brightness-110 cursor-pointer"
                >
                  Sign In & Sync ID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Private Profile & Change Password Modal */}
      <PrivateProfileModal
        isOpen={showPrivateModal}
        onClose={() => setShowPrivateModal(false)}
        userProfile={userProfile}
        onRefreshProfile={onRefreshProfile}
      />
    </header>
  );
};
