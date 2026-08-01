/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile } from './types';
import {
  getActiveUserProfile,
  updateUserProfile,
  deductConsultationMinute
} from './utils/minutesManager';
import { Navbar } from './components/Navbar';
import { MinutesModal } from './components/MinutesModal';
import { KundaliView } from './components/KundaliView';
import { AiAstrologerChat } from './components/AiAstrologerChat';
import { NumerologyView } from './components/NumerologyView';
import { CompatibilityView } from './components/CompatibilityView';
import { DailyHoroscope } from './components/DailyHoroscope';
import { AdminPanel } from './components/AdminPanel';
import { Sparkles, Heart, AlertTriangle, Zap, Clock } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('kundali');
  const [userProfile, setUserProfile] = useState<UserProfile>(getActiveUserProfile());
  const [isRechargeModalOpen, setIsRechargeModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'USER_BUY' | 'ADMIN_GRANT'>('USER_BUY');
  const [isConsultationActive, setIsConsultationActive] = useState(false);

  // Refresh active user profile from local storage
  const handleRefreshProfile = () => {
    setUserProfile(getActiveUserProfile());
  };

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    updateUserProfile(updated);
    handleRefreshProfile();
  };

  // Open Recharge / Topup Modal
  const handleOpenRechargeModal = (mode: 'USER_BUY' | 'ADMIN_GRANT' = 'USER_BUY') => {
    setModalMode(mode);
    setIsRechargeModalOpen(true);
  };

  // Deduct 1 minute
  const handleDeductMinute = (): boolean => {
    const res = deductConsultationMinute();
    handleRefreshProfile();
    if (!res.hasMinutes) {
      setIsConsultationActive(false);
      handleOpenRechargeModal('USER_BUY');
      return false;
    }
    return true;
  };

  // Active consultation live timer: Deduct 1 minute every 60 seconds when active session is running
  useEffect(() => {
    let timer: any = null;
    if (isConsultationActive && userProfile.availableMinutes > 0) {
      timer = setInterval(() => {
        const res = deductConsultationMinute();
        handleRefreshProfile();
        if (res.remainingMinutes <= 0) {
          setIsConsultationActive(false);
          handleOpenRechargeModal('USER_BUY');
        }
      }, 60000); // 60 seconds = 1 minute
    } else {
      setIsConsultationActive(false);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isConsultationActive, userProfile.availableMinutes]);

  return (
    <div className="min-h-screen bg-[#080312] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white antialiased flex flex-col relative overflow-hidden">
      {/* Ambient Mesh Background Glowing Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onRefreshProfile={handleRefreshProfile}
        onOpenRechargeModal={handleOpenRechargeModal}
        isConsultationActive={isConsultationActive}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 z-10">
        {/* Zero Minutes Warning Notification Banner */}
        {userProfile.availableMinutes <= 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-amber-950/70 to-purple-950/80 border border-rose-500/50 shadow-2xl shadow-rose-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2.5 bg-rose-500/20 border border-rose-400/40 rounded-2xl text-rose-300 shrink-0 shadow-lg">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <span>⚠️ Balance Alert: 0 Consultation Minutes Remaining!</span>
                </h4>
                <p className="text-xs text-rose-200/90 mt-0.5">
                  Aapke paas AI Astrologer se baat karne, Kundali Dasha calculation aur Daily Horoscope ke liye minutes nahi bache hain. Recharge karke turant consultation resume karein!
                </p>
              </div>
            </div>
            <button
              onClick={() => handleOpenRechargeModal('USER_BUY')}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/40 flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-all hover:scale-105 uppercase tracking-wider"
            >
              <Zap className="w-4 h-4 fill-amber-200" />
              <span>Recharge Minutes Now</span>
            </button>
          </div>
        )}

        {/* Low Balance Warning Banner (1 or 2 Minutes Left) */}
        {userProfile.availableMinutes > 0 && userProfile.availableMinutes <= 2 && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span><strong>Low Balance Warning:</strong> Sirf {userProfile.availableMinutes} Minute bache hain. Uninterrupted consultation ke liye abhi topup karein.</span>
            </div>
            <button
              onClick={() => handleOpenRechargeModal('USER_BUY')}
              className="px-4 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-300 font-bold text-xs shrink-0 cursor-pointer transition-all"
            >
              + Topup Minutes
            </button>
          </div>
        )}
        {activeTab === 'kundali' && (
          <KundaliView
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            availableMinutes={userProfile.availableMinutes}
            onDeductMinute={handleDeductMinute}
            onOpenRechargeModal={() => handleOpenRechargeModal('USER_BUY')}
          />
        )}

        {activeTab === 'chat' && (
          <AiAstrologerChat
            userProfile={userProfile}
            availableMinutes={userProfile.availableMinutes}
            onDeductMinute={handleDeductMinute}
            onOpenRechargeModal={() => handleOpenRechargeModal('USER_BUY')}
            isConsultationActive={isConsultationActive}
            setIsConsultationActive={setIsConsultationActive}
          />
        )}

        {activeTab === 'numerology' && (
          <NumerologyView
            userProfile={userProfile}
            availableMinutes={userProfile.availableMinutes}
            onDeductMinute={handleDeductMinute}
            onOpenRechargeModal={() => handleOpenRechargeModal('USER_BUY')}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'compatibility' && (
          <CompatibilityView
            userProfile={userProfile}
            availableMinutes={userProfile.availableMinutes}
            onDeductMinute={handleDeductMinute}
            onOpenRechargeModal={() => handleOpenRechargeModal('USER_BUY')}
          />
        )}

        {activeTab === 'rashifal' && (
          <DailyHoroscope
            availableMinutes={userProfile.availableMinutes}
            onDeductMinute={handleDeductMinute}
            onOpenRechargeModal={() => handleOpenRechargeModal('USER_BUY')}
          />
        )}

        {activeTab === 'admin' && <AdminPanel onRefreshProfile={handleRefreshProfile} />}
      </main>

      {/* Recharge & Admin Grant Modal */}
      <MinutesModal
        isOpen={isRechargeModalOpen}
        onClose={() => setIsRechargeModalOpen(false)}
        userProfile={userProfile}
        onRefreshProfile={handleRefreshProfile}
        initialMode={modalMode}
      />

      {/* Footer */}
      <footer className="bg-white/5 backdrop-blur-xl border-t border-white/10 py-6 px-4 text-center text-xs text-slate-400 space-y-2 z-10">
        <div className="flex items-center justify-center gap-1.5 text-indigo-300 font-serif font-bold text-sm">
          <Sparkles className="w-4 h-4 text-purple-400" /> AstroVeda AI • Vedic Astrology & Minute Engine
        </div>
        <p className="text-gray-400">
          Timed consultations, Vedic Kundali, Moolank & Bhagyank, and Gun Milan are calculated according to traditional Parashari principles.
        </p>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
          © {new Date().getFullYear()} AstroVeda • Powered by Jyotish-GPT v4.0
        </p>
      </footer>
    </div>
  );
}
