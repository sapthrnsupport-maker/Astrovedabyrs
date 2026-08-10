import React, { useState } from 'react';
import { Sun, Calendar, Clock, Sparkles, Compass, Shield, Award, RefreshCw } from 'lucide-react';
import { ZODIAC_SIGNS, getTodayPanchang } from '../utils/astrologyEngine';

interface DailyHoroscopeProps {
  availableMinutes?: number;
  onDeductMinute?: () => boolean;
  onOpenRechargeModal?: () => void;
}

// Day of week planetary influences
const DAY_PLANETS = [
  { day: 'Sunday (Ravivar)', lord: 'Surya Dev (Sun)', color: 'Sun Gold & Crimson', number: 1, element: 'Solar Vitality & Executive Command' },
  { day: 'Monday (Somvar)', lord: 'Chandra Dev (Moon)', color: 'Pearl White & Silver', number: 2, element: 'Lunar Intuition & Mental Composure' },
  { day: 'Tuesday (Mangalvar)', lord: 'Mangal Dev (Mars)', color: 'Saffron & Ruby Red', number: 9, element: 'Martial Courage & Strategic Momentum' },
  { day: 'Wednesday (Budhvar)', lord: 'Budh Dev (Mercury)', color: 'Emerald Green & Jade', number: 5, element: 'Mercurial Wit & Business Intelligence' },
  { day: 'Thursday (Guruvar)', lord: 'Brihaspati Dev (Jupiter)', color: 'Golden Yellow & Honey', number: 3, element: 'Jupiterian Wisdom & Divine Grace' },
  { day: 'Friday (Shukravar)', lord: 'Shukra Dev (Venus)', color: 'Rose Pink & Pearl White', number: 6, element: 'Venutian Harmony & Romantic Warmth' },
  { day: 'Saturday (Shanivar)', lord: 'Shani Dev (Saturn)', color: 'Royal Navy & Deep Blue', number: 8, element: 'Saturnian Discipline & Financial Endurance' }
];

// Helper to generate dynamic date-specific prediction for any Rashi and Date
function getDynamicDailyPrediction(rashiIndex: number, rashi: typeof ZODIAC_SIGNS[0], dateObj: Date) {
  const dateStr = dateObj.toISOString().split('T')[0];
  const dayOfWeek = dateObj.getDay(); // 0 to 6
  const dayPlanetary = DAY_PLANETS[dayOfWeek];
  
  // Date hashing seed for daily deterministic variation
  const dayNum = dateObj.getDate();
  const monthNum = dateObj.getMonth() + 1;
  const yearNum = dateObj.getFullYear();
  const seed = (yearNum * 1000) + (monthNum * 31) + dayNum + (rashiIndex * 17);

  // Dynamic Love Variations per Rashi and Day
  const loveVariations = [
    `With ${dayPlanetary.lord} influencing today's transits, romantic communication with your partner flows effortlessly. Open conversation strengthens mutual trust.`,
    `A calm, harmonious day for relationships. Expressing genuine appreciation for your partner brings unexpected sweetness in the evening.`,
    `An invigorating day for romance! Single ${rashi.english} natives may attract someone inspiring during social or professional interactions.`,
    `Jupiter's supportive aspect brings emotional stability. Avoid minor debates over trivial matters during late afternoon hours.`,
    `Soulful emotional bonding is indicated. Spending quiet, quality time with your loved one will recharge your heart space.`
  ];

  // Dynamic Career Variations
  const careerVariations = [
    `Your ruling planet ${rashi.lord} aligns with ${dayPlanetary.lord}. Taking bold ownership of key tasks between 10:00 AM and 2:00 PM brings high management applause.`,
    `Focus on completing long-pending assignments before launching new projects. A senior colleague's strategic advice provides valuable clarity.`,
    `Exceptional focus in technical, strategic, and creative assignments. Your analytical precision helps overcome a complex operational bottleneck.`,
    `High leadership momentum! Pitching fresh proposals today yields positive feedback. Maintain steady teamwork and clear deadlines.`,
    `A productive corporate day. Networking with industry peers or clients opens up lucrative long-term career avenues.`
  ];

  // Dynamic Money Variations
  const moneyVariations = [
    `Positive financial inflow through pending payments or project completion. Exercise prudence and avoid speculative bets during Rahu Kalam.`,
    `Favorable day for long-term wealth planning, fixed deposits, or index investments. Family savings show encouraging growth.`,
    `Multiple small financial opportunities arise. Review contract terms carefully before finalizing major financial signatures.`,
    `Balanced financial day. Income matches planned expenses. Budgeting for upcoming family commitments brings peace of mind.`,
    `Unexpected financial gain or commission payout from past efforts. Spending on health or educational tools proves rewarding.`
  ];

  // Dynamic Health Variations
  const healthVariations = [
    `Stamina is high under ${dayPlanetary.element}. Stay well-hydrated and incorporate 10 minutes of morning Pranayama for mental poise.`,
    `Mild physical fatigue in the evening. Unwind with light stretches, warm herbal tea, and a restful sleep schedule.`,
    `Digestive health needs mindful care. Prefer clean, home-cooked meals and avoid heavy street food during peak work hours.`,
    `High mental clarity and vitality! Channel extra physical energy into morning walks, swimming, or yoga exercises.`,
    `Good physical endurance. Guard against eye strain or neck stiffness by taking periodic short breaks from screen time.`
  ];

  // Dynamic Remedies
  const remedies = [
    `Recite "Om Namah Shivaya" 21 times in the morning and offer fresh water to Surya Dev.`,
    `Chant "Om Gurave Namah" or apply yellow sandalwood tilak on your forehead before important tasks.`,
    `Recite Hanuman Chalisa or chant "Om Angarakaya Namah" for courage and clarity.`,
    `Feed green fodder to cows or birds and chant "Om Budhaya Namah" 11 times.`,
    `Donate white sweets or milk to the needy and chant "Om Shukraya Namah" for peace.`,
    `Light a mustard oil lamp in the evening and chant "Om Sham Shanayscharaya Namah".`
  ];

  const loveText = loveVariations[seed % loveVariations.length];
  const careerText = careerVariations[(seed + 1) % careerVariations.length];
  const moneyText = moneyVariations[(seed + 2) % moneyVariations.length];
  const healthText = healthVariations[(seed + 3) % healthVariations.length];
  const remedyText = remedies[(seed + (rashiIndex * 2)) % remedies.length];

  const luckyNumber = ((seed + rashiIndex) % 9) + 1;
  const luckyColor = dayPlanetary.color;
  const luckyHours = `${((seed % 4) + 9)}:00 AM - ${((seed % 3) + 2)}:30 PM`;

  return {
    dateStr,
    dayName: dayPlanetary.day,
    rashiName: rashi.english,
    rashiHindi: rashi.hindi,
    lord: rashi.lord,
    element: rashi.element,
    highlight: `Today's ${dayPlanetary.day} transit under ${dayPlanetary.lord} activates ${dayPlanetary.element} for ${rashi.english} (${rashi.hindi}).`,
    love: loveText,
    career: careerText,
    money: moneyText,
    health: healthText,
    luckyColor,
    luckyNumber,
    luckyHours,
    remedy: remedyText
  };
}

export const DailyHoroscope: React.FC<DailyHoroscopeProps> = ({
  availableMinutes = 0,
  onDeductMinute,
  onOpenRechargeModal
}) => {
  const [selectedRashi, setSelectedRashi] = useState(ZODIAC_SIGNS[0]);
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0); // 0 = Today, -1 = Yesterday, 1 = Tomorrow
  const [aiReading, setAiReading] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Compute selected date object
  const currentDate = new Date();
  currentDate.setDate(currentDate.getDate() + selectedDateOffset);
  const dateString = currentDate.toISOString().split('T')[0];

  const panchang = getTodayPanchang();
  const selectedRashiIndex = ZODIAC_SIGNS.findIndex(z => z.english === selectedRashi.english);
  const currentDetails = getDynamicDailyPrediction(selectedRashiIndex >= 0 ? selectedRashiIndex : 0, selectedRashi, currentDate);

  // Comprehensive, authentic 12-Rashi Vedic predictions dataset
  const RASHIFAL_DATA: Record<string, { love: string; career: string; money: string; health: string; luckyColor: string; luckyNumber: number; remedy: string; highlight: string }> = {
    'Aries': {
      love: 'Mars in your 5th house infuses romantic interactions with high energy and passion. Single Arians may attract a dynamic person during social events. Avoid impulsive arguments in the evening.',
      career: 'High initiative day! Mars gives you leadership momentum. Taking ownership of a stalled project will earn management praise. Peak focus time: 10:00 AM to 1:30 PM.',
      money: 'Financial inflow through pending invoices or freelance projects is indicated. Avoid speculative stock trading during Rahu Kalam.',
      health: 'High physical stamina, but manage internal body heat (Pitta). Stay hydrated with coconut water and practice 10 minutes of Pranayama.',
      luckyColor: 'Crimson Red & Saffron',
      luckyNumber: 9,
      remedy: 'Recite Hanuman Chalisa or chant "Om Angarakaya Namah" 11 times in the morning.',
      highlight: 'Mars transit favors bold professional decisions and leadership initiatives.'
    },
    'Taurus': {
      love: 'Venus in 7th house brings deep harmony, romantic warmth, and mutual trust. Expressing heartfelt feelings directly will solidify marital & relationship commitment.',
      career: 'Steady progress in corporate, creative, and financial domains. A senior executive will applaud your aesthetic sense and organized methodology.',
      money: 'Auspicious day for long-term investments in gold, real estate, or high-grade funds. Unexpected gain from family or past savings.',
      health: 'Mild throat or vocal cord sensitivity. Drink warm herbal tea with honey and avoid icy drinks.',
      luckyColor: 'Pearl White & Emerald Green',
      luckyNumber: 6,
      remedy: 'Offer white sweets or milk to Goddess Lakshmi and chant "Om Shukraya Namah".',
      highlight: 'Venus aspect grants financial stability and marital sweetness.'
    },
    'Gemini': {
      love: 'Mercury accentuates your charm, wit, and conversational brilliance. Great day for deep heart-to-heart talks or planning a weekend getaway.',
      career: 'Exceptional results in marketing, IT, media, writing, and client sales. Pitching fresh ideas between 11:00 AM and 3:00 PM brings high conversion.',
      money: 'Multiple small financial gains or commission payouts. Review contract details carefully before signing agreements.',
      health: 'Mental overthinking might cause restless sleep. Unwind with calming music or warm chamomile tea before bed.',
      luckyColor: 'Parrot Green & Sky Blue',
      luckyNumber: 5,
      remedy: 'Feed green fodder or spinach to cows and chant "Om Budhaya Namah" 21 times.',
      highlight: 'Mercury in 3rd house boosts communication and business networking.'
    },
    'Cancer': {
      love: 'Moon in your ascendant house heightens emotional warmth and nurturing care. Your partner will feel deeply secure and cherished in your presence.',
      career: 'Intuitive creative power is at its peak. HR, healthcare, hospitality, and design professionals achieve major milestones today.',
      money: 'Favorable day for systematic wealth building and mutual fund SIPs. Family-related retail expenses might arise in late afternoon.',
      health: 'Pay attention to digestive comfort. Prefer fresh home-cooked meals over heavy street food.',
      luckyColor: 'Moonstone White & Cream',
      luckyNumber: 2,
      remedy: 'Offer water or milk on a Shivling and chant "Om Namah Shivaya" for emotional peace.',
      highlight: 'Lagna Moon alignment gives high creative intuition and emotional strength.'
    },
    'Leo': {
      love: 'Sun in 10th house amplifies your magnetic royal charisma. Singles attract admiring glances; married couples celebrate proud shared successes.',
      career: 'Promotion prospects, government clearances, and executive decisions look highly favorable. Step up and command high-impact projects.',
      money: 'Strong financial authority. Business expansion yields high returns. Keep ego aside during salary or client negotiations.',
      health: 'Radiant vitality and physical posture energy. Avoid excessive sun exposure during peak noon hours.',
      luckyColor: 'Sun Gold & Bright Orange',
      luckyNumber: 1,
      remedy: 'Offer Arghya (water) to Surya Dev in a copper vessel with red sandalwood paste.',
      highlight: 'Solar transit in Digbala (10th house) brings career prestige and fame.'
    },
    'Virgo': {
      love: 'Mercury brings analytical clarity to relationship issues. Honest, gentle communication resolves old misunderstandings effortlessly.',
      career: 'Meticulous data auditing, accounting, coding, and technical problem-solving will earn high praise from leadership.',
      money: 'Wise budgeting pays off. Previous prudent investments produce steady returns. A good day for clear debt repayment.',
      health: 'Mild nerve fatigue or lower back stiffness. Perform gentle spinal stretches and maintain ergonomic seating.',
      luckyColor: 'Olive Green & Pastel Yellow',
      luckyNumber: 5,
      remedy: 'Keep a small Tulsi plant at home, water it daily, and chant "Om Namo Bhagavate Vasudevaya".',
      highlight: 'Mercury strength ensures flawless execution and strategic precision.'
    },
    'Libra': {
      love: 'Venus in 5th house favors romantic dates, artistic gift exchanges, and memorable surprises. Married couples experience renewed romance.',
      career: 'Partnership deals, design, public relations, and law flourish. Your diplomatic approach will resolve a tense workplace conflict.',
      money: 'Equilibrium between income and expenses. Excellent time to invest in art, luxury, or long-term index funds.',
      health: 'Keep kidney and hydration levels optimal. Drink plenty of fresh water throughout the afternoon.',
      luckyColor: 'Rose Pink & Turquoise',
      luckyNumber: 6,
      remedy: 'Donate white clothing or food to the needy on Fridays and chant "Om Shukraya Namah".',
      highlight: 'Venus in trine (5th house) brings artistic success and romantic joy.'
    },
    'Scorpio': {
      love: 'Deep, soul-level emotional bonding. Secret crushes may reveal mutual feelings. Avoid unnecessary possessiveness or suspicion.',
      career: 'Research, engineering, analytics, and deep problem-solving yield breakthrough discoveries. Your sharp intuition exposes hidden risks.',
      money: 'Sudden financial gains or bonus through back-end projects. Keep financial plans confidential until executed.',
      health: 'High endurance, but channel intense energy into physical exercise, swimming, or martial arts to avoid stress.',
      luckyColor: 'Deep Maroon & Charcoal',
      luckyNumber: 9,
      remedy: 'Recite Hanuman Chalisa in the evening with a desi ghee diya.',
      highlight: 'Scorpio intensity unlocks hidden financial and research opportunities.'
    },
    'Sagittarius': {
      love: 'Jupiter in 9th house spreads optimistic, adventurous warmth. Planning a travel trip together will bring immense happiness.',
      career: 'Mentorship, higher education, legal affairs, and publishing prosper. Guidance from a senior mentor opens lucrative career avenues.',
      money: 'Auspicious financial flow. Expected returns from international or inter-state business ventures.',
      health: 'Thigh or hip muscle tightness. Morning sunlight walks will boost flexibility and mood.',
      luckyColor: 'Saffron & Royal Purple',
      luckyNumber: 3,
      remedy: 'Apply yellow sandalwood tilak on forehead and chant "Om Gurave Namah".',
      highlight: 'Jupiter in 9th house (Dharma Sthan) brings divine grace and expansion.'
    },
    'Capricorn': {
      love: 'Saturn brings mature, committed, and stable relationship energy. Gestures focused on responsibility and long-term security build trust.',
      career: 'Relentless discipline yields long-overdue recognition. Corporate management, construction, or real estate projects reach major milestones.',
      money: 'Solid wealth accumulation. Ideal day for fixed deposits, property documentation, or long-term retirement planning.',
      health: 'Knee joint or bone care required. Avoid cold drafts and consume calcium-rich nutrition.',
      luckyColor: 'Navy Blue & Steel Gray',
      luckyNumber: 8,
      remedy: 'Light a mustard oil lamp under a Peepal tree in the evening and chant "Om Sham Shanayscharaya Namah".',
      highlight: 'Saturn in own sign grants steady career elevation and lasting wealth.'
    },
    'Aquarius': {
      love: 'Unconventional ideas and intellectual companionship thrive. Shared social causes or tech hobbies bring you closer to your partner.',
      career: 'Innovation, startup launches, technology, and team projects gain massive momentum. Social media reach performs exceptionally.',
      money: 'Inflow from network connections, tech ventures, or angel partners. Avoid lending large cash without written agreements.',
      health: 'Calf muscle cramps or ankle fatigue. Take short walking breaks during long computer work.',
      luckyColor: 'Cyan Blue & Ultramarine',
      luckyNumber: 8,
      remedy: 'Donate black sesame seeds on Saturday and chant "Om Shanayscharaya Namah".',
      highlight: 'Saturn-ruled Aquarius activates powerful networking and tech gains.'
    },
    'Pisces': {
      love: 'Compassionate, soulful, and poetic connection. Creative or spiritual activities undertaken together bring deep emotional oneness.',
      career: 'Healing, arts, psychology, marine, and spiritual counseling see elevated success. Trust your inner gut feelings on critical choices.',
      money: 'Intuitive financial investments prove profitable. Spending on spiritual rituals or charity brings inner peace.',
      health: 'Feet or heel sensitivity. Warm saltwater foot baths in the evening will release daily fatigue.',
      luckyColor: 'Sea Green & Honey Gold',
      luckyNumber: 3,
      remedy: 'Feed fish or birds in the morning and chant "Om Gurave Namah" 21 times.',
      highlight: 'Jupiterian water vibration activates high creative inspiration and peace.'
    }
  };

  const handleGenerateAiRashifal = async () => {
    if (availableMinutes <= 0) {
      if (onOpenRechargeModal) onOpenRechargeModal();
      return;
    }

    if (onDeductMinute) {
      const ok = onDeductMinute();
      if (!ok) return;
    }

    setIsLoadingAi(true);
    setAiReading('');

    try {
      let readingText = '';
      try {
        const res = await fetch('/api/ai/rashifal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rashi: selectedRashi,
            date: dateString,
            panchang
          })
        });

        if (res.ok) {
          const data = await res.json();
          readingText = data.reading || '';
        }
      } catch (e) {
        console.warn('API route unreachable, using authentic fallback rashifal generator:', e);
      }

      if (!readingText) {
        readingText = `✨ **Guruji Deep Daily ${selectedRashi.hindi} (${selectedRashi.english}) Rashifal for ${dateString}:**

• **Planetary Alignment Highlight:** ${currentDetails.highlight}
• **❤️ Love & Relationships:** ${currentDetails.love}
• **💼 Career & Professional Growth:** ${currentDetails.career}
• **💰 Wealth & Financial Inflow:** ${currentDetails.money}
• **🌿 Health & Vitality:** ${currentDetails.health}
• **🌟 Lucky Elements:** Lucky Color: **${currentDetails.luckyColor}** • Lucky Number: **${currentDetails.luckyNumber}** • Peak Hours: **${currentDetails.luckyHours}**
• **🕉️ Vedic Upay / Remedy:** ${currentDetails.remedy}`;
      }

      setAiReading(readingText);
    } catch (err) {
      console.error(err);
      setAiReading(`✨ **Guruji Daily ${selectedRashi.hindi} (${selectedRashi.english}) Guidance (${dateString}):**
• ${currentDetails.highlight}
• **Vedic Remedy:** ${currentDetails.remedy}`);
    } finally {
      setIsLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Panchang & Date Banner */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-4">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <span className="px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              Vedic Panchang & Daily Rashifal Engine
            </span>
            <h1 className="text-2xl font-bold font-serif bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent mt-1">
              Rashifal for {dateString} ({currentDetails.dayName})
            </h1>
            <p className="text-xs text-gray-300">
              Moon Sign: <strong className="text-indigo-300">{panchang.moonSign}</strong> • Transit Deity: <strong className="text-amber-300">{currentDetails.lord}</strong>
            </p>
          </div>

          {/* Date Selector Buttons: Yesterday / Today / Tomorrow */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => {
                setSelectedDateOffset(-1);
                setAiReading('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDateOffset === -1
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                setSelectedDateOffset(0);
                setAiReading('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDateOffset === 0
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                setSelectedDateOffset(1);
                setAiReading('');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDateOffset === 1
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/10">
          <div>
            <h3 className="font-bold text-lg font-serif text-white">
              Daily Rashifal: {selectedRashi.english} ({selectedRashi.hindi})
            </h3>
            <p className="text-xs text-gray-400">
              Ruling Lord: <strong className="text-indigo-300">{selectedRashi.lord}</strong> • Element:{' '}
              {selectedRashi.element}
            </p>
          </div>

          <button
            onClick={handleGenerateAiRashifal}
            disabled={isLoadingAi}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isLoadingAi ? 'Consulting Planetary Chart...' : `Deep AI Rashifal (Requires 1 Min)`}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-rose-400 block flex items-center gap-1.5">
              <span>❤️</span>
              <span>Love & Marriage</span>
            </span>
            <p className="text-gray-300 leading-relaxed">{currentDetails.love}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-indigo-400 block flex items-center gap-1.5">
              <span>💼</span>
              <span>Career & Business</span>
            </span>
            <p className="text-gray-300 leading-relaxed">{currentDetails.career}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-amber-400 block flex items-center gap-1.5">
              <span>💰</span>
              <span>Wealth & Finance</span>
            </span>
            <p className="text-gray-300 leading-relaxed">{currentDetails.money}</p>
          </div>

          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-1">
            <span className="font-bold text-emerald-400 block flex items-center gap-1.5">
              <span>🌿</span>
              <span>Health & Well-being</span>
            </span>
            <p className="text-gray-300 leading-relaxed">{currentDetails.health}</p>
          </div>
        </div>

        {/* Lucky Numbers, Colors, Hours & Vedic Upay */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <span className="text-[10px] text-amber-300 font-bold block uppercase tracking-wider">🌟 Lucky Color</span>
            <span className="font-bold text-white block text-sm">{currentDetails.luckyColor}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 space-y-1">
            <span className="text-[10px] text-purple-300 font-bold block uppercase tracking-wider">🎰 Lucky Number</span>
            <span className="font-bold text-white block text-sm">Number {currentDetails.luckyNumber}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1">
            <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wider">⏱️ Shubh Muhurat</span>
            <span className="font-bold text-white block text-xs">{currentDetails.luckyHours}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wider">🕉️ Today's Vedic Upay</span>
            <span className="text-gray-200 block text-[11px] leading-snug">{currentDetails.remedy}</span>
          </div>
        </div>

        {/* AI Reading Card */}
        {(isLoadingAi || aiReading) && (
          <div className="p-5 rounded-2xl bg-black/40 border border-indigo-500/30 space-y-3 mt-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
              <Sparkles className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <h4 className="font-serif font-bold text-sm text-white">
                Deep AI Rashifal Guidance ({selectedRashi.english})
              </h4>
            </div>

            {isLoadingAi ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-indigo-300">Consulting planetary alignments and transit positions...</p>
              </div>
            ) : (
              <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-wrap">{aiReading}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
