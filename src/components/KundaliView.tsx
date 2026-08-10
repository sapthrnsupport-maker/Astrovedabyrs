import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  HelpCircle,
  Eye,
  ChevronRight,
  Star,
  Sun,
  Moon,
  Share2,
  Copy,
  Check,
  Info,
  X
} from 'lucide-react';
import { UserProfile, KundaliChartData } from '../types';
import { calculateVedicKundali, ZODIAC_SIGNS, getDetailedNakshatraAndPanchang, calculateCareerProbability, calculateMoolank, calculateBhagyank } from '../utils/astrologyEngine';
import { generateKundaliPDF } from '../utils/pdfGenerator';
import { LocationInput } from './LocationInput';

interface KundaliViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
}

const HOUSE_INFO: { [key: number]: { name: string; nameHindi: string; significance: string; prediction: string } } = {
  1: {
    name: '1st House - Tanu Bhava (Self & Ascendant)',
    nameHindi: 'प्रथम भाव - लग्न (शरीर व व्यक्तित्व)',
    significance: 'Physical appearance, vitality, temperament, self-expression, and overall life path.',
    prediction: 'Your 1st house indicates strong magnetic personality, leadership drive, and resilient health. Surya/Lagna alignment grants high energy.'
  },
  2: {
    name: '2nd House - Dhana Bhava (Wealth & Speech)',
    nameHindi: 'द्वितीय भाव - धन व वाणी',
    significance: 'Accumulated wealth, family lineage, vocal expression, financial assets, and food preferences.',
    prediction: 'Financial luck is favorable. Mercury/Venus aspects ensure persuasive speech and steady wealth growth in mid-career.'
  },
  3: {
    name: '3rd House - Sahaja Bhava (Courage & Siblings)',
    nameHindi: 'तृतीय भाव - पराक्रम व अनुज',
    significance: 'Valor, short journeys, communication, younger siblings, and creative writing/tech skills.',
    prediction: 'Mars placement boosts courage and initiative. You excel in tech, digital media, or sales through self-driven hard work.'
  },
  4: {
    name: '4. 4th House - Sukha Bhava (Mother & Property)',
    nameHindi: 'चतुर्थ भाव - सुख व माता',
    significance: 'Domestic peace, vehicles, landed property, real estate, motherly affection, and heart stability.',
    prediction: 'Jupiter aspect brings strong chances of owning prime residential property and vehicle gains by 2026-2027.'
  },
  5: {
    name: '5th House - Putra & Vidya Bhava (Intellect & Love)',
    nameHindi: 'पंचम भाव - संतति व विद्या',
    significance: 'Higher education, romance, speculative gains, intelligence, purva punya (past good karmas).',
    prediction: 'Highly creative intellect. Strong 5th house ensures success in higher studies, romantic attraction, and stock investments.'
  },
  6: {
    name: '6th House - Shatru Bhava (Health & Competition)',
    nameHindi: 'षष्ठ भाव - रोग व शत्रु',
    significance: 'Competitive exams, victory over rivals, daily work routine, health care, and debt clearance.',
    prediction: 'Excellent competitive endurance. You will easily defeat professional rivals and crack competitive exams.'
  },
  7: {
    name: '7th House - Kalatra Bhava (Marriage & Business Partner)',
    nameHindi: 'सप्तम भाव - विवाह व साझीदार',
    significance: 'Life partner characteristics, marital harmony, business partnerships, public relations.',
    prediction: 'Spouse will be educated, supportive, and attractive. Joint business ventures yield high returns.'
  },
  8: {
    name: '8th House - Randhra Bhava (Longevity & Mysticism)',
    nameHindi: 'अष्टम भाव - आयु व गूढ़ विद्या',
    significance: 'Inheritance, sudden financial gains, research abilities, longevity, and occult wisdom.',
    prediction: 'High intuitive abilities and potential for unearned wealth/inheritances or stock windfalls.'
  },
  9: {
    name: '9th House - Dharma Bhava (Luck & Foreign Journeys)',
    nameHindi: 'नवम भाव - भाग्य व धर्म',
    significance: 'Fortune, higher learning, pilgrimages, relationship with father, and long-distance travel.',
    prediction: 'High fortune index! Jupiter/Sun blessing brings foreign travel opportunities and mentors support.'
  },
  10: {
    name: '10th House - Karma Bhava (Career & Authority)',
    nameHindi: 'दशम भाव - कर्म व राजयोग',
    significance: 'Profession, government favor, public status, authority, executive promotions.',
    prediction: 'Strong Rajyoga alignment! High career growth, leadership promotions, and administrative recognition.'
  },
  11: {
    name: '11th House - Labha Bhava (Income & Desires)',
    nameHindi: 'एकादश भाव - लाभ व सिद्धि',
    significance: 'Multiple income streams, social network, realization of life ambitions, elder siblings.',
    prediction: 'Multiple revenue sources. Your long-held dreams and financial targets will be fulfilled in upcoming dasha.'
  },
  12: {
    name: '12th House - Vyaya Bhava (Expenditure & Foreign Settlement)',
    nameHindi: 'द्वादश भाव - व्यय व विदेश गमन',
    significance: 'Subconscious mind, foreign lands, spiritual liberation (Moksha), investments abroad.',
    prediction: 'Strong foreign connections. Ideal placement for MNC employment, PR visa approval, or overseas trips.'
  }
};

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
  const [activePredictionTab, setActivePredictionTab] = useState<'career' | 'marriage' | 'timeline' | 'remedies' | 'instant'>('career');
  const [selectedHouse, setSelectedHouse] = useState<number | null>(null);
  const [aiReading, setAiReading] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const handleCopyKundaliSummary = () => {
    const moolankVal = calculateMoolank(formData.dob);
    const bhagyankVal = calculateBhagyank(formData.dob);
    const summaryText = `✨ AstroVeda AI Kundali Report for ${formData.name} ✨
• Moon Sign (Rashi): ${kundaliData.moonRashi} (${kundaliData.moonRashiHindi})
• Ascendant (Lagna): ${kundaliData.lagnaRashi} (${kundaliData.lagnaRashiHindi})
• Janma Nakshatra: ${nakshatraDetail.nakshatraName} (${nakshatraDetail.nakshatraHindi}) - Pada ${nakshatraDetail.pada}
• Moolank (Driver): ${moolankVal} | Bhagyank (Conductor): ${bhagyankVal}
• Current Mahadasha: ${kundaliData.dasha.currentMahadasha} - Antardasha: ${kundaliData.dasha.currentAntardasha} (until ${kundaliData.dasha.endDate})
• Birth Place: ${formData.pob}

Verified by AstroVeda AI Kundali - https://astroveda.app`;

    navigator.clipboard.writeText(summaryText);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3500);
  };

  const handleLoadSampleProfile = (sample: { name: string; dob: string; tob: string; pob: string; gender: 'male' | 'female' | 'other' }) => {
    setFormData(sample);
    setIsUnknownTime(false);
    onUpdateProfile(sample);
  };

  const handleToggleUnknownTime = (checked: boolean) => {
    setIsUnknownTime(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, tob: '12:00' }));
    }
  };

  const kundaliData: KundaliChartData = calculateVedicKundali(
    formData.dob,
    isUnknownTime ? '12:00' : formData.tob,
    formData.name
  );

  const nakshatraDetail = getDetailedNakshatraAndPanchang(
    formData.dob,
    isUnknownTime ? '12:00' : formData.tob,
    formData.pob
  );

  const careerProb = calculateCareerProbability(formData.name, formData.dob, isUnknownTime ? '12:00' : formData.tob);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...formData,
      tob: isUnknownTime ? '12:00' : formData.tob
    });
  };

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

  // Helper to render Vedic Diamond Chart SVG with click interaction & orbital animation
  const renderDiamondChart = (housesData: { [h: number]: { rashi: string; planets: string[] } }) => {
    const houseCoords: { [h: number]: { x: number; y: number } } = {
      1: { x: 150, y: 75 },
      2: { x: 75, y: 38 },
      3: { x: 38, y: 75 },
      4: { x: 75, y: 150 },
      5: { x: 38, y: 225 },
      6: { x: 75, y: 262 },
      7: { x: 150, y: 225 },
      8: { x: 225, y: 262 },
      9: { x: 262, y: 225 },
      10: { x: 225, y: 150 },
      11: { x: 262, y: 75 },
      12: { x: 225, y: 38 }
    };

    return (
      <div className="relative w-full max-w-[360px] mx-auto aspect-square bg-gradient-to-b from-[#0b051d] via-[#10092b] to-[#06020e] rounded-3xl border-2 border-indigo-400/40 p-3 shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Animated 3D Celestial Ring Background */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-2 rounded-full border border-dashed border-amber-400/20 pointer-events-none"
        ></motion.div>

        <svg viewBox="0 0 300 300" className="w-full h-full text-indigo-400/60 relative z-10">
          <rect x="5" y="5" width="290" height="290" fill="none" stroke="currentColor" strokeWidth="2.5" />
          <line x1="5" y1="5" x2="295" y2="295" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
          <line x1="295" y1="5" x2="5" y2="295" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
          <polygon points="150,5 295,150 150,295 5,150" fill="none" stroke="#fbbf24" strokeWidth="2" />
        </svg>

        {/* Clickable Interactive House Nodes */}
        {Object.entries(houseCoords).map(([hNumStr, pos]) => {
          const hNum = parseInt(hNumStr, 10);
          const houseInfo = housesData[hNum];
          const isSelected = selectedHouse === hNum;

          return (
            <motion.div
              key={hNum}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedHouse(hNum)}
              style={{ left: `${(pos.x / 300) * 100}%`, top: `${(pos.y / 300) * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 text-center cursor-pointer p-1.5 rounded-xl transition-all z-20 ${
                isSelected
                  ? 'bg-amber-500/30 border border-amber-400 shadow-lg shadow-amber-500/50 scale-110'
                  : 'hover:bg-indigo-500/20'
              }`}
            >
              <div className="text-[10px] font-extrabold text-amber-300 font-serif leading-none mb-0.5">
                H{hNum}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-0.5 max-w-[55px]">
                {houseInfo?.planets.map((p, idx) => (
                  <span
                    key={idx}
                    className="text-[9px] font-extrabold px-1 py-0.2 rounded bg-gradient-to-r from-amber-500/20 to-purple-500/30 text-amber-200 border border-amber-400/40 shadow-sm"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                3D Vedic Parashari Engine
              </span>
              <span className="text-xs text-amber-300 font-medium">✨ Interactive Kundali & Real Predictions</span>
            </div>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
              Vedic Birth Chart (Janm Kundali)
            </h1>
            <p className="text-xs text-gray-300">
              Interactive 3D Kundali chart, house predictions, Vimshottari dasha, and Lal Kitab remedies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyKundaliSummary}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-bold text-sm hover:bg-amber-500/20 active:scale-95 transition-all cursor-pointer shadow-md"
              title="Copy formatted Kundali summary for WhatsApp or social sharing"
            >
              <Share2 className="w-4 h-4 text-amber-300" />
              <span>Share Summary</span>
            </button>

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
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>{isLoadingAi ? 'Consulting Guruji...' : 'Generate AI Deep Kundali Report'}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-indigo-200 font-mono">1 min</span>
            </button>
          </div>
        </div>
      </div>

      {copyToast && (
        <div className="p-4 bg-amber-500/20 backdrop-blur-md border border-amber-500/40 rounded-2xl text-xs text-amber-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-amber-400" />
            <span>Kundali Summary copied to clipboard! Ready to paste on WhatsApp or social media.</span>
          </div>
          <span className="text-[10px] font-mono text-amber-300">Text Copied</span>
        </div>
      )}

      {pdfSuccessToast && (
        <div className="p-4 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center justify-between shadow-xl animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Kundali PDF report downloaded successfully!</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">Format: jsPDF</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Birth Details Input & Nakshatra */}
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

            {/* Quick Demo Sample Kundalis */}
            <div className="p-2.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 space-y-1.5">
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Quick Test Kundali Presets</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleLoadSampleProfile({ name: 'Shri Krishna (Sample)', dob: '1998-08-15', tob: '00:00', pob: 'Varanasi, Uttar Pradesh, India', gender: 'male' })}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 text-[10px] text-gray-300 hover:text-white transition-all text-left truncate cursor-pointer"
                >
                  ⚡ Varanasi (1998)
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSampleProfile({ name: 'Aarav Sharma (Sample)', dob: '2000-05-10', tob: '08:30', pob: 'New Delhi, Delhi, India', gender: 'male' })}
                  className="px-2 py-1 rounded-lg bg-white/5 hover:bg-indigo-500/20 border border-white/10 text-[10px] text-gray-300 hover:text-white transition-all text-left truncate cursor-pointer"
                >
                  ⚡ New Delhi (2000)
                </button>
              </div>
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

              <div className="p-2.5 rounded-xl bg-black/30 border border-white/10 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="unknownTimeCb"
                  checked={isUnknownTime}
                  onChange={(e) => handleToggleUnknownTime(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="unknownTimeCb" className="text-[11px] text-gray-300 leading-tight cursor-pointer">
                  <span className="font-bold text-indigo-300 block">Birth Time Unknown</span>
                  <span className="text-[10px] text-gray-400">Surya Kundali Solar Ascendant mode</span>
                </label>
              </div>

              <div>
                <LocationInput
                  label="Place of Birth (City / Town)"
                  value={formData.pob}
                  onChange={(city) => setFormData({ ...formData, pob: city })}
                  placeholder="Type city (e.g. New Delhi, Varanasi, London)..."
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
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-indigo-200 font-semibold text-xs border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recalculate Kundali</span>
              </button>
            </form>
          </div>

          {/* Nakshatra & Panchang Report Card */}
          <div className="bg-gradient-to-br from-indigo-950/80 via-purple-950/70 to-slate-900/80 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-400 animate-spin-slow" />
                <h3 className="font-bold text-xs text-amber-200 uppercase tracking-wider">
                  Nakshatra & Panchang Report
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-indigo-500/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-indigo-300 block font-semibold uppercase tracking-wider">Janma Nakshatra</span>
                <div className="font-serif font-bold text-lg text-white flex items-center gap-2 mt-0.5">
                  <span>{nakshatraDetail.nakshatraName}</span>
                  <span className="text-xs text-amber-300">({nakshatraDetail.nakshatraHindi})</span>
                </div>
                <p className="text-[10px] text-gray-300 mt-0.5">
                  Deity: <strong>{nakshatraDetail.deity}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-gray-400 block font-mono">Pada</span>
                <div className="text-xl font-extrabold text-amber-400 font-serif">
                  Pada {nakshatraDetail.pada}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Lord (स्वामी)</span>
                <span className="font-bold text-white">{nakshatraDetail.lord}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Gana (गण)</span>
                <span className="font-bold text-white">{nakshatraDetail.gana}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Nadi (नाड़ी)</span>
                <span className="font-bold text-white">{nakshatraDetail.nadi}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                <span className="text-[10px] text-gray-400 block">Yoni (योनि)</span>
                <span className="font-bold text-white truncate block">{nakshatraDetail.yoni}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Chart & Real Predictions Suite */}
        <div className="lg:col-span-2 space-y-6">
          {/* Diamond Kundali Display */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4 relative">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-indigo-400 animate-spin-slow" />
                <h3 className="font-bold text-base text-white font-serif">Interactive Kundali Chart</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  Tap Any House
                </span>
              </div>

              <div className="flex p-1 bg-black/40 rounded-full border border-white/10 text-xs">
                <button
                  onClick={() => setActiveChartTab('lagna')}
                  className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                    activeChartTab === 'lagna' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Lagna (D1)
                </button>
                <button
                  onClick={() => setActiveChartTab('navamsha')}
                  className={`px-3.5 py-1 rounded-full font-semibold transition-all cursor-pointer ${
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

            {/* POPUP CARD FOR SELECTED HOUSE DETAILS */}
            {selectedHouse !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-indigo-950/95 border border-amber-400/50 shadow-2xl space-y-2 relative"
              >
                <button
                  onClick={() => setSelectedHouse(null)}
                  className="absolute top-3 right-3 p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                    House #{selectedHouse}
                  </span>
                  <h4 className="font-bold text-sm text-white font-serif">
                    {HOUSE_INFO[selectedHouse]?.name}
                  </h4>
                </div>
                <p className="text-xs text-indigo-200">
                  <strong>Significance:</strong> {HOUSE_INFO[selectedHouse]?.significance}
                </p>
                <div className="p-3 rounded-xl bg-black/40 border border-amber-400/20 text-xs text-amber-100">
                  <strong>Vedic Prediction:</strong> {HOUSE_INFO[selectedHouse]?.prediction}
                </div>
              </motion.div>
            )}

            <p className="text-center text-[11px] text-gray-400 italic">
              *Tap house nodes H1–H12 to reveal deep house significations and planetary predictions.
            </p>
          </div>

          {/* REAL PREDICTIONS TABBED SUITE */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white font-serif">Real Calculated Vedic Predictions</h3>
              </div>
              <span className="text-xs text-amber-300 font-mono font-bold">Updated for 2026-2028</span>
            </div>

            {/* Prediction Category Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2">
              <button
                onClick={() => setActivePredictionTab('career')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activePredictionTab === 'career'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>💼 Career & Money</span>
              </button>
              <button
                onClick={() => setActivePredictionTab('marriage')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activePredictionTab === 'marriage'
                    ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>💖 Love & Marriage</span>
              </button>
              <button
                onClick={() => setActivePredictionTab('timeline')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activePredictionTab === 'timeline'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>⏳ Dasha Timeline (2026-2030)</span>
              </button>
              <button
                onClick={() => setActivePredictionTab('remedies')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activePredictionTab === 'remedies'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <span>🛡️ Lal Kitab Upay</span>
              </button>
            </div>

            {/* Prediction Tab Content */}
            {activePredictionTab === 'career' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300 font-medium">Job Promotion Probability</span>
                      <span className="text-sm font-bold text-emerald-400">{careerProb.jobPromotionChance}%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${careerProb.jobPromotionChance}%` }}></div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-300 font-medium">Govt Exam / Public Sector Luck</span>
                      <span className="text-sm font-bold text-indigo-300">{careerProb.governmentJobChance}%</span>
                    </div>
                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full" style={{ width: `${careerProb.governmentJobChance}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs space-y-2">
                  <h4 className="font-bold text-amber-300 font-serif text-sm">🎯 Best Lucrative Career Paths:</h4>
                  <p className="text-gray-200">{careerProb.bestCareerField}</p>
                  <span className="text-[10px] text-indigo-300 block pt-1 font-mono">
                    *Based on 10th House Lord, Sun, Jupiter transit & Moolank alignment.
                  </span>
                </div>
              </div>
            )}

            {activePredictionTab === 'marriage' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-pink-950/40 border border-pink-500/30 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-pink-200 font-serif text-sm">💖 Marriage & Life Partner Forecast</h4>
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">
                      7th House Active
                    </span>
                  </div>
                  <p className="text-gray-200 leading-relaxed">
                    Your 7th house and Venus placement indicate an affectionate, supportive, and cultured partner. Marriage timing is highly favorable between late 2026 and mid 2028 under Jupiter’s 7th house aspect.
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                    <div className="p-2 rounded-xl bg-black/40 border border-pink-500/20">
                      <span className="text-gray-400 block text-[10px]">Marriage Type:</span>
                      <span className="font-bold text-white">Love / Mutual Choice (78%)</span>
                    </div>
                    <div className="p-2 rounded-xl bg-black/40 border border-pink-500/20">
                      <span className="text-gray-400 block text-[10px]">Spouse Direction:</span>
                      <span className="font-bold text-amber-300">East / North-East City</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activePredictionTab === 'timeline' && (
              <div className="space-y-3">
                <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider">
                  ⏳ Golden Period & Vimshottari Dasha Forecast:
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">2026 Golden Peak Phase:</span>
                      <span>Career expansion, promotion, and financial growth.</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-1 rounded bg-black/40 text-amber-300">HIGH LUCK</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">2027-2028 Relationship & Property Phase:</span>
                      <span>Strong marriage yoga and real estate purchase.</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-1 rounded bg-black/40 text-indigo-300">FAVORABLE</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white block">2029-2030 High Wealth & Authority:</span>
                      <span>Executive leadership roles and passive income streams.</span>
                    </div>
                    <span className="font-mono text-[10px] px-2 py-1 rounded bg-black/40 text-emerald-300">STABILITY</span>
                  </div>
                </div>
              </div>
            )}

            {activePredictionTab === 'remedies' && (
              <div className="space-y-3">
                <h4 className="font-bold text-emerald-300 text-xs uppercase tracking-wider">
                  🛡️ Powerful Vedic & Lal Kitab Upay:
                </h4>
                <div className="space-y-2 text-xs">
                  {careerProb.careerUpay.map((remedy, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 text-gray-200 flex items-start gap-2">
                      <span className="text-amber-400 font-bold shrink-0">{idx + 1}.</span>
                      <p>{remedy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Reading Box */}
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
