import React, { useState } from 'react';
import { Heart, Sparkles, User, RefreshCw, CheckCircle, AlertTriangle, Hash, Briefcase, Activity, Compass, Shield, Flame, Clock, Calendar, Gift, Zap } from 'lucide-react';
import { UserProfile, AshtaKootaScore } from '../types';
import { calculateAshtaKoota, calculateMoolank, calculateBhagyank, calculateNumerologyCompatibility, calculateCrushProposalChance } from '../utils/astrologyEngine';

interface CompatibilityViewProps {
  userProfile: UserProfile;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
}

export const CompatibilityView: React.FC<CompatibilityViewProps> = ({
  userProfile,
  availableMinutes,
  onDeductMinute,
  onOpenRechargeModal
}) => {
  const [matchMode, setMatchMode] = useState<'vedic' | 'numerology' | 'crush'>('crush');

  const [partner1, setPartner1] = useState({
    name: userProfile.name || 'Rahul',
    dob: userProfile.dob || '1995-05-15',
    tob: userProfile.tob || '10:30',
    rashi: 'Taurus (Vrishabh)'
  });

  const [partner2, setPartner2] = useState({
    name: 'Ananya',
    dob: '1997-08-22',
    tob: '14:15',
    rashi: 'Virgo (Kanya)'
  });

  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Calculate Vedic Ashta Koota Gun Milan
  const gunScore: AshtaKootaScore = calculateAshtaKoota(partner1.dob, partner2.dob);

  // Calculate Numerology Moolank & Bhagyank Match
  const moolank1 = calculateMoolank(partner1.dob);
  const bhagyank1 = calculateBhagyank(partner1.dob);
  const moolank2 = calculateMoolank(partner2.dob);
  const bhagyank2 = calculateBhagyank(partner2.dob);

  const numCompat = calculateNumerologyCompatibility(moolank1, bhagyank1, moolank2, bhagyank2);

  // Calculate Crush Acceptance & Love Proposal Chance
  const crushResult = calculateCrushProposalChance(partner1.name, partner1.dob, partner2.name, partner2.dob);

  const handleGenerateAiMatch = async () => {
    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    const hasEnough = onDeductMinute();
    if (!hasEnough) return;

    setIsLoadingAi(true);
    setAiAnalysis('');

    try {
      const response = await fetch('/api/ai/compatibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner1,
          partner2,
          gunaScore: matchMode === 'vedic'
            ? gunScore.totalScore
            : matchMode === 'crush'
            ? `${crushResult.proposalSuccessChance}% Proposal Success Chance`
            : `${numCompat.matrixScore}% (Numerology Matrix)`,
          mode: matchMode,
          moolank1,
          moolank2,
          bhagyank1,
          bhagyank2
        })
      });

      const data = await response.json();
      setAiAnalysis(data.analysis || 'Matchmaking analysis unavailable.');
    } catch (err) {
      console.error(err);
      setAiAnalysis('Failed to get AI Gun Milan report.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30">
                Kundali & Numerology Love Calculator
              </span>
            </div>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-rose-100 to-purple-200 bg-clip-text text-transparent">
              {matchMode === 'crush'
                ? 'Crush Manegi Ya Nahi? 💖 Proposal Acceptance Calculator'
                : matchMode === 'vedic'
                ? '36 Points Gun Milan & Kundali Match'
                : 'Moolank & Bhagyank Numerology Match'}
            </h1>
            <p className="text-xs text-gray-300">
              {matchMode === 'crush'
                ? 'Calculate exact proposal success chance %, mutual feelings, best proposal dates, and Venus (Shukra) love remedies.'
                : matchMode === 'vedic'
                ? 'Assess 36 Gunas, marital harmony, emotional resonance, health sync, and Nadi / Bhakoot Dosh.'
                : 'Match partner birth dates using Moolank (Driver) & Bhagyank (Conductor) numerological vibration matrix.'}
            </p>
          </div>

          <button
            onClick={handleGenerateAiMatch}
            disabled={isLoadingAi}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-rose-300" />
            <span>{isLoadingAi ? 'Consulting Matchmaker...' : 'AI Deep Love Report'}</span>
          </button>
        </div>
      </div>

      {/* Matching Mode Selector Tabs */}
      <div className="flex items-center p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl max-w-xl mx-auto gap-1">
        <button
          onClick={() => setMatchMode('crush')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            matchMode === 'crush'
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-lg shadow-rose-600/30'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-300" />
          <span>Crush Proposal %</span>
        </button>

        <button
          onClick={() => setMatchMode('vedic')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            matchMode === 'vedic'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>36 Gun Milan</span>
        </button>

        <button
          onClick={() => setMatchMode('numerology')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            matchMode === 'numerology'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Hash className="w-4 h-4" />
          <span>Mulank Match</span>
        </button>
      </div>

      {/* Inputs: Boy & Girl Birth Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Partner 1 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-semibold text-sm text-indigo-200 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              <span>Partner 1 (Boy)</span>
            </h3>
            {matchMode === 'numerology' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Moolank {moolank1} | Bhagyank {bhagyank1}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                value={partner1.name}
                onChange={(e) => setPartner1({ ...partner1, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={partner1.dob}
                  onChange={(e) => setPartner1({ ...partner1, dob: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Time of Birth {matchMode === 'numerology' && '(Optional)'}</label>
                <input
                  type="time"
                  value={partner1.tob}
                  onChange={(e) => setPartner1({ ...partner1, tob: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Partner 2 */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <h3 className="font-semibold text-sm text-rose-300 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-400" />
              <span>Partner 2 (Girl)</span>
            </h3>
            {matchMode === 'numerology' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                Moolank {moolank2} | Bhagyank {bhagyank2}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Name</label>
              <input
                type="text"
                value={partner2.name}
                onChange={(e) => setPartner2({ ...partner2, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-rose-200 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={partner2.dob}
                  onChange={(e) => setPartner2({ ...partner2, dob: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-rose-200 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Time of Birth {matchMode === 'numerology' && '(Optional)'}</label>
                <input
                  type="time"
                  value={partner2.tob}
                  onChange={(e) => setPartner2({ ...partner2, tob: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-rose-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mode Specific Compatibility Section */}
      {matchMode === 'crush' ? (
        /* CRUSH PROPOSAL ACCEPTANCE CALCULATOR VIEW */
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-rose-950/80 via-purple-950/70 to-slate-900/80 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-8 border-b border-rose-500/20 pb-6">
              {/* Proposal Chance Meter */}
              <div className="flex flex-col items-center justify-center p-6 bg-black/50 rounded-3xl border border-pink-500/40 text-center min-w-[260px] shadow-2xl relative">
                <span className="text-[11px] text-pink-300 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Proposal Success Chance</span>
                </span>
                <div className="text-6xl font-black font-serif text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-amber-200">
                  {crushResult.proposalSuccessChance}%
                </div>
                <div className="mt-2 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/25 text-rose-200 border border-rose-400/40 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  <span>{crushResult.verdict}</span>
                </div>
                <p className="text-xs text-amber-300 font-bold mt-2 leading-tight">
                  {crushResult.verdictHindi}
                </p>
              </div>

              {/* Love Percentage Progress Meters */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white font-serif flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-400 fill-rose-400" />
                    <span>Love Attraction & Kundali Synergy Breakdown</span>
                  </h3>
                  <span className="text-xs text-indigo-300 font-mono">
                    Mulank {crushResult.moolank1} 💕 {crushResult.moolank2}
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Proposal Success Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">1. Proposal Acceptance Chance (प्रपोज हां होने के आसार)</span>
                      <span className="font-bold text-pink-300">{crushResult.proposalSuccessChance}%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-pink-500/20">
                      <div
                        className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${crushResult.proposalSuccessChance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Mutual Feelings Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">2. Mutual Feelings & Attraction (आपसी खिंचाव व दिल की बात)</span>
                      <span className="font-bold text-rose-300">{crushResult.mutualAttractionScore}%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-rose-500/20">
                      <div
                        className="bg-gradient-to-r from-rose-500 to-purple-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${crushResult.mutualAttractionScore}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Emotional Magnetism Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-300 font-medium">3. Emotional Magnetism & Vibe Match</span>
                      <span className="font-bold text-amber-300">{crushResult.emotionalMagnetismScore}%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-amber-500/20">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-1000"
                        style={{ width: `${crushResult.emotionalMagnetismScore}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-gray-300">
                  <span className="font-bold text-pink-300 block mb-0.5">Shukra (Venus) Grah Influence:</span>
                  {crushResult.shukraGrahStatus}
                </div>
              </div>
            </div>

            {/* Auspicious Proposal Schedule & Strategy Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-pink-500/30 space-y-2">
                <div className="flex items-center gap-2 text-pink-300 font-bold text-xs uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-pink-400" />
                  <span>Auspicious Proposal Day (शुभ दिन)</span>
                </div>
                <div className="font-serif font-bold text-white text-sm">
                  {crushResult.bestDayToPropose}
                </div>
                <div className="text-xs text-indigo-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Time Window: {crushResult.bestTimeWindow}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span>Proposal Style & Approach Tip</span>
                </div>
                <p className="text-xs text-gray-200 leading-relaxed">
                  {crushResult.proposalStyleTip}
                </p>
              </div>
            </div>

            {/* Vedic Love & Venus Remedies Box */}
            <div className="p-5 rounded-2xl bg-black/50 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Guruji's Vedic Upay for Proposal Success (शुक्र देव उपाय)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {crushResult.vedicLoveRemedies.map((remedy, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-start gap-2 text-gray-200">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{remedy}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : matchMode === 'vedic' ? (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-8">
          <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-rose-500/30 text-center min-w-[220px]">
            <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Gun Score</span>
            <div className="text-6xl font-black font-serif text-white">
              {gunScore.totalScore}
              <span className="text-lg text-gray-500 font-sans">/36</span>
            </div>
            <span className="mt-2 text-xs font-extrabold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {gunScore.verdict}
            </span>
            <span className="text-[10px] text-gray-400 mt-1">{gunScore.percentage}% Compatibility</span>
          </div>

          <div className="flex-1 space-y-3">
            <h3 className="font-bold text-base text-white font-serif">Ashta Koota Compatibility Breakdown</h3>
            <p className="text-xs text-gray-300 leading-relaxed">
              Out of 36 maximum Gunas, a minimum of 18 Gunas is required for a harmonious marriage in Vedic Kundali astrology.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries({
                Varna: gunScore.varna,
                Vashya: gunScore.vashya,
                Tara: gunScore.tara,
                Yoni: gunScore.yoni,
                Maitri: gunScore.maitri,
                Gana: gunScore.gana,
                Bhakoot: gunScore.bhakoot,
                Nadi: gunScore.nadi
              }).map(([kootaName, data]) => (
                <div key={kootaName} className="p-2.5 rounded-2xl bg-black/30 border border-white/5">
                  <span className="text-[10px] text-gray-400 block">{kootaName}</span>
                  <span className="font-bold text-indigo-300">
                    {data.score} / {data.max}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* NUMEROLOGY MOOLANK & BHAGYANK MATCH SECTION */
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/10 pb-6">
              <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-3xl border border-indigo-500/30 text-center min-w-[240px]">
                <span className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Total Numerology Synergy</span>
                <div className="text-6xl font-black font-serif text-white">
                  {numCompat.matrixScore}
                  <span className="text-lg text-gray-500 font-sans">%</span>
                </div>
                <span className="mt-2 text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {numCompat.matrixVerdict}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">
                  Moolank ({moolank1} & {moolank2}) + Bhagyank ({bhagyank1} & {bhagyank2})
                </span>
              </div>

              <div className="flex-1 space-y-3">
                <h3 className="font-bold text-base text-white font-serif">Moolank & Bhagyank Love Match Matrix</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Evaluates romance, planetary alignment, emotional compatibility, and long-term marriage destiny directly from birth date vibrations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-300 font-bold">1. Moolank to Moolank Match</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
                        {numCompat.moolankOnlyMatch.score}%
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      Birth Day {partner1.dob.split('-')[2]} ({numCompat.moolankOnlyMatch.ruler1}) vs Day {partner2.dob.split('-')[2]} ({numCompat.moolankOnlyMatch.ruler2})
                    </span>
                    <p className="text-[11px] text-gray-300 pt-1 leading-snug">
                      {numCompat.moolankOnlyMatch.desc}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-purple-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-300 font-bold">2. Moolank + Bhagyank Match</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-xs font-bold">
                        {numCompat.combinedMatch.score}%
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      Full Life Path Combination {numCompat.combinedMatch.moolankBhagyankPairing}
                    </span>
                    <p className="text-[11px] text-gray-300 pt-1 leading-snug">
                      {numCompat.combinedMatch.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Life Domain Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-black/30 border border-rose-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                    <Heart className="w-4 h-4 text-rose-400" />
                    <span>Moolank Love & Romance Synergy</span>
                  </div>
                  <span className="font-bold text-rose-300 text-sm">{numCompat.relationship.score}%</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{numCompat.relationship.desc}</p>
              </div>

              <div className="p-5 rounded-2xl bg-black/30 border border-indigo-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Briefcase className="w-4 h-4 text-indigo-400" />
                    <span>Bhagyank Career & Wealth Fortune</span>
                  </div>
                  <span className="font-bold text-indigo-300 text-sm">{numCompat.career.score}%</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{numCompat.career.desc}</p>
              </div>

              <div className="p-5 rounded-2xl bg-black/30 border border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <Activity className="w-4 h-4 text-amber-400" />
                    <span>Health & Stress Balance</span>
                  </div>
                  <span className="font-bold text-amber-300 text-sm">{numCompat.health.score}%</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{numCompat.health.desc}</p>
              </div>

              <div className="p-5 rounded-2xl bg-black/30 border border-purple-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <Compass className="w-4 h-4 text-purple-400" />
                    <span>Destiny & Family Longevity</span>
                  </div>
                  <span className="font-bold text-purple-300 text-sm">{numCompat.lifePath.score}%</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{numCompat.lifePath.desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Gun Milan Report */}
      {(isLoadingAi || aiAnalysis) && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-5 h-5 text-rose-300 animate-spin-slow" />
            <h3 className="font-bold text-base font-serif text-white">
              AI Matchmaking & Relationship Remedy Advice
            </h3>
          </div>

          {isLoadingAi ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs text-rose-200">
                Analyzing compatibility parameters and remedies between {partner1.name} & {partner2.name}...
              </p>
            </div>
          ) : (
            <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-line p-5 rounded-2xl bg-black/40 border border-white/10">
              {aiAnalysis}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

