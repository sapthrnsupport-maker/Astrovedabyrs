import React, { useState } from 'react';
import { Hash, Sparkles, User, Shield, Sun, Award, ArrowRight, RefreshCw, Briefcase, Heart, Coins, Activity, CheckCircle2, Save } from 'lucide-react';
import { UserProfile, NumerologyData } from '../types';
import { getNumerologyProfile, getNumerologyDomainPredictions } from '../utils/astrologyEngine';
import { updateUserProfile } from '../utils/minutesManager';

interface NumerologyViewProps {
  userProfile: UserProfile;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
  onUpdateProfile?: (updated: UserProfile) => void;
}

export const NumerologyView: React.FC<NumerologyViewProps> = ({
  userProfile,
  availableMinutes,
  onDeductMinute,
  onOpenRechargeModal,
  onUpdateProfile
}) => {
  const [testName, setTestName] = useState(userProfile.name || 'User');
  const [testDob, setTestDob] = useState(userProfile.dob || '1998-06-15');
  const [activeTab, setActiveTab] = useState<'all' | 'career' | 'wealth' | 'love' | 'health'>('all');
  const [savedSuccessToast, setSavedSuccessToast] = useState(false);

  const [aiReading, setAiReading] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Generate Numerology Numbers & Predictions
  const profile: NumerologyData = getNumerologyProfile(testName, testDob);
  const domainData = getNumerologyDomainPredictions(profile.moolank, profile.bhagyank, profile.namank);

  const handleSaveToAccount = () => {
    updateUserProfile({
      name: testName,
      dob: testDob
    });
    if (onUpdateProfile) {
      onUpdateProfile({
        ...userProfile,
        name: testName,
        dob: testDob
      });
    }
    setSavedSuccessToast(true);
    setTimeout(() => setSavedSuccessToast(false), 3500);
  };

  const handleGenerateAiNumerology = async () => {
    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    const hasEnough = onDeductMinute();
    if (!hasEnough) return;

    setIsLoadingAi(true);
    setAiReading('');

    try {
      const response = await fetch('/api/ai/numerology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testName,
          dob: testDob,
          moolank: profile.moolank,
          bhagyank: profile.bhagyank,
          namank: profile.namank
        })
      });

      const data = await response.json();
      setAiReading(data.reading || 'Numerology reading unavailable.');
    } catch (err) {
      console.error(err);
      setAiReading('Error communicating with Numerology server.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              Vedic & Chaldean Numerology
            </span>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              Moolank, Bhagyank & Namank Predictions
            </h1>
            <p className="text-xs text-gray-300">
              Discover your ruling planet vibration, lucky elements, career luck, wealth, health, and name spelling harmony.
            </p>
          </div>

          <button
            onClick={handleGenerateAiNumerology}
            disabled={isLoadingAi}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>{isLoadingAi ? 'Calculating Numerology...' : 'AI Numerology Life Forecast'}</span>
          </button>
        </div>
      </div>

      {/* Input Adjuster & Account Sync Row */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Full Name (for Namank)</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date of Birth (for Moolank & Bhagyank)</label>
              <input
                type="date"
                value={testDob}
                onChange={(e) => setTestDob(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            onClick={handleSaveToAccount}
            className="px-4 py-2.5 rounded-xl bg-indigo-600/30 border border-indigo-400/40 text-indigo-200 hover:bg-indigo-600/50 hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap self-stretch md:self-auto justify-center"
          >
            <Save className="w-4 h-4 text-indigo-300" />
            <span>Save Profile to Account</span>
          </button>
        </div>

        {savedSuccessToast && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Profile details updated successfully in Account Database!</span>
          </div>
        )}
      </div>

      {/* 3 Core Numbers Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Moolank (Driver) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-400/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20"></div>
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
            Moolank (Driver Number)
          </span>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-black font-serif text-white">{profile.moolank}</span>
            <div>
              <span className="text-xs font-bold text-indigo-300 block">{profile.rulingPlanet}</span>
              <span className="text-[10px] text-gray-400">Day {testDob.split('-')[2]} Vibration</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mt-2">
            {domainData.personality}
          </p>
        </div>

        {/* Bhagyank (Conductor) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-400/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20"></div>
          <span className="text-xs font-bold text-purple-300 uppercase tracking-wider block mb-1">
            Bhagyank (Conductor Number)
          </span>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-black font-serif text-white">{profile.bhagyank}</span>
            <div>
              <span className="text-xs font-bold text-purple-300 block">Destiny Path</span>
              <span className="text-[10px] text-gray-400">Sum of DOB ({testDob})</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mt-2">
            {domainData.bhagyankSummary}
          </p>
        </div>

        {/* Namank (Name Number) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-pink-400/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl group-hover:bg-pink-500/20"></div>
          <span className="text-xs font-bold text-pink-300 uppercase tracking-wider block mb-1">
            Namank (Name Vibration)
          </span>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-5xl font-black font-serif text-white">{profile.namank}</span>
            <div>
              <span className="text-xs font-bold text-pink-300 block">Chaldean Name Power</span>
              <span className="text-[10px] text-gray-400">{testName}</span>
            </div>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed mt-2">
            {domainData.namankHarmony}
          </p>
        </div>
      </div>

      {/* Domain Predictions Breakdown Grid */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-bold text-base text-white font-serif">Detailed Life Domain Predictions</h3>
            <p className="text-xs text-gray-400">Specific insights derived from Moolank {profile.moolank} & Bhagyank {profile.bhagyank}</p>
          </div>

          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('career')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'career' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Career
            </button>
            <button
              onClick={() => setActiveTab('wealth')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'wealth' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Wealth
            </button>
            <button
              onClick={() => setActiveTab('love')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'love' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Love
            </button>
            <button
              onClick={() => setActiveTab('health')}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'health' ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              Health
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Career */}
          {(activeTab === 'all' || activeTab === 'career') && (
            <div className="p-5 rounded-2xl bg-black/30 border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Career & Professional Growth</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {domainData.career}
              </p>
            </div>
          )}

          {/* Wealth */}
          {(activeTab === 'all' || activeTab === 'wealth') && (
            <div className="p-5 rounded-2xl bg-black/30 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Coins className="w-4 h-4 text-emerald-400" />
                <span>Wealth, Finance & Prosperity</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {domainData.wealth}
              </p>
            </div>
          )}

          {/* Love */}
          {(activeTab === 'all' || activeTab === 'love') && (
            <div className="p-5 rounded-2xl bg-black/30 border border-rose-500/20 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Love, Marriage & Relationships</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {domainData.love}
              </p>
            </div>
          )}

          {/* Health */}
          {(activeTab === 'all' || activeTab === 'health') && (
            <div className="p-5 rounded-2xl bg-black/30 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>Health, Mind & Body Vitality</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                {domainData.health}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Favorable Attributes Grid */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <h3 className="font-bold text-base text-white font-serif">Auspicious Numerology Alignments</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Lucky Numbers</span>
            <div className="flex gap-1.5 font-bold text-indigo-300 text-sm">
              {profile.luckyNumbers.map((n, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30">
                  {n}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Lucky Colors</span>
            <span className="text-xs font-bold text-purple-300">{profile.luckyColors.join(', ')}</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Favorable Gemstone</span>
            <span className="text-xs font-bold text-emerald-300">{profile.luckyGemstone}</span>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-xs text-gray-400 block mb-1">Auspicious Days</span>
            <span className="text-xs font-bold text-indigo-300">{profile.luckyDays.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* AI Numerology Forecast Result */}
      {(isLoadingAi || aiReading) && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-5 h-5 text-indigo-300 animate-spin-slow" />
            <h3 className="font-bold text-base font-serif text-white">
              AI Numerology Forecast & Name Correction Advice
            </h3>
          </div>

          {isLoadingAi ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-indigo-200">
                Calculating Chaldean matrix and synergy between Moolank {profile.moolank} & Bhagyank {profile.bhagyank}...
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-black/40 border border-white/10">
              {aiReading}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

