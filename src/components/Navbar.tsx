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
  Lock
} from 'lucide-react';
import { UserProfile } from '../types';
import { getUsersDb, setActiveUserId, createNewUser } from '../utils/minutesManager';

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
  const [newUserIdInput, setNewUserIdInput] = useState('');
  const [newUserNameInput, setNewUserNameInput] = useState('');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const usersDb = getUsersDb();
  const allUsersList = Object.values(usersDb);

  const handleSelectUser = (id: string) => {
    setActiveUserId(id);
    onRefreshProfile();
    setShowUserDropdown(false);
  };

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserIdInput.trim()) return;
    createNewUser(newUserIdInput, newUserNameInput || 'Astro Seeker', 10);
    onRefreshProfile();
    setNewUserIdInput('');
    setNewUserNameInput('');
    setIsCreatingUser(false);
    setShowUserDropdown(false);
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
                <div className="absolute right-0 mt-2 w-64 bg-[#0a0518]/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                    <span className="text-xs font-semibold text-indigo-200">Select Active User ID</span>
                    <button
                      onClick={() => setIsCreatingUser(!isCreatingUser)}
                      className="text-[11px] text-purple-300 hover:underline flex items-center gap-1 font-medium"
                    >
                      {isCreatingUser ? 'Cancel' : '+ New ID'}
                    </button>
                  </div>

                  {isCreatingUser ? (
                    <form onSubmit={handleCreateUserSubmit} className="space-y-2 mb-2">
                      <div>
                        <label className="text-[10px] text-gray-400">Custom User ID (e.g. USER-108)</label>
                        <input
                          type="text"
                          value={newUserIdInput}
                          onChange={(e) => setNewUserIdInput(e.target.value)}
                          placeholder="USER-999"
                          className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400">User Name</label>
                        <input
                          type="text"
                          value={newUserNameInput}
                          onChange={(e) => setNewUserNameInput(e.target.value)}
                          placeholder="Siddharth"
                          className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:brightness-110"
                      >
                        Create & Switch ID
                      </button>
                    </form>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {allUsersList.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectUser(u.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-left transition-all ${
                            u.id === userProfile.id
                              ? 'bg-indigo-600/30 text-white border border-indigo-500/40 font-semibold'
                              : 'hover:bg-white/10 text-gray-300'
                          }`}
                        >
                          <div>
                            <div className="font-medium">{u.name}</div>
                            <div className="text-[10px] text-indigo-300/70 font-mono">{u.id}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-purple-300">{u.availableMinutes}m</span>
                            {u.id === userProfile.id && <Check className="w-3.5 h-3.5 text-indigo-300" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Live Consultation Minutes Badge */}
            <div
              onClick={() => onOpenRechargeModal('USER_BUY')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md cursor-pointer transition-all ${
                isConsultationActive
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300 animate-pulse shadow-lg shadow-emerald-500/20'
                  : userProfile.availableMinutes <= 2
                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-300'
                  : 'bg-white/10 text-white hover:bg-white/15'
              }`}
              title="Click to top up consultation minutes"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <div className="flex flex-col">
                <span className="text-xs font-bold leading-tight">
                  {userProfile.availableMinutes} <span className="text-[10px] font-normal text-gray-300">Mins</span>
                </span>
                {isConsultationActive && (
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Session
                  </span>
                )}
              </div>
            </div>

            {/* Top-Up Buy Button */}
            <button
              id="topup-minutes-btn"
              onClick={() => onOpenRechargeModal('USER_BUY')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all"
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
    </header>
  );
};
