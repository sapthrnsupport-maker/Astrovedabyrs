import React, { useState } from 'react';
import { X, ShieldCheck, Key, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, User, Clock, Calendar, ArrowLeft, Zap } from 'lucide-react';
import { UserProfile } from '../types';
import { changeUserPin } from '../utils/minutesManager';

interface PrivateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onRefreshProfile: () => void;
}

export const PrivateProfileModal: React.FC<PrivateProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onRefreshProfile
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!currentPin.trim()) {
      setErrorMsg('Please enter your current Password / PIN.');
      return;
    }
    if (!newPin.trim()) {
      setErrorMsg('Please enter a new Password / PIN.');
      return;
    }
    if (newPin.trim().length < 4) {
      setErrorMsg('New Password / PIN must be at least 4 characters.');
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setErrorMsg('New Password and Confirm Password do not match!');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const res = changeUserPin(userProfile.id, currentPin.trim(), newPin.trim());
      setIsSubmitting(false);

      if (res.success) {
        setSuccessMsg(res.message);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        onRefreshProfile();
      } else {
        setErrorMsg(res.message);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-md bg-[#0d071d] border border-purple-500/30 rounded-3xl p-6 shadow-2xl shadow-purple-900/40 text-white overflow-hidden space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer mr-1"
              title="Go Back"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30">
              <div className="w-full h-full bg-[#0d071d] rounded-[14px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-indigo-300" />
              </div>
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm text-white">Private Profile & Security</h3>
              <p className="text-[10px] text-indigo-300 font-mono">User ID: {userProfile.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all cursor-pointer"
            title="Close Profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info Overview */}
        <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-sm text-white">{userProfile.name}</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full border font-bold text-xs ${
              userProfile.availableMinutes <= 0 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'
            }`}>
              {userProfile.availableMinutes} Mins Balance
            </span>
          </div>

          {userProfile.availableMinutes <= 0 && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span><strong>0 Minutes Warning:</strong> Your consultation balance is exhausted. Please topup minutes to ask questions or view Kundali reports.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 pt-1 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>DOB: {userProfile.dob || 'Not set'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>TOB: {userProfile.tob || 'Not set'}</span>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="space-y-3.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
            <Key className="w-4 h-4 text-purple-400" />
            <span>Change Security Password / PIN</span>
          </div>

          {/* Current Password Input */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Current Password / PIN *</label>
            <div className="relative">
              <input
                type={showCurrentPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showCurrentPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password Input */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">New Password / PIN *</label>
            <div className="relative">
              <input
                type={showNewPin ? 'text' : 'password'}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new password (min 4 chars)"
                className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPin(!showNewPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Input */}
          <div>
            <label className="text-[11px] text-gray-400 block mb-1">Confirm New Password / PIN *</label>
            <input
              type={showNewPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Updating...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
