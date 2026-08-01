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
import { Sparkles, Heart } from 'lucide-react';

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

        {activeTab === 'rashifal' && <DailyHoroscope />}

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
