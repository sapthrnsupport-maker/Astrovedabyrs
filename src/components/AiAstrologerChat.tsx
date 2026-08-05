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
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const filteredPresets = FEATURED_PRESETS.filter(
    (item) => activeCategoryFilter === 'all' || item.category === activeCategoryFilter
  );

  const kundali = calculateVedicKundali(userProfile.dob, userProfile.tob, userProfile.name);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-h-[800px] bg-gradient-to-b from-indigo-950/60 via-slate-950/90 to-black backdrop-blur-2xl border border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-48 bg-amber-500/10 blur-[120px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600/10 blur-[140px] pointer-events-none rounded-full"></div>

      {/* Top Header Bar */}
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
                <span>Guruji AI Astrologer</span>
                <span className="text-amber-400 text-xs">🕉️</span>
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> Live Guidance
              </span>
            </div>
            <p className="text-[10px] text-indigo-200/80 font-mono flex items-center gap-2">
              <span>{kundali.lagnaRashi} Lagna</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">{kundali.moonRashi} Moon</span>
            </p>
          </div>
        </div>

        {/* Audio Controls & Minutes Badge */}
        <div className="flex items-center gap-2">
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
            <span className="text-[10px] font-medium hidden sm:inline">{isMuted ? 'Muted' : 'Voice On'}</span>
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
            <span>Consultation balance is low ({availableMinutes} Mins). Top up to continue consultation.</span>
          </span>
          <button
            onClick={onOpenRechargeModal}
            className="px-3 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px] cursor-pointer"
          >
            Recharge
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-1 overflow-hidden relative flex flex-col z-10">
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

          {/* Collapsible Suggested Questions Bar Toggle */}
          <div className="px-3 py-1.5 bg-black/80 border-t border-indigo-500/20 flex items-center justify-between text-xs shrink-0 z-20">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300 hover:text-amber-200 cursor-pointer px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{showPresets ? 'Hide Suggested Questions' : '💡 Show Suggested Questions (Fast Ask)'}</span>
              <span className="text-[9px] bg-amber-500/20 px-1.5 py-0.5 rounded-full font-bold ml-1">
                {showPresets ? '▲' : '▼'}
              </span>
            </button>
            <span className="text-[10px] text-indigo-300/60 hidden sm:inline">
              Ask any custom astrological question below
            </span>
          </div>

          {/* Preset Category Bar & Featured Presets (Collapsible) */}
          <AnimatePresence>
            {showPresets && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-950/95 border-t border-indigo-500/20 z-20 overflow-hidden shrink-0"
              >
                {/* Category Filter Pills */}
                <div className="px-3 py-2 bg-black/60 border-b border-indigo-500/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
                  {Object.entries(PRESET_CATEGORIES).map(([catKey, catInfo]) => (
                    <button
                      key={catKey}
                      onClick={() => setActiveCategoryFilter(catKey)}
                      className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
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

                {/* Preset List Grid */}
                <div className="px-3 py-2.5 max-h-36 overflow-y-auto scrollbar-thin">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {filteredPresets.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setShowPresets(false);
                          handleSendMessage(item.prompt);
                        }}
                        disabled={isLoading}
                        className="p-2 rounded-xl bg-white/5 hover:bg-indigo-500/10 border border-white/10 hover:border-amber-400/40 text-left text-xs text-gray-200 transition-all cursor-pointer flex items-center justify-between group disabled:opacity-50"
                      >
                        <span className="font-medium truncate">{item.label}</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-60 group-hover:opacity-100 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Input Bar */}
          <div className="p-3 bg-black/80 border-t border-indigo-500/20 shrink-0 z-20">
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
      </div>
    </div>
  );
};
