import React from 'react';
import { motion } from 'motion/react';
import { Video, Sparkles, MessageSquare, Flame, Volume2, ArrowRight, Star, Clock } from 'lucide-react';
import gurujiHeroImg from '../assets/images/guruji_hero_banner_1785862546834.jpg';
import gurujiAvatarImg from '../assets/images/guruji_avatar_1785862223725.jpg';

interface GurujiFrontShowcaseProps {
  onStartChat: (prompt?: string) => void;
  availableMinutes: number;
  onOpenRechargeModal: () => void;
}

export const GurujiFrontShowcase: React.FC<GurujiFrontShowcaseProps> = ({
  onStartChat,
  availableMinutes,
  onOpenRechargeModal
}) => {
  return (
    <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950/90 to-purple-950/90 border border-amber-500/30 p-6 md:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-purple-600/15 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* LEFT COLUMN: GURUJI ANIMATED 3D VIDEO CALL PREVIEW CARD */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-full max-w-[340px] aspect-[4/5] rounded-3xl overflow-hidden border-2 border-amber-400/50 shadow-2xl shadow-amber-500/20 bg-black group">
            {/* Background Guruji Image */}
            <img
              src={gurujiHeroImg}
              alt="Guruji AI Live Astrologer"
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />

            {/* Glowing Aura Overlay */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-amber-500/10 pointer-events-none"
            ></motion.div>

            {/* LIVE STREAM BADGES OVERLAY */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
              <span className="px-3 py-1 rounded-full bg-rose-600/90 text-white text-[10px] font-extrabold flex items-center gap-1.5 shadow-lg shadow-rose-600/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                <span>3D GURUJI VIDEO LIVE</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400" /> AI Vedic Guru
              </span>
            </div>

            {/* AUDIO EQUALIZER BARS AT BOTTOM OF PREVIEW CARD */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xl border border-amber-400/30 p-3 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full border border-amber-400/60 overflow-hidden shrink-0">
                  <img src={gurujiAvatarImg} alt="Guruji Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-300 font-serif">Guruji Jyotish</h4>
                  <div className="flex items-center gap-1 h-3 mt-0.5">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['3px', '12px', '3px'] }}
                        transition={{ duration: 0.3 + (i % 4) * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-0.5 bg-amber-400 rounded-full"
                      ></motion.div>
                    ))}
                    <span className="text-[9px] text-emerald-300 font-mono ml-1">Live Voice</span>
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStartChat()}
                className="p-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg cursor-pointer"
                title="Open Live Consultation"
              >
                <Video className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HERO DETAILS & ONE-CLICK INTENT BUTTONS */}
        <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
              <span>Real Vedic Predictions • 3D Video Call</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-200 to-amber-400">
              Chat Live with Guruji AI (Video & Voice)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed max-w-xl">
              Get instant 100% real Vedic predictions about your Ex, Crush feelings %, Job promotion, Marriage timing & Mahadasha directly from AI Guruji in video streaming mode.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block font-serif">
              🔥 Popular Instant AI Predictions:
            </span>
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
              <button
                onClick={() => onStartChat('Kya meri crush mere proposal ko accept karegi? Humare Kundali Moolank & 5th house Shukra ke hisab se kitne % chances hain?')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-xs text-amber-100 font-medium cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <span>💘 Crush Proposal Chances (%)</span>
              </button>
              <button
                onClick={() => onStartChat('Meri recent ex mere paas wapas aayegi ya nahi? Reconnection probability kitni percent hai?')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-xs text-amber-100 font-medium cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <span>💔 Ex Partner Return Yog</span>
              </button>
              <button
                onClick={() => onStartChat('Mujhe job me promotion aur salary hike kab milegi? 10th House Sun/Saturn transit ka calculation batayein.')}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-400/40 text-xs text-amber-100 font-medium cursor-pointer transition-all hover:scale-105 flex items-center gap-1.5"
              >
                <span>💼 Job Promotion & Salary Hike</span>
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onStartChat()}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 hover:brightness-110 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Video className="w-4 h-4 text-white" />
              <span>Start 3D Video Call with Guruji</span>
              <ArrowRight className="w-4 h-4 text-white ml-1" />
            </motion.button>

            {availableMinutes <= 0 && (
              <button
                onClick={onOpenRechargeModal}
                className="px-4 py-3.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Recharge Minutes ({availableMinutes} Mins)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
