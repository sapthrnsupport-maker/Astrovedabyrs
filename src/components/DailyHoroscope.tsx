import React, { useState } from 'react';
import { Sun, Calendar, Clock, Sparkles, Compass, Shield, Award } from 'lucide-react';
import { ZODIAC_SIGNS, getTodayPanchang } from '../utils/astrologyEngine';

export const DailyHoroscope: React.FC = () => {
  const [selectedRashi, setSelectedRashi] = useState(ZODIAC_SIGNS[0]);
  const panchang = getTodayPanchang();

  const getRashifalContent = (rashiName: string) => {
    return {
      love: `Today favors open communication with your partner. Mutual trust will deepen under Jupiter's positive aspect.`,
      career: `Focus on completing pending tasks before starting new ventures. A senior's guidance will bring clarity.`,
      money: `Favorable day for financial planning. Avoid hasty impulsive investments during Rahu Kalam.`,
      health: `Maintain regular hydration and light meditation. Mental peace will keep your energy high.`
    };
  };

  const rashifal = getRashifalContent(selectedRashi.english);

  return (
    <div className="space-y-8">
      {/* Panchang Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              Vedic Panchang & Muhurat
            </span>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent mt-1">
              Today's Panchang ({panchang.date})
            </h1>
            <p className="text-xs text-gray-300">
              Moon Sign: <strong className="text-indigo-300">{panchang.moonSign}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 text-xs">
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-gray-400 block">Tithi</span>
            <span className="font-bold text-indigo-300">{panchang.tithi}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-gray-400 block">Nakshatra</span>
            <span className="font-bold text-indigo-300">{panchang.nakshatra}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-gray-400 block">Shubh Muhurat</span>
            <span className="font-bold text-emerald-400">{panchang.shubhMuhurat}</span>
          </div>
          <div className="p-3 rounded-2xl bg-black/30 border border-white/5">
            <span className="text-[10px] text-rose-400 block">Rahu Kalam</span>
            <span className="font-bold text-rose-300">{panchang.rahuKalam}</span>
          </div>
        </div>
      </div>

      {/* Rashi Selector Chips */}
      <div className="space-y-3">
        <h3 className="font-bold text-base text-white font-serif">Select Your Rashi (Zodiac Sign)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {ZODIAC_SIGNS.map((rashi) => {
            const isSelected = selectedRashi.english === rashi.english;
            return (
              <button
                key={rashi.english}
                onClick={() => setSelectedRashi(rashi)}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-lg'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="font-bold text-xs">{rashi.english}</div>
                <div className="text-[10px] text-indigo-200 mt-0.5">{rashi.hindi}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rashifal Prediction Cards */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-lg font-serif text-white">
              Daily Rashifal: {selectedRashi.english} ({selectedRashi.hindi})
            </h3>
            <p className="text-xs text-gray-400">
              Ruling Lord: <strong className="text-indigo-300">{selectedRashi.lord}</strong> • Element:{' '}
              {selectedRashi.element}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-rose-400 block">❤️ Love & Marriage</span>
            <p className="text-gray-300 leading-relaxed">{rashifal.love}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-indigo-400 block">💼 Career & Business</span>
            <p className="text-gray-300 leading-relaxed">{rashifal.career}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-amber-400 block">💰 Wealth & Finance</span>
            <p className="text-gray-300 leading-relaxed">{rashifal.money}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-emerald-400 block">🌿 Health & Well-being</span>
            <p className="text-gray-300 leading-relaxed">{rashifal.health}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
