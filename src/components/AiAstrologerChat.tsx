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
  Star
} from 'lucide-react';
import { UserProfile, ChatMessage } from '../types';
import { calculateVedicKundali, calculateMoolank, calculateBhagyank } from '../utils/astrologyEngine';
import { addUserActivityLog } from '../utils/minutesManager';
import { generateClientFallbackChatReply } from '../utils/aiFallbackEngine';

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
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const filteredPresets = FEATURED_PRESETS.filter(
    (item) => activeCategoryFilter === 'all' || item.category === activeCategoryFilter
  );

  // Calculate Kundali context for chatbot
  const kundali = calculateVedicKundali(userProfile.dob, userProfile.tob, userProfile.name);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Speech Synthesis
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.rate = 0.95;
    utterance.pitch = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    if (availableMinutes <= 0) {
      onOpenRechargeModal();
      return;
    }

    // Deduct 1 consultation minute per query
    const hasMinute = onDeductMinute();
    if (!hasMinute) return;

    // Start active session status
    setIsConsultationActive(true);

    // Log user question for Admin inspection
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[750px] bg-gradient-to-b from-indigo-950/40 via-slate-950/80 to-black/90 backdrop-blur-2xl border border-indigo-500/20 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Ambient background glow & stars */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-600/10 blur-[120px] pointer-events-none rounded-full"></div>

      {/* 3D Indian Culture Guru Chat Header */}
      <div className="p-4 bg-black/60 backdrop-blur-xl border-b border-indigo-500/20 flex flex-col md:flex-row items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3.5">
          {/* 3D Animated Guru Avatar Container */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            {/* Outer 3D Rotating Zodiac Ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-dashed border-amber-400/50 p-1"
            >
              <div className="w-full h-full rounded-full border border-indigo-400/30"></div>
            </motion.div>

            {/* Glowing Divine Aura Pulse */}
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-1.5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-600 to-purple-600 blur-sm opacity-70"
            ></motion.div>

            {/* Core 3D Guruji Icon Shield */}
            <div className="relative w-11 h-11 rounded-full bg-gradient-to-b from-slate-900 via-indigo-950 to-black p-0.5 shadow-xl shadow-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <span className="text-xl select-none filter drop-shadow-[0_2px_4px_rgba(251,191,36,0.6)]">🧘‍♂️</span>
              <span className="absolute -top-1 -right-1 text-[10px] select-none">✨</span>
            </div>

            {/* Online Live Indicator */}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black shadow-lg shadow-emerald-500/50 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-amber-400 font-serif flex items-center gap-1.5">
                <span>Guruji AI Astrologer</span>
                <span className="text-amber-400 text-xs">🕉️</span>
              </h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 animate-bounce" /> 3D Vedic AI
              </span>
            </div>
            <p className="text-[11px] text-indigo-200/80 font-mono mt-0.5 flex items-center gap-2">
              <span>Parashari Jyotish</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">Chart Sync ({kundali.lagnaRashi} Lagna, {kundali.moonRashi} Moon)</span>
            </p>
          </div>
        </div>

        {/* Minutes & Voice Bar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Mute/Unmute Audio Voice */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsMuted(!isMuted);
              window.speechSynthesis?.cancel();
            }}
            className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-400/30 text-gray-300 hover:text-white transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-950/50"
            title={isMuted ? 'Voice Audio Muted' : 'Voice Audio Active'}
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span className="text-[10px] text-rose-300 font-semibold hidden sm:inline">Muted</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-emerald-300 font-semibold hidden sm:inline">Voice Active</span>
              </>
            )}
          </motion.button>

          {/* Consultation Minute Counter */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onOpenRechargeModal}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer shadow-xl transition-all ${
              availableMinutes <= 2
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border-indigo-400/40 text-indigo-200 hover:border-amber-400/60'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{availableMinutes} Mins Remaining</span>
          </motion.div>
        </div>
      </div>

      {/* Low Minutes Alert Banner */}
      {availableMinutes <= 2 && (
        <div className="bg-gradient-to-r from-rose-950/90 via-amber-950/80 to-slate-900/90 border-b border-rose-500/40 px-4 py-2 flex items-center justify-between text-xs text-rose-200 z-10">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Your consultation balance is low ({availableMinutes} Mins). Top up to avoid interruption.</span>
          </span>
          <button
            onClick={onOpenRechargeModal}
            className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-rose-600 text-white font-bold text-[11px] shadow-lg shadow-rose-600/30 hover:brightness-110 cursor-pointer"
          >
            Recharge
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/40 backdrop-blur-md scrollbar-thin z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold shadow-lg ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white border border-purple-400/30'
                    : 'bg-gradient-to-b from-slate-900 to-indigo-950 border border-amber-400/40 text-amber-300 shadow-amber-500/20'
                }`}
              >
                {msg.sender === 'user' ? 'You' : <span className="text-sm select-none">🧘‍♂️</span>}
              </div>

              {/* Message Bubble */}
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
            <div className="w-9 h-9 rounded-2xl bg-slate-900 border border-amber-400/40 flex items-center justify-center text-amber-300 text-sm font-bold shadow-lg">
              🧘‍♂️
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

      {/* Preset Category Switcher Bar */}
      <div className="px-3 py-2 bg-black/60 border-t border-indigo-500/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs z-10">
        {Object.entries(PRESET_CATEGORIES).map(([catKey, catInfo]) => (
          <motion.button
            key={catKey}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveCategoryFilter(catKey)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategoryFilter === catKey
                ? 'bg-gradient-to-r from-amber-500 via-orange-600 to-purple-600 text-white shadow-lg shadow-orange-600/30 border border-amber-300/40'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/5'
            }`}
          >
            <span>{catInfo.icon}</span>
            <span>{catInfo.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Preset Quick Question Chips */}
      <div className="px-3 py-2 bg-black/40 border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px] z-10">
        {filteredPresets.map((item, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-indigo-950/50 border border-indigo-500/20 text-indigo-200 hover:text-white hover:border-amber-400/50 hover:bg-indigo-900/60 whitespace-nowrap transition-all cursor-pointer shadow-md text-left flex items-center gap-1.5 shrink-0"
          >
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-3.5 bg-black/70 border-t border-indigo-500/20 z-10">
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
            placeholder="Poochhein (Ask Guruji about marriage, career, Kundali remedies...)"
            className="flex-1 px-4 py-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs text-white placeholder-indigo-300/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
            disabled={isLoading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-purple-600 text-white font-bold hover:brightness-110 disabled:opacity-40 transition-all cursor-pointer shadow-xl shadow-orange-600/30 shrink-0"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
