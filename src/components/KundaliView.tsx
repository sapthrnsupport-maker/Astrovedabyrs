import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  User,
  ShieldAlert,
  Flame,
  Award,
  BookOpen,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  HelpCircle
} from 'lucide-react';
import { UserProfile, KundaliChartData } from '../types';
import { calculateVedicKundali, ZODIAC_SIGNS, getDetailedNakshatraAndPanchang, calculateCareerProbability } from '../utils/astrologyEngine';
import { generateKundaliPDF } from '../utils/pdfGenerator';

interface KundaliViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
}

export const KundaliView: React.FC<KundaliViewProps> = ({
  userProfile,
  onUpdateProfile,
  availableMinutes,
  onDeductMinute,
  onOpenRechargeModal
}) => {
  const [formData, setFormData] = useState({
    name: userProfile.name,
    dob: userProfile.dob,
    tob: userProfile.tob,
    pob: userProfile.pob,
    gender: userProfile.gender
  });

  const [isUnknownTime, setIsUnknownTime] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'lagna' | 'navamsha'>('lagna');
  const [aiReading, setAiReading] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);

  // Handle unknown birth time toggle
  const handleToggleUnknownTime = (checked: boolean) => {
    setIsUnknownTime(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, tob: '12:00' }));
    }
  };

  // Generate Kundali based on active user form
  const kundaliData: KundaliChartData = calculateVedicKundali(
    formData.dob,
    isUnknownTime ? '12:00' : formData.tob,
    formData.name
  );

  // Detailed Nakshatra & Panchang Verification at Birth Time & Location
  const nakshatraDetail = getDetailedNakshatraAndPanchang(
    formData.dob,
    isUnknownTime ? '12:00' : formData.tob,
    formData.pob
  );

  // Career & Life Probability Calculation
  const careerProb = calculateCareerProbability(formData.name, formData.dob, isUnknownTime ? '12:00' : formData.tob);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      tob: isUnknownTime ? '12:00' : formData.tob
    });
  };

  // Download PDF Report
  const handleDownloadPDF = () => {
    generateKundaliPDF(
      { ...userProfile, ...formData, tob: isUnknownTime ? '12:00 (Surya Kundali)' : formData.tob },
      kundaliData,
      aiReading,
      isUnknownTime
    );
    setPdfSuccessToast(true);
    setTimeout(() => setPdfSuccessToast(false), 4000);
  };

  // Call Server-side Gemini API for Deep Kundali Reading
  const handleGenerateAiReading = async () => {
    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    const hasEnough = onDeductMinute();
    if (!hasEnough) return;

    setIsLoadingAi(true);
    setAiReading('');

    try {
      const response = await fetch('/api/ai/kundali-reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          dob: formData.dob,
          tob: isUnknownTime ? '12:00' : formData.tob,
          pob: formData.pob,
          gender: formData.gender,
          rashi: kundaliData.moonRashi,
          lagna: kundaliData.lagnaRashi,
          planets: kundaliData.planets,
          isUnknownTime
        })
      });

      const data = await response.json();
      if (data.reading) {
        setAiReading(data.reading);
      } else {
        setAiReading('Guruji was unable to complete the chart reading. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching Kundali AI reading:', err);
      setAiReading('Connection issue while reaching AI Guruji. Please verify internet connection.');
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Helper to render Vedic Diamond Chart SVG
  const renderDiamondChart = (housesData: { [h: number]: { rashi: string; planets: string[] } }) => {
    // 12 houses positions in diamond Kundali layout
    const houseCoords: { [h: number]: { x: number; y: number; labelX: number; labelY: number } } = {
      1: { x: 150, y: 75, labelX: 150, labelY: 95 },
      2: { x: 75, y: 38, labelX: 75, labelY: 45 },
      3: { x: 38, y: 75, labelX: 45, labelY: 75 },
      4: { x: 75, y: 150, labelX: 95, labelY: 150 },
      5: { x: 38, y: 225, labelX: 45, labelY: 225 },
      6: { x: 75, y: 262, labelX: 75, labelY: 255 },
      7: { x: 150, y: 225, labelX: 150, labelY: 205 },
      8: { x: 225, y: 262, labelX: 225, labelY: 255 },
      9: { x: 262, y: 225, labelX: 255, labelY: 225 },
      10: { x: 225, y: 150, labelX: 205, labelY: 150 },
      11: { x: 262, y: 75, labelX: 255, labelY: 75 },
      12: { x: 225, y: 38, labelX: 225, labelY: 45 }
    };

    return (
      <div className="relative w-full max-w-[340px] mx-auto aspect-square bg-[#0a0518]/90 rounded-2xl border-2 border-indigo-400/30 p-2 shadow-2xl backdrop-blur-md">
        <svg viewBox="0 0 300 300" className="w-full h-full text-indigo-400/50">
          {/* Outer Border */}
          <rect x="5" y="5" width="290" height="290" fill="none" stroke="currentColor" strokeWidth="2" />
          {/* Main Diagonal X */}
          <line x1="5" y1="5" x2="295" y2="295" stroke="currentColor" strokeWidth="1.5" />
          <line x1="295" y1="5" x2="5" y2="295" stroke="currentColor" strokeWidth="1.5" />
          {/* Inner Diamond */}
          <polygon points="150,5 295,150 150,295 5,150" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        {/* Render House Content */}
        {Object.entries(houseCoords).map(([hNumStr, pos]) => {
          const hNum = parseInt(hNumStr, 10);
          const houseInfo = housesData[hNum];
          return (
            <div
              key={hNum}
              style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 300) * 100}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
            >
              <div className="text-[10px] font-bold text-indigo-300 font-serif leading-none mb-0.5">
                {hNum}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[50px]">
                {houseInfo?.planets.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                Parashari Vedic Engine
              </span>
              <span className="text-xs text-gray-400">Exact Graha Calculation</span>
            </div>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              Vedic Birth Chart (Janm Kundali)
            </h1>
            <p className="text-xs text-gray-300">
              Complete planetary positions, Lagna D1 chart, Navamsha D9, Vimshottari Dasha & AI Guruji Predictions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4 text-indigo-300" />
              <span>Download PDF Kundali</span>
            </button>

            <button
              onClick={handleGenerateAiReading}
              disabled={isLoadingAi}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>{isLoadingAi ? 'Consulting Guruji...' : 'Generate AI Deep Kundali Report'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-indigo-200 font-mono">1 min</span>
            </button>
          </div>
        </div>
      </div>

      {pdfSuccessToast && (
        <div className="p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Kundali PDF report downloaded successfully!</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">Format: jsPDF</span>
        </div>
      )}

      {/* Main Grid: Left Form & Quick Stats, Right Charts & Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Birth Details Input & Key Astro Metrics */}
        <div className="space-y-6">
          {/* Birth Details Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-semibold text-sm text-indigo-200 flex items-center gap-2">
                <User className="w-4 h-4 text-indigo-400" />
                <span>Birth Details</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-mono">ID: {userProfile.id}</span>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Time of Birth</label>
                  <input
                    type="time"
                    value={isUnknownTime ? '12:00' : formData.tob}
                    onChange={(e) => setFormData({ ...formData, tob: e.target.value })}
                    disabled={isUnknownTime}
                    className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Unknown Birth Time Checkbox */}
              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="unknownTimeCb"
                  checked={isUnknownTime}
                  onChange={(e) => handleToggleUnknownTime(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="unknownTimeCb" className="text-[11px] text-gray-300 leading-tight cursor-pointer">
                  <span className="font-bold text-indigo-300 block">Birth Time Unknown (Samay nahi pata)</span>
                  <span className="text-[10px] text-gray-400">Default 12:00 PM (Surya Kundali / Solar Ascendant mode)</span>
                </label>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Place of Birth (City)</label>
                <input
                  type="text"
                  value={formData.pob}
                  onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate Kundali</span>
              </button>
            </form>
          </div>

          {/* Professional Nakshatra & Birth Detail Verification Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/70 to-slate-900/80 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <h3 className="font-bold text-xs text-amber-200 uppercase tracking-wider">
                  Birth Nakshatra & Panchang Report
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Astronomically Verified</span>
              </span>
            </div>

            {/* Main Nakshatra Banner */}
            <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-indigo-300 block font-semibold uppercase tracking-wider">Janma Nakshatra (जन्म नक्षत्र)</span>
                <div className="font-serif font-bold text-lg text-white flex items-center gap-2 mt-0.5">
                  <span>{nakshatraDetail.nakshatraName}</span>
                  <span className="text-xs text-amber-300">({nakshatraDetail.nakshatraHindi})</span>
                </div>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  Symbol: <strong>{nakshatraDetail.symbol}</strong> • Deity: <strong>{nakshatraDetail.deity}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 block font-mono">Pada (चरण)</span>
                <div className="text-xl font-extrabold text-amber-400 font-serif">
                  Pada {nakshatraDetail.pada}
                </div>
              </div>
            </div>

            {/* Nakshatra Parashari Attributes Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Nakshatra Lord (स्वामी)</span>
                <span className="font-bold text-white">{nakshatraDetail.lord}</span>
                <span className="text-[10px] text-amber-300 block">{nakshatraDetail.lordHindi}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Temperament (गण)</span>
                <span className="font-bold text-white">{nakshatraDetail.gana} Gana</span>
                <span className="text-[10px] text-indigo-300 block">{nakshatraDetail.ganaHindi}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Nadi (नाड़ी)</span>
                <span className="font-bold text-white">{nakshatraDetail.nadi} Nadi</span>
                <span className="text-[10px] text-indigo-300 block">{nakshatraDetail.nadiHindi}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Animal Yoni (योनि)</span>
                <span className="font-bold text-white truncate block">{nakshatraDetail.yoni}</span>
              </div>
            </div>

            {/* Panchang Summary at Birth Time */}
            <div className="pt-2 border-t border-white/10 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-gray-400">Birth Tithi:</span>
                <span className="font-bold text-white">{nakshatraDetail.tithi}</span>
              </div>
              <div className="flex items-center justify-between text-indigo-200">
                <span className="text-gray-400">Birth Yoga & Karana:</span>
                <span className="font-semibold text-indigo-300">{nakshatraDetail.yoga} • {nakshatraDetail.karana}</span>
              </div>
              <div className="flex items-center justify-between text-gray-400 pt-1 text-[9px] font-mono">
                <span>Location: {formData.pob}</span>
                <span>Sunrise: {nakshatraDetail.sunriseTime}</span>
              </div>
            </div>
          </div>

          {/* Core Astro Pillars Card */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-semibold text-sm text-indigo-200 pb-2 border-b border-white/10">
              Core Astrological Pillars
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Lagna (Ascendant)</span>
                <span className="font-bold text-white">{kundaliData.lagnaRashi}</span>
                <span className="text-[10px] text-indigo-300 block">{kundaliData.lagnaRashiHindi}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Janm Rashi (Moon Sign)</span>
                <span className="font-bold text-white">{kundaliData.moonRashi}</span>
                <span className="text-[10px] text-indigo-300 block">{kundaliData.moonRashiHindi}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Nakshatra</span>
                <span className="font-bold text-white">{kundaliData.nakshatra}</span>
                <span className="text-[10px] text-gray-400 block">Pada {kundaliData.pada}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Sun Sign (Surya)</span>
                <span className="font-bold text-white">{kundaliData.sunRashi}</span>
                <span className="text-[10px] text-indigo-300 block">{kundaliData.sunRashiHindi}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Diamond Chart & Planetary Positions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diamond Kundali Display */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white font-serif">Vedic Kundali Grid</h3>
              </div>

              {/* Chart Switcher */}
              <div className="flex p-1 bg-black/40 rounded-full border border-white/10 text-xs">
                <button
                  onClick={() => setActiveChartTab('lagna')}
                  className={`px-3.5 py-1 rounded-full font-semibold transition-all ${
                    activeChartTab === 'lagna' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lagna (D1)
                </button>
                <button
                  onClick={() => setActiveChartTab('navamsha')}
                  className={`px-3.5 py-1 rounded-full font-semibold transition-all ${
                    activeChartTab === 'navamsha' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Navamsha (D9)
                </button>
              </div>
            </div>

            {/* Diamond Chart Graphic */}
            <div className="py-2">
              {renderDiamondChart(
                activeChartTab === 'lagna' ? kundaliData.houses : kundaliData.navamshaHouses
              )}
            </div>
            <p className="text-center text-[11px] text-gray-400 italic">
              *Numbers 1–12 represent Houses (Bhavas). Su=Sun, Mo=Moon, Ma=Mars, Me=Mercury, Ju=Jupiter, Ve=Venus, Sa=Saturn, Ra=Rahu, Ke=Ketu.
            </p>
          </div>

          {/* Planetary Position Table */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-indigo-200">Graha Sthiti (Planetary Degrees & Nakshatra)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-200">
                <thead className="bg-black/40 text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-2.5">Planet</th>
                    <th className="p-2.5">Sign (Rashi)</th>
                    <th className="p-2.5">Degree</th>
                    <th className="p-2.5">House</th>
                    <th className="p-2.5">Nakshatra</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {kundaliData.planets.map((p, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="p-2.5 font-semibold text-white flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.retrograde && <span className="text-[9px] text-purple-400 font-bold">(R)</span>}
                      </td>
                      <td className="p-2.5">{p.rashi}</td>
                      <td className="p-2.5 font-mono text-gray-400">{p.degree}</td>
                      <td className="p-2.5 font-bold text-indigo-300">House {p.house}</td>
                      <td className="p-2.5">{p.nakshatra} (P{p.pada})</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[10px] font-medium border border-indigo-500/20">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Career & Life Probability Scorecard */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="font-bold text-sm text-amber-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Kundali Life & Career Success Probabilities (%)</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-400/30">
                10th House Transit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Job Promotion & Hike */}
              <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300 font-medium">Job Promotion / Salary Hike</span>
                  <span className="text-sm font-bold text-emerald-400">{careerProb.jobPromotionChance}%</span>
                </div>
                <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-emerald-500/20">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                    style={{ width: `${careerProb.jobPromotionChance}%` }}
                  ></div>
                </div>
              </div>

              {/* Govt Job & Exams */}
              <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300 font-medium">Government Job / Govt Exam</span>
                  <span className="text-sm font-bold text-indigo-300">{careerProb.governmentJobChance}%</span>
                </div>
                <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-indigo-500/20">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-400 h-full rounded-full"
                    style={{ width: `${careerProb.governmentJobChance}%` }}
                  ></div>
                </div>
              </div>

              {/* Business Expansion */}
              <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300 font-medium">Business Ownership & Profits</span>
                  <span className="text-sm font-bold text-amber-300">{careerProb.businessExpansionChance}%</span>
                </div>
                <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-amber-500/20">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full"
                    style={{ width: `${careerProb.businessExpansionChance}%` }}
                  ></div>
                </div>
              </div>

              {/* Foreign Placement */}
              <div className="p-4 rounded-2xl bg-black/40 border border-rose-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300 font-medium">Foreign Placement & Settlement</span>
                  <span className="text-sm font-bold text-rose-300">{careerProb.foreignPlacementChance}%</span>
                </div>
                <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-rose-500/20">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-pink-400 h-full rounded-full"
                    style={{ width: `${careerProb.foreignPlacementChance}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-black/30 border border-white/5 text-xs text-gray-300 space-y-1">
              <span className="font-bold text-indigo-300 block">Best Favorable Career Path:</span>
              <p>{careerProb.bestCareerField}</p>
            </div>
          </div>

          {/* Dosha Analysis Cards */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-sm text-indigo-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              <span>Kundali Dosha & Yoga Assessment</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Manglik */}
              <div
                className={`p-4 rounded-2xl border ${
                  kundaliData.doshas.manglik.present
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Manglik Yoga</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/40">
                    {kundaliData.doshas.manglik.present ? 'Present' : 'Absent'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{kundaliData.doshas.manglik.description}</p>
              </div>

              {/* Kaal Sarp */}
              <div
                className={`p-4 rounded-2xl border ${
                  kundaliData.doshas.kaalSarp.present
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Kaal Sarp Yoga</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/40">
                    {kundaliData.doshas.kaalSarp.present ? 'Present' : 'Absent'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{kundaliData.doshas.kaalSarp.description}</p>
              </div>

              {/* Sade Sati */}
              <div
                className={`p-4 rounded-2xl border ${
                  kundaliData.doshas.sadeSati.present
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs">Shani Sade Sati</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/40">
                    {kundaliData.doshas.sadeSati.present ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300">{kundaliData.doshas.sadeSati.description}</p>
              </div>

              {/* Pitra Dosha */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-gray-300">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-indigo-200">Pitra Dosha</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-black/40">
                    {kundaliData.doshas.pitraDosha.present ? 'Observed' : 'None'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">{kundaliData.doshas.pitraDosha.description}</p>
              </div>
            </div>
          </div>

          {/* AI Deep Reading Result Section */}
          {(isLoadingAi || aiReading) && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-300 animate-spin-slow" />
                <h3 className="font-bold text-base font-serif text-white">
                  Guruji's AI Deep Kundali Life Report
                </h3>
              </div>

              {isLoadingAi ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs text-indigo-200 font-medium">
                    Guruji is analyzing your Lagna chart, planetary degrees & Mahadasha transits...
                  </p>
                </div>
              ) : (
                <div className="text-xs text-gray-200 leading-relaxed whitespace-pre-line space-y-2 font-sans bg-black/40 p-5 rounded-2xl border border-white/10">
                  {aiReading}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
