import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Key, Lock, User, Calendar, Clock, MapPin, Eye, EyeOff, AlertCircle, ArrowRight, UserPlus, LogIn, Mail, CheckCircle2, Copy, Check } from 'lucide-react';
import { verifyUserPinAsync, createNewUserAsync } from '../utils/minutesManager';
import { UserProfile } from '../types';
import { LocationInput } from './LocationInput';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form State
  const [loginUserId, setLoginUserId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State
  const [regCustomId, setRegCustomId] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regDob, setRegDob] = useState('1998-05-15');
  const [regTob, setRegTob] = useState('12:00');
  const [regPob, setRegPob] = useState('New Delhi, India');
  const [regGender, setRegGender] = useState<'male' | 'female' | 'other'>('male');
  const [regPin, setRegPin] = useState('1234');
  const [showRegPin, setShowRegPin] = useState(false);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [createdUserCard, setCreatedUserCard] = useState<UserProfile | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginUserId.trim()) {
      setLoginError('Please enter your User ID, Email, or Name.');
      return;
    }
    if (!loginPin.trim()) {
      setLoginError('Please enter your Security PIN / Password.');
      return;
    }

    setIsLoggingIn(true);
    const res = await verifyUserPinAsync(loginUserId.trim(), loginPin.trim());
    setIsLoggingIn(false);

    if (res.success && res.user) {
      onSuccess(res.user);
      if (onClose) onClose();
    } else {
      setLoginError(res.message || 'Login failed. Please check User ID/Email and PIN.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !/[a-zA-Z]/.test(regName)) {
      setRegError('Please enter a valid name containing letters.');
      return;
    }
    if (!regPin.trim()) {
      setRegError('Please choose a Security PIN / Password.');
      return;
    }

    setIsRegistering(true);
    const res = await createNewUserAsync({
      id: regCustomId.trim() || Math.floor(100000 + Math.random() * 900000).toString(),
      name: regName.trim(),
      email: regEmail.trim(),
      dob: regDob,
      tob: regTob,
      pob: regPob,
      gender: regGender,
      pin: regPin.trim(),
      initialMinutes: 15 // Welcome 15 consultation minutes bonus
    });
    setIsRegistering(false);

    if (res.success && res.user) {
      setCreatedUserCard(res.user);
      onSuccess(res.user);
    } else {
      setRegError(res.message || 'Failed to create account.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#0d071e] border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/80 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Created Account Success Modal Overlay */}
        {createdUserCard ? (
          <div className="py-2 text-center space-y-4 animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Account Created & Synced to Cloud!</h3>
              <p className="text-xs text-indigo-200/80 mt-1">
                Save these credentials to sign in seamlessly on any phone, laptop, or browser!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-indigo-500/30 text-left space-y-3 font-mono">
              <div className="flex justify-between items-center bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                <div>
                  <div className="text-[10px] text-indigo-300 font-sans uppercase">Your Unique User ID</div>
                  <div className="text-emerald-300 font-bold text-lg">{createdUserCard.id}</div>
                </div>
                <button
                  onClick={() => handleCopyId(createdUserCard.id)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs flex items-center gap-1 cursor-pointer transition-all"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? 'Copied!' : 'Copy ID'}</span>
                </button>
              </div>

              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-gray-400 font-sans">Security PIN:</span>
                <span className="text-amber-300 font-bold text-sm">{createdUserCard.pin}</span>
              </div>

              {createdUserCard.email && (
                <div className="flex justify-between items-center text-xs px-1">
                  <span className="text-gray-400 font-sans">Registered Email:</span>
                  <span className="text-indigo-300 text-xs">{createdUserCard.email}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs px-1 pt-1 border-t border-white/10">
                <span className="text-gray-400 font-sans">Welcome Bonus:</span>
                <span className="text-emerald-400 font-bold font-sans">15 Consultation Minutes</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedUserCard(null);
                if (onClose) onClose();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer transition-all"
            >
              Continue to AstroVeda App
            </button>
          </div>
        ) : (
          <>
            {/* Brand Header */}
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-xl shadow-indigo-500/30">
                <div className="w-full h-full bg-[#080312] rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-indigo-300 animate-pulse" />
                </div>
              </div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">AstroVeda Account Access</h2>
              <p className="text-xs text-indigo-200/80 mt-1">
                {mode === 'LOGIN' ? 'Sign in from any device using User ID or Email' : 'Create your Kundali profile & get 15 Free Minutes'}
              </p>
            </div>

            {/* Mode Toggle Switch */}
            <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setLoginError(''); setRegError(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New Account</span>
              </button>
            </div>

            {/* LOGIN FORM */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-indigo-200 mb-1">User ID, Registered Email, or Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type="text"
                      value={loginUserId}
                      onChange={(e) => setLoginUserId(e.target.value)}
                      placeholder="e.g. 880101, rahul@gmail.com, or Rahul Sharma"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white placeholder-gray-500 text-xs outline-none transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-indigo-200 mb-1">Security PIN / Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type={showLoginPin ? 'text' : 'password'}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      placeholder="Enter Security PIN (e.g. 1234)"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white placeholder-gray-500 text-xs outline-none transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPin(!showLoginPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showLoginPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isLoggingIn ? 'Checking Cloud Database...' : 'Sign In Now'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {regError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {/* 6-Digit User ID Preview */}
                <div className="p-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5 text-indigo-200">
                    <Key className="w-4 h-4 text-indigo-400" />
                    <span>Assigned User ID:</span>
                  </div>
                  <input
                    type="text"
                    value={regCustomId}
                    onChange={(e) => setRegCustomId(e.target.value)}
                    className="w-28 px-2 py-1 bg-black/40 border border-indigo-400/40 rounded-lg text-emerald-300 font-mono font-bold text-center text-xs outline-none focus:border-indigo-400"
                    title="Your auto-generated unique User ID"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-indigo-200 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Enter your name (e.g. Ananya Roy)"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white placeholder-gray-500 text-xs outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-indigo-200 mb-1">Email Address (Recommended for easy multi-device sign in)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ananya@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white placeholder-gray-500 text-xs outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-indigo-200 mb-1">Date of Birth</label>
                    <div className="relative">
                      <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                      <input
                        type="date"
                        value={regDob}
                        onChange={(e) => setRegDob(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white text-xs outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-indigo-200 mb-1">Time of Birth</label>
                    <div className="relative">
                      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-indigo-400" />
                      <input
                        type="time"
                        value={regTob}
                        onChange={(e) => setRegTob(e.target.value)}
                        className="w-full pl-8 pr-2 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white text-xs outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <LocationInput
                    label="Place of Birth"
                    value={regPob}
                    onChange={(city) => setRegPob(city)}
                    placeholder="City, State (e.g. New Delhi, Mumbai, Varanasi)..."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-indigo-200 mb-1">Security PIN (4 digits)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-400" />
                    <input
                      type={showRegPin ? 'text' : 'password'}
                      value={regPin}
                      onChange={(e) => setRegPin(e.target.value)}
                      placeholder="Choose 4-digit PIN (default 1234)"
                      className="w-full pl-9 pr-10 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-400 text-white placeholder-gray-500 text-xs outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPin(!showRegPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white cursor-pointer"
                    >
                      {showRegPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  <span>{isRegistering ? 'Creating Account & Syncing Cloud...' : 'Create Account + Get 15 Mins Free'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
