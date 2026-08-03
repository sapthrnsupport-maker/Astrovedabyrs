import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle
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
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[700px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative">
      {/* Chat Header */}
      <div className="p-4 bg-black/40 backdrop-blur-md border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 p-0.5 shadow-md shadow-indigo-500/30">
            <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center text-indigo-300 font-bold text-sm">
              <Bot className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-black"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white font-serif">Guruji AI Astrologer</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Online
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Vedic Jyotish • Chart ({kundali.lagnaRashi} Lagna, {kundali.moonRashi} Moon)
            </p>
          </div>
        </div>

        {/* Minutes & Voice Bar */}
        <div className="flex items-center gap-2">
          {/* Mute/Unmute Audio Voice */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              window.speechSynthesis?.cancel();
            }}
            className="p-2 rounded-xl bg-black/30 border border-white/10 text-gray-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
            title={isMuted ? 'Voice Audio Muted' : 'Voice Audio Active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Consultation Minute Counter */}
          <div
            onClick={onOpenRechargeModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
              availableMinutes <= 2
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
                : 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200 hover:bg-indigo-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-300" />
            <span>{availableMinutes} Mins Left</span>
          </div>
        </div>
      </div>

      {/* Low Minutes Alert Banner */}
      {availableMinutes <= 2 && (
        <div className="bg-rose-500/20 backdrop-blur-md border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Your consultation balance is low ({availableMinutes} Mins). Top up to avoid interruption.</span>
          </span>
          <button
            onClick={onOpenRechargeModal}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[11px] shadow-md hover:brightness-110"
          >
            Recharge
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-black/20 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-black/60 border border-white/20 text-indigo-300'
              }`}
            >
              {msg.sender === 'user' ? 'You' : 'G'}
            </div>

            <div
              className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none font-medium'
                  : 'bg-black/40 border border-white/10 text-gray-200 rounded-tl-none whitespace-pre-line'
              }`}
            >
              <p>{msg.text}</p>
              <div
                className={`text-[9px] mt-1 text-right font-mono ${
                  msg.sender === 'user' ? 'text-indigo-200/80' : 'text-gray-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-indigo-300 text-xs font-bold">
              G
            </div>
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-xs text-indigo-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-[11px] text-gray-400 font-mono ml-1">Guruji reading planetary transits...</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Preset Category Switcher Bar */}
      <div className="px-3 py-1.5 bg-black/40 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        {Object.entries(PRESET_CATEGORIES).map(([catKey, catInfo]) => (
          <button
            key={catKey}
            onClick={() => setActiveCategoryFilter(catKey)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
              activeCategoryFilter === catKey
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>{catInfo.icon}</span>
            <span>{catInfo.label}</span>
          </button>
        ))}
      </div>

      {/* Preset Quick Question Chips */}
      <div className="px-3 py-2 bg-black/30 border-t border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none text-[11px]">
        {filteredPresets.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(item.prompt)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-indigo-200 hover:text-white hover:border-indigo-400/50 hover:bg-white/10 whitespace-nowrap transition-all cursor-pointer shadow-sm text-left flex items-center gap-1.5"
          >
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Message Input Box */}
      <div className="p-3 bg-black/40 border-t border-white/10">
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
            className="flex-1 px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
