import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Clock,
  PlusCircle,
  User,
  Bot,
  HelpCircle,
  Flame,
  AlertCircle,
  Sun,
  Compass,
  Star,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Maximize2,
  Radio,
  Tv,
  Eye,
  Zap,
  RotateCcw
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { calculateVedicKundali, calculateMoolank, calculateBhagyank } from '../utils/astrologyEngine';
import { addUserActivityLog } from '../utils/minutesManager';
import { generateClientFallbackChatReply } from '../utils/aiFallbackEngine';
import gurujiAvatarImg from '../assets/images/guruji_avatar_1785862223725.jpg';

interface AiAstrologerChatProps {
  userProfile: UserProfile;
  availableMinutes: number;
  onDeductMinute: () => boolean;
  onOpenRechargeModal: () => void;
  isConsultationActive: boolean;
  setIsConsultationActive: (active: boolean) => void;
}

interface CategorizedPreset {
  category: 'ex' | 'crush' | 'career' | 'timeline' | 'general';
  label: string;
  prompt: string;
}

const PRESET_CATEGORIES: { [key: string]: { label: string; icon: string } } = {
  all: { label: 'All Presets', icon: '✨' },
  ex: { label: 'Recent Ex Prediction', icon: '💔' },
  crush: { label: 'Crush Prediction', icon: '💘' },
  career: { label: 'Career & Growth', icon: '💼' },
  timeline: { label: 'Past, Present & Future', icon: '⏳' },
};

const FEATURED_PRESETS: CategorizedPreset[] = [
  {
    category: 'crush',
    label: '💖 Crush Manegi Ya Nahi? (%)',
    prompt: 'Kya meri crush mere proposal ko accept karegi? Humare Kundali Mulank, Bhagyank, aur 5th House Shukra Grah ke hisab se kitne percent (80%+, 90%+) chances hain ki vo HAA bolegi?'
  },
  {
    category: 'crush',
    label: '💘 Crush Feelings & Best Proposal Time',
    prompt: 'Kya mere crush ke dil me mere liye romantic feelings hain? Humare beech bonding, mutual attraction %, aur proposal ka sabse auspicious time (din aur samay) batayein.'
  },
  {
    category: 'ex',
    label: '💔 Recent Ex Return & Karmic Bond',
    prompt: 'Meri recent ex mere paas wapas aayegi ya nahi? Reconnection probability kitni percent hai, aur move on karne me mera fayda hai ya nahi?'
  },
  {
    category: 'ex',
    label: '💔 Ex Partner Feelings & Future',
    prompt: 'Kya meri ex abhi bhi mere baare me sochti hai? Kya aage humari baat ho sakti hai ya move on karna sahi rahega?'
  },
  {
    category: 'career',
    label: '💼 Job Promotion & Salary Hike (%)',
    prompt: 'Mujhe job me promotion aur salary hike milne ke kitne percent chances hain? 10th House aur Sun/Saturn transit ka detailed calculation batayein.'
  },
  {
    category: 'career',
    label: '💼 Best Career Field & Business Luck',
    prompt: 'Mere 10th House aur Sun/Saturn placements ke hisab se konsi career field (Job ya Business) mere liye sabse best aur lucrative rahegi?'
  },
  {
    category: 'timeline',
    label: '⏳ Full Timeline: Past, Present & Future',
    prompt: 'Meri Kundali ke hisab se mera Past (purve janm karm), Present (Abhi chal rahi Dasha), aur Future (Next 1 to 5 years) ka detailed breakdown batayein.'
  },
  {
    category: 'timeline',
    label: '⏳ Future 2026-2028 Golden Period',
    prompt: 'Aane wale 2026 se 2028 tak mera golden time kab aayega? Wealth, Relationship, aur Health ka future forecast batayein.'
  },
  {
    category: 'general',
    label: '💍 Shaadi & Life Partner Prediction',
    prompt: 'Meri shaadi kab hogi, love marriage hogi ya arrange, aur mera life partner kaisa aur kis direction se hoga?'
  },
  {
    category: 'general',
    label: '🛡️ Weak Grah & Powerful Vedic Upay',
    prompt: 'Meri Kundali me kaun sa Grah sabse kamzor hai, aur usko strong karne ke liye Mantra, Gemstone, ya Shanti Upay batayein.'
  }
];

const SACRED_MANTRAS = [
  'ॐ नमः शिवाय',
  'ॐ गं गणपतये नमः',
  'ॐ सूर्यदेवताय नमः',
  'ॐ श्रीं ह्रीं क्लीं श्रीं सिद्ध लक्ष्म्यै नमः'
];

export const AiAstrologerChat: React.FC<AiAstrologerChatProps> = ({
  userProfile,
  availableMinutes,
  onDeductMinute,
  onOpenRechargeModal,
  isConsultationActive,
  setIsConsultationActive
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'astrologer',
      text: `Pranam ${userProfile.name}! Main Guruji Jyotish hoon. Aapki Kundali (${userProfile.dob}, ${userProfile.pob}) mere samne hai. Aap career, marriage, health, ya kisi bhi Grah Dasha ke bare me pucch sakte hain.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [viewMode, setViewMode] = useState<'VIDEO' | 'CHAT'>('VIDEO');
  const [auraFilter, setAuraFilter] = useState<'saffron' | 'violet' | 'gold'>('saffron');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const filteredPresets = FEATURED_PRESETS.filter(
    (item) => activeCategoryFilter === 'all' || item.category === activeCategoryFilter
  );

  const kundali = calculateVedicKundali(userProfile.dob, userProfile.tob, userProfile.name);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, viewMode]);

  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.rate = 0.95;
    utterance.pitch = 0.9;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    const hasMinute = onDeductMinute();
    if (!hasMinute) return;

    setIsConsultationActive(true);

    addUserActivityLog(
      userProfile.id,
      userProfile.name,
      'Asked AI Astrologer',
      textToSend.trim()
    );

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInputPrompt('');
    setIsLoading(true);

    try {
      let replyText = '';
      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userPrompt: textToSend,
            kundaliContext: {
              name: userProfile.name,
              dob: userProfile.dob,
              tob: userProfile.tob,
              pob: userProfile.pob,
              rashi: kundali.moonRashi,
              lagna: kundali.lagnaRashi,
              moolank: calculateMoolank(userProfile.dob),
              bhagyank: calculateBhagyank(userProfile.dob)
            },
            chatHistory: messages.slice(-6)
          })
        });

        if (response.ok) {
          const data = await response.json();
          replyText = data.reply || '';
        }
      } catch (e) {
        console.warn('API route unreachable, switching to fail-safe client engine:', e);
      }

      if (!replyText) {
        replyText = generateClientFallbackChatReply(textToSend, {
          name: userProfile.name,
          dob: userProfile.dob,
          tob: userProfile.tob,
          pob: userProfile.pob,
          rashi: kundali.moonRashi,
          lagna: kundali.lagnaRashi,
          moolank: calculateMoolank(userProfile.dob),
          bhagyank: calculateBhagyank(userProfile.dob)
        });
      }

      const astroMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: 'astrologer',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, astroMsg]);
      speakText(replyText);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg = generateClientFallbackChatReply(textToSend, {
        name: userProfile.name,
        rashi: kundali.moonRashi,
        lagna: kundali.lagnaRashi
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `ast_${Date.now()}`,
          sender: 'astrologer',
          text: fallbackMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const lastAstrologerMsg = [...messages].reverse().find(m => m.sender === 'astrologer')?.text;

  const auraColorClass =
    auraFilter === 'saffron'
      ? 'from-amber-500 via-orange-600 to-rose-600'
      : auraFilter === 'violet'
      ? 'from-indigo-600 via-purple-600 to-pink-600'
      : 'from-amber-300 via-yellow-500 to-amber-600';

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px] bg-gradient-to-b from-indigo-950/60 via-slate-950/90 to-black backdrop-blur-2xl border border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 blur-[140px] pointer-events-none rounded-full"></div>

      {/* Top Header & Mode Toggle Bar */}
      <div className="p-3.5 bg-black/80 backdrop-blur-xl border-b border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          {/* Avatar Thumbnail */}
          <div className="relative w-11 h-11 shrink-0 rounded-full border-2 border-amber-400/60 overflow-hidden shadow-lg shadow-amber-500/20">
            <img
              src={gurujiAvatarImg}
              alt="Guruji AI"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-black rounded-full animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 font-serif flex items-center gap-1.5">
                <span>Guruji AI Video Astrologer</span>
                <span className="text-amber-400 text-xs">🕉️</span>
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> 3D AI Live
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/80 font-mono flex items-center gap-2">
              <span>{kundali.lagnaRashi} Lagna</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">{kundali.moonRashi} Moon</span>
            </p>
          </div>
        </div>

        {/* View Mode Switcher + Audio Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('VIDEO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'VIDEO'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>📹 3D Video Call</span>
            </button>
            <button
              onClick={() => setViewMode('CHAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'CHAT'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>💬 Text Chat</span>
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsMuted(!isMuted);
              window.speechSynthesis?.cancel();
            }}
            className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-400/30 text-gray-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer shadow-lg"
            title={isMuted ? 'Voice Muted' : 'Voice Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />}
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.03 }}
            onClick={onOpenRechargeModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer shadow-xl ${
              availableMinutes <= 2
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-indigo-900/80 border-indigo-400/40 text-indigo-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{availableMinutes}m Left</span>
          </motion.div>
        </div>
      </div>

      {/* Low Minutes Banner */}
      {availableMinutes <= 2 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-slate-900/90 border-b border-rose-500/40 px-4 py-1.5 flex items-center justify-between text-xs text-rose-200 z-20">
          <span className="flex items-center gap-2 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Consultation balance is low ({availableMinutes} Mins). Top up to continue video chat.</span>
          </span>
          <button
            onClick={onOpenRechargeModal}
            className="px-3 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
          >
            Recharge
          </button>
        </div>
      )}

      {/* MAIN CONTAINER SPLIT OR VIDEO VIEW */}
      <div className="flex-1 overflow-hidden relative flex flex-col z-10">
        {viewMode === 'VIDEO' ? (
          <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-black/80">
            {/* VIDEO STREAM CANVAS AREA */}
            <div className="relative flex-1 bg-gradient-to-b from-slate-950 via-indigo-950/90 to-black flex flex-col items-center justify-center p-4 min-h-[320px] overflow-hidden">
              {/* Outer 3D Celestial Rotating Orbit Ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
                className="absolute w-[360px] sm:w-[480px] h-[360px] sm:h-[480px] rounded-full border border-dashed border-amber-400/30 pointer-events-none"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs select-none opacity-60">☀️</div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-xs select-none opacity-60">🌙</div>
                <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs select-none opacity-60">🪐</div>
                <div className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-xs select-none opacity-60">✨</div>
              </motion.div>

              {/* Glowing Aura Background Pulse */}
              <motion.div
                animate={{
                  scale: (isLoading || isSpeaking) ? [1, 1.25, 1] : [1, 1.1, 1],
                  opacity: (isLoading || isSpeaking) ? [0.7, 1, 0.7] : [0.4, 0.7, 0.4]
                }}
                transition={{ duration: (isLoading || isSpeaking) ? 1.5 : 4, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute w-72 sm:w-96 h-72 sm:h-96 rounded-full bg-gradient-to-tr ${auraColorClass} blur-3xl pointer-events-none`}
              ></motion.div>

              {/* Floating Sacred Sanskrit Mantras Animation */}
              {SACRED_MANTRAS.map((mantra, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    y: [-10, 15, -10],
                    x: [idx % 2 === 0 ? -20 : 20, idx % 2 === 0 ? 20 : -20, idx % 2 === 0 ? -20 : 20],
                    opacity: [0.3, 0.8, 0.3]
                  }}
                  transition={{ duration: 6 + idx * 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute text-[11px] sm:text-xs font-serif text-amber-300/60 pointer-events-none filter drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                  style={{
                    top: `${15 + idx * 20}%`,
                    left: idx % 2 === 0 ? '10%' : '75%'
                  }}
                >
                  {mantra}
                </motion.div>
              ))}

              {/* LIVE STREAM OVERLAY BADGES */}
              <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/40 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>LIVE AI STREAM</span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-black/60 border border-amber-400/30 text-amber-300 text-[10px] font-mono backdrop-blur-md">
                  Aura: {auraFilter.toUpperCase()}
                </span>
              </div>

              {/* FILTER SWITCHER (TOP RIGHT) */}
              <div className="absolute top-3 right-3 flex items-center gap-1 z-20 bg-black/60 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setAuraFilter('saffron')}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold ${auraFilter === 'saffron' ? 'bg-amber-500 text-black' : 'text-gray-400'}`}
                  title="Saffron Divine Filter"
                >
                  🌅
                </button>
                <button
                  onClick={() => setAuraFilter('violet')}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold ${auraFilter === 'violet' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}
                  title="Cosmic Violet Filter"
                >
                  🌌
                </button>
                <button
                  onClick={() => setAuraFilter('gold')}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold ${auraFilter === 'gold' ? 'bg-amber-300 text-black' : 'text-gray-400'}`}
                  title="Golden Light Filter"
                >
                  👑
                </button>
              </div>

              {/* MAIN GURUJI VIDEO AVATAR FRAME */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  animate={{
                    y: [0, -6, 0],
                    scale: (isLoading || isSpeaking) ? [1, 1.03, 1] : [1, 1.01, 1]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-44 sm:w-56 h-44 sm:h-56 rounded-full p-1.5 bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-200 shadow-2xl shadow-amber-500/40 border-2 border-amber-300 overflow-hidden"
                >
                  <img
                    src={gurujiAvatarImg}
                    alt="Guruji Live AI Astrologer"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />

                  {/* Tilak Glowing Third Eye Light Pulse */}
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.9, 1.2, 0.9] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-[32%] left-[49%] -translate-x-1/2 w-3 h-3 rounded-full bg-amber-400 blur-xs shadow-[0_0_12px_#fbbf24]"
                  ></motion.div>
                </motion.div>

                {/* AUDIO EQUALIZER FREQUENCY BARS (ACTIVE WHEN GURUJI SPEAKS OR CALCULATES) */}
                <div className="mt-4 flex items-center justify-center gap-1.5 h-7">
                  {Array.from({ length: 14 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: (isLoading || isSpeaking)
                          ? [`${Math.floor(Math.random() * 8 + 4)}px`, `${Math.floor(Math.random() * 24 + 8)}px`, `${Math.floor(Math.random() * 8 + 4)}px`]
                          : ['4px', '8px', '4px']
                      }}
                      transition={{ duration: 0.4 + (i % 5) * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                      className={`w-1 rounded-full ${
                        (isLoading || isSpeaking)
                          ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-[0_0_6px_#f97316]'
                          : 'bg-indigo-500/40'
                      }`}
                    ></motion.div>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-amber-300/80 mt-1">
                  {isLoading ? '⚡ Guruji Aligning Graha Transits...' : isSpeaking ? '🔊 Guruji Speaking Real Predictions...' : '🧘 Ready for Your Question'}
                </span>
              </div>

              {/* SUBTITLE CAPTION OVERLAY AT BOTTOM OF VIDEO STREAM */}
              {lastAstrologerMsg && (
                <div className="w-full max-w-2xl mt-4 z-20">
                  <motion.div
                    key={lastAstrologerMsg.slice(0, 30)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 sm:p-4 rounded-2xl bg-black/85 backdrop-blur-xl border border-amber-400/40 text-amber-100 text-xs sm:text-sm text-center font-serif leading-relaxed shadow-2xl relative"
                  >
                    <span className="text-amber-400 font-bold block text-[10px] uppercase font-mono mb-1 tracking-wider">
                      💬 Guruji Live Prediction Subtitle
                    </span>
                    <p className="line-clamp-3">{lastAstrologerMsg}</p>
                    {isMuted && (
                      <button
                        onClick={() => speakText(lastAstrologerMsg)}
                        className="mt-2 text-[10px] px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 inline-flex items-center gap-1 hover:bg-amber-500/30 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3 text-amber-400" />
                        <span>Play Guruji Voice</span>
                      </button>
                    )}
                  </motion.div>
                </div>
              )}
            </div>

            {/* QUICK PRESET SELECTION DRAWER (ON RIGHT IN VIDEO MODE) */}
            <div className="w-full lg:w-80 bg-slate-950/90 border-t lg:border-t-0 lg:border-l border-indigo-500/20 p-4 flex flex-col justify-between space-y-3 z-10">
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 font-serif">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Real Instant Predictions</span>
                  </h4>
                  <span className="text-[9px] text-gray-400">Tap to Ask</span>
                </div>

                <div className="space-y-1.5 max-h-56 lg:max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                  {FEATURED_PRESETS.map((item, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.02, x: 2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSendMessage(item.prompt)}
                      disabled={isLoading}
                      className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-amber-500/10 border border-white/10 hover:border-amber-400/40 text-left text-xs text-gray-200 transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                    >
                      <span className="font-medium line-clamp-1">{item.label}</span>
                      <Sparkles className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Direct Input inside Video Drawer */}
              <div className="pt-2">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputPrompt}
                    onChange={(e) => setInputPrompt(e.target.value)}
                    placeholder="Ask Guruji in Hindi / English..."
                    className="flex-1 px-3 py-2 bg-black/60 border border-indigo-500/30 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !inputPrompt.trim()}
                    className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/30"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD TEXT CHAT VIEW */
          <div className="flex-1 flex flex-col h-full">
            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40 backdrop-blur-md scrollbar-thin">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-lg overflow-hidden ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white border border-purple-400/30'
                          : 'bg-black border border-amber-400/40'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        'You'
                      ) : (
                        <img src={gurujiAvatarImg} alt="Guruji" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      )}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl text-xs leading-relaxed shadow-xl backdrop-blur-xl relative ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-tr-none font-medium border border-indigo-400/30 shadow-indigo-600/20'
                          : 'bg-gradient-to-b from-indigo-950/80 via-slate-900/90 to-black/90 border border-amber-500/20 text-indigo-100 rounded-tl-none whitespace-pre-line shadow-black/60'
                      }`}
                    >
                      {msg.sender === 'astrologer' && (
                        <div className="absolute top-2 right-3 opacity-15 text-amber-400 font-serif text-lg pointer-events-none select-none">
                          🕉️
                        </div>
                      )}
                      <p className="relative z-10">{msg.text}</p>
                      <div
                        className={`text-[9px] mt-2 text-right font-mono flex items-center justify-end gap-1 ${
                          msg.sender === 'user' ? 'text-indigo-200/80' : 'text-amber-300/60'
                        }`}
                      >
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-2xl bg-black border border-amber-400/40 overflow-hidden shadow-lg">
                    <img src={gurujiAvatarImg} alt="Guruji" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-indigo-950/80 border border-indigo-500/30 text-xs text-indigo-200 flex items-center gap-2.5 shadow-xl">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-[11px] text-amber-200/90 font-serif ml-1">
                      Guruji reading your Grah Dasha & planetary transits...
                    </span>
                  </div>
                </motion.div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Preset Category Bar */}
            <div className="px-3 py-2 bg-black/60 border-t border-indigo-500/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
              {Object.entries(PRESET_CATEGORIES).map(([catKey, catInfo]) => (
                <button
                  key={catKey}
                  onClick={() => setActiveCategoryFilter(catKey)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCategoryFilter === catKey
                      ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-purple-600 text-white shadow-lg border border-amber-300/40'
                      : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.label}</span>
                </button>
              ))}
            </div>

            {/* Featured Presets Grid */}
            <div className="px-3 py-2.5 bg-slate-950/90 border-t border-indigo-500/20 max-h-32 overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPresets.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.prompt)}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-amber-400/40 text-left text-xs text-gray-200 transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                  >
                    <span className="font-medium truncate">{item.label}</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="p-3 bg-black/80 border-t border-indigo-500/20">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask Guruji about your job, marriage, love or dasha..."
                  className="flex-1 px-4 py-3 bg-black/60 border border-indigo-500/30 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-xs disabled:opacity-50 cursor-pointer shadow-lg shadow-orange-600/30 flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
