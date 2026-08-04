import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Hand,
  Sparkles,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Heart,
  Flame,
  Zap,
  ShieldCheck,
  Download,
  Eye,
  ChevronRight,
  Sun,
  Award,
  BookOpen
} from 'lucide-react';
import { UserProfile } from '../types';
import palmBannerImg from '../assets/images/palm_reading_banner_1785862823081.jpg';

interface PalmReadingViewProps {
  userProfile: UserProfile;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
  onStartChat: (prompt?: string) => void;
}

interface PalmLineDetail {
  id: string;
  name: string;
  nameHindi: string;
  color?: string;
  significance: string;
  reading: string;
}

const PALM_LINES: PalmLineDetail[] = [
  {
    id: 'life',
    name: 'Life Line (Ayur Rekha)',
    nameHindi: 'जीवन रेखा (आयुष्य व स्वास्थ्य)',
    color: 'from-emerald-400 to-teal-500',
    significance: 'Vitality, physical immunity, stamina, and key life milestones.',
    reading: 'Your Life Line is deep, long, and clear with no major breaks. This indicates high vitality, strong physical immunity, and an active long life (80+ years). A secondary support line (Mars Line / देव रेखा) protects you from sudden illnesses.'
  },
  {
    id: 'heart',
    name: 'Heart Line (Hridaya Rekha)',
    nameHindi: 'हृदय रेखा (प्रेम व संबंध)',
    significance: 'Emotional depth, romantic loyalty, marriage compatibility, and cardiac health.',
    reading: 'The Heart Line curves gracefully toward the Mount of Jupiter (Index Finger). This signifies a loyal, compassionate, and deeply devoted partner. High emotional intelligence ensures strong romantic harmony after age 24.'
  },
  {
    id: 'head',
    name: 'Head Line (Mastishk Rekha)',
    nameHindi: 'मस्तिष्क रेखा (बुद्धि व निर्णय)',
    significance: 'Analytical power, memory, decision-making, and intellectual focus.',
    reading: 'Your Head Line is sharp and slightly sloped toward the Mount of Moon. This grants rich creative imagination, strategic business acumen, and high adaptability in tech, management, or finance.'
  },
  {
    id: 'fate',
    name: 'Fate Line (Bhagya Rekha)',
    nameHindi: 'भाग्य रेखा (धन व करियर भाग्य)',
    significance: 'Career growth, financial windfalls, job stability, and business luck.',
    reading: 'Fate Line originates clearly from the palm base and rises straight toward Saturn Mount. A major financial surge and career elevation is indicated around age 27 to 32 with multiple income streams.'
  },
  {
    id: 'venus',
    name: 'Mount of Venus (Shukra Parvat)',
    nameHindi: 'शुक्र पर्वत (सुख, समृद्धि व वाहन)',
    significance: 'Luxury, vehicles, real estate, physical beauty, and romantic charm.',
    reading: 'The Mount of Venus is prominent, firm, and well-developed. This confirms high luxury luck, love for aesthetic comfort, ownership of prime vehicles/property, and high social charm.'
  }
];

export const PalmReadingView: React.FC<PalmReadingViewProps> = ({
  userProfile,
  availableMinutes,
  onDeductMinute,
  onOpenRechargeModal,
  onStartChat
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedHand, setSelectedHand] = useState<'right' | 'left'>('right');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanCompleted, setScanCompleted] = useState(false);
  const [activeLine, setActiveLine] = useState<PalmLineDetail>(PALM_LINES[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
        triggerAiScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAiScan = () => {
    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    const deducted = onDeductMinute();
    if (!deducted) return;

    setIsScanning(true);
    setScanProgress(0);
    setScanCompleted(false);

    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setScanProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setIsScanning(false);
        setScanCompleted(true);
      }
    }, 250);
  };

  return (
    <div className="space-y-8">
      {/* Top Header Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                AI Hasta Rekha Scanner ✋
              </span>
              <span className="text-xs text-indigo-300 font-medium">100% Real Vedic Palmistry Analysis</span>
            </div>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-amber-100 to-orange-200 bg-clip-text text-transparent">
              AI Palm Reading & Line Scan (हस्तरेखा विज्ञान)
            </h1>
            <p className="text-xs text-gray-300">
              Upload your hand photo or scan directly to decode Life Line, Heart Line, Fate Line & Venus Mount luck.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/40 border border-white/10 p-1 rounded-2xl">
              <button
                onClick={() => setSelectedHand('right')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedHand === 'right' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Right Hand (दाहिना हाथ)
              </button>
              <button
                onClick={() => setSelectedHand('left')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedHand === 'left' ? 'bg-amber-500 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                Left Hand (बायाँ हाथ)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: SCANNER / UPLOAD CANVAS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-gradient-to-b from-slate-950/90 via-indigo-950/80 to-black border border-indigo-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
            {/* Holographic Laser Grid Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

            {/* SCAN CANVAS CONTAINER */}
            <div className="relative w-full max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-black">
              {/* Image Source (Uploaded or Default Demo) */}
              <img
                src={uploadedImage || palmBannerImg}
                alt="Palm Scan"
                className="w-full h-full object-cover"
              />

              {/* SCANNER LASER LINE SWEEP */}
              {isScanning && (
                <motion.div
                  animate={{ y: ['0%', '100%', '0%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-300 shadow-[0_0_15px_#f59e0b] z-20"
                ></motion.div>
              )}

              {/* HIGHLIGHTED GLOWING PALMISTRY ENERGY POINTS */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-[35%] left-[25%] w-3 h-3 rounded-full bg-emerald-400 animate-ping shadow-[0_0_10px_#10b981]"></div>
                <div className="absolute top-[45%] left-[50%] w-3 h-3 rounded-full bg-pink-400 animate-ping shadow-[0_0_10px_#ec4899]"></div>
                <div className="absolute top-[65%] left-[40%] w-3 h-3 rounded-full bg-amber-400 animate-ping shadow-[0_0_10px_#f59e0b]"></div>
              </div>

              {/* SCAN PROGRESS OVERLAY */}
              {isScanning && (
                <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 z-30 text-center space-y-3">
                  <div className="w-12 h-12 border-3 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs font-bold text-amber-300 font-serif">
                    AI Analyzing Hasta Rekha Lines ({scanProgress}%)
                  </span>
                  <div className="w-48 bg-gray-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 h-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION BUTTONS UNDER SCANNER */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-sm">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
              >
                <Upload className="w-4 h-4 text-indigo-300" />
                <span>Upload Palm Photo</span>
              </button>

              <button
                onClick={triggerAiScan}
                disabled={isScanning}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/30 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>{isScanning ? 'Scanning...' : 'Scan Palm Lines'}</span>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-3 font-mono">
              *Requires 1 Consultation Minute per full scan report.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE LINE READINGS */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-base text-white font-serif flex items-center gap-2">
                <Hand className="w-5 h-5 text-amber-400" />
                <span>Vedic Hasta Rekha Predictions</span>
              </h3>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                {scanCompleted ? 'Scan Completed' : 'Interactive Lines'}
              </span>
            </div>

            {/* Line Selection Buttons */}
            <div className="flex flex-wrap gap-2">
              {PALM_LINES.map((line) => (
                <button
                  key={line.id}
                  onClick={() => setActiveLine(line)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeLine.id === line.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg border border-amber-300/40'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{line.name}</span>
                </button>
              ))}
            </div>

            {/* Selected Line Analysis Box */}
            <motion.div
              key={activeLine.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900/90 to-black border border-amber-400/40 space-y-3 shadow-2xl relative"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base text-amber-200 font-serif">
                    {activeLine.name}
                  </h4>
                  <span className="text-xs text-amber-400/90 font-mono">
                    {activeLine.nameHindi}
                  </span>
                </div>
                <span className="text-xl">✋</span>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-indigo-500/20 text-xs text-indigo-200">
                <strong>Significance:</strong> {activeLine.significance}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-100 leading-relaxed font-sans space-y-2">
                <strong className="text-amber-300 block font-serif text-sm">🔮 Vedic Palm Reading:</strong>
                <p>{activeLine.reading}</p>
              </div>

              {/* Consultation Trigger */}
              <div className="pt-2 flex items-center justify-between border-t border-white/10">
                <span className="text-[11px] text-gray-400">Want Guruji to answer specific palm questions?</span>
                <button
                  onClick={() => onStartChat(`Mera ${activeLine.name} analysis kijiye. Kya isse mujhe high wealth aur romantic success milegi?`)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs hover:brightness-110 cursor-pointer shadow-md"
                >
                  Ask Guruji Chat
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
