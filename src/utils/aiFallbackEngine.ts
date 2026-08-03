// Client-side Fail-Safe Engine for Static Deployments (Netlify, GitHub Pages, Vercel)
// Ensures Guruji AI Chatbot and Deep Match Reports ALWAYS work seamlessly with highly specific, topic-aware predictions,
// percentage-based compatibility scores, and detailed Moolank & Bhagyank numerology calculations.

function computeMoolank(dob: string): number {
  if (!dob) return 1;
  const parts = dob.split('-');
  const day = parseInt(parts[2] || parts[0] || '1', 10);
  let num = day;
  while (num > 9) {
    let sum = 0;
    while (num > 0) { sum += num % 10; num = Math.floor(num / 10); }
    num = sum;
  }
  return num || 1;
}

function computeBhagyank(dob: string): number {
  if (!dob) return 1;
  const digits = dob.replace(/\D/g, '');
  let num = 0;
  for (const c of digits) { num += parseInt(c, 10); }
  while (num > 9) {
    let sum = 0;
    while (num > 0) { sum += num % 10; num = Math.floor(num / 10); }
    num = sum;
  }
  return num || 1;
}

const NUMEROLOGY_PLANETS: { [key: number]: { planet: string; lord: string; trait: string } } = {
  1: { planet: 'Sun (Surya)', lord: 'Leadership, Authority & Willpower', trait: 'Ambitious, Independent & Dynamic' },
  2: { planet: 'Moon (Chandra)', lord: 'Mind, Emotions & Intuition', trait: 'Creative, Sensitive & Diplomatic' },
  3: { planet: 'Jupiter (Guru)', lord: 'Wisdom, Knowledge & Education', trait: 'Wise, Expressive & Optimistic' },
  4: { planet: 'Rahu', lord: 'Ambition, Innovation & Quick Gains', trait: 'Sharp, Practical & Growth-Driven' },
  5: { planet: 'Mercury (Budh)', lord: 'Intellect, Communication & Business', trait: 'Versatile, Fast-Learner & Communicative' },
  6: { planet: 'Venus (Shukra)', lord: 'Love, Romance, Wealth & Luxury', trait: 'Charming, Artistic & Wealthy' },
  7: { planet: 'Ketu', lord: 'Intuition, Mysticism & Deep Research', trait: 'Analytical, Philosophical & Intuitive' },
  8: { planet: 'Saturn (Shani)', lord: 'Karma, Hard Work & Discipline', trait: 'Resilient, Dedicated & Structured' },
  9: { planet: 'Mars (Mangal)', lord: 'Courage, Energy & Action', trait: 'Bold, High-Energy & Determined' }
};

function getDynamicSeed(name: string, prompt: string): number {
  let hash = 0;
  const str = (name || "Jatak") + (prompt || "Kundali");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateClientFallbackChatReply(userPrompt: string, kundaliContext: any): string {
  const lower = (userPrompt || "").toLowerCase();
  const name = kundaliContext?.name || "Jatak";
  const rashi = kundaliContext?.rashi || "Taurus";
  const lagna = kundaliContext?.lagna || "Aries";

  const dob = kundaliContext?.dob || "";
  const moolank = kundaliContext?.moolank || computeMoolank(dob);
  const bhagyank = kundaliContext?.bhagyank || computeBhagyank(dob);

  const moolankInfo = NUMEROLOGY_PLANETS[moolank] || NUMEROLOGY_PLANETS[1];
  const bhagyankInfo = NUMEROLOGY_PLANETS[bhagyank] || NUMEROLOGY_PLANETS[1];

  const seed = getDynamicSeed(name, lower);
  const percent1 = Math.min(98, Math.max(68, 75 + (seed % 23)));
  const percent2 = Math.min(97, Math.max(62, 70 + ((seed * 7) % 26)));

  // 1. EXAMS, STUDIES & COMPETITIVE TESTS
  if (
    lower.includes("exam") ||
    lower.includes("clear") ||
    lower.includes("pass") ||
    lower.includes("result") ||
    lower.includes("upsc") ||
    lower.includes("ssc") ||
    lower.includes("jee") ||
    lower.includes("neet") ||
    lower.includes("bank") ||
    lower.includes("study") ||
    lower.includes("padhai") ||
    lower.includes("test") ||
    lower.includes("rank") ||
    lower.includes("college")
  ) {
    return `Pranam ${name}! 📚✨

**🎯 Competitive Exam & Academic Success Prediction:**
- **Exam Clearing & Selection Probability:** **${percent1}% High Success Chance!**
- **Mental Focus & Retention Index:** **${percent2}% Memory Strength**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Harmony:** Moolank ${moolank} (${moolankInfo.planet}) gives sharp intellectual retention, while Bhagyank ${bhagyank} (${bhagyankInfo.planet}) opens favorable karmic examination timing.

**Guruji's Astrological Guidance:**
Aapke Moolank ${moolank} aur 5th House lord ki transit position kaafi favorable hai. Agle 3-6 mahine me focus banaye rakhein — competitive exams, interview, ya selection me **positive result** milne ke ${percent1}% strong chances hain!

**Auspicious Study Timing:**
Brahma Muhurat (4:30 AM to 6:00 AM) or Budh Hora during Morning hours.

**Vedic Upay (Remedy for Academic Victory):**
1. Chant **'Om Budhaya Namah'** or **Saraswati Vandana** 21 times before studying.
2. Offer green grass (Durva) to Lord Ganesha on Wednesdays.
3. Keep a small piece of camphor (Kapoor) on your study desk for sharp focus.`;
  }

  // 2. CRUSH & PROPOSAL
  if (
    lower.includes("crush") ||
    lower.includes("love") ||
    lower.includes("propose") ||
    lower.includes("manegi") ||
    lower.includes("manega") ||
    lower.includes("feelings") ||
    lower.includes("attraction") ||
    lower.includes("proposal") ||
    lower.includes("pyaar") ||
    lower.includes("dil")
  ) {
    return `Pranam ${name}! 💕

**💘 Crush & Proposal Acceptance Prediction:**
- **Proposal Acceptance Success:** **${percent1}% High Probability!**
- **Mutual Attraction Chemistry:** **${percent2}% Emotional Magnetism**
- **Moolank (${moolank}) Romance Aura:** Moolank ${moolank} (${moolankInfo.planet}) aligns directly with Venus in your 5th House of Romance for ${rashi} Rashi.

**Guruji's Insight:**
Aapke Moolank ${moolank} aur Bhagyank ${bhagyank} ke according aapka romantic magnetism boost ho raha hai. Heartfelt aur respectful tarike se proposal dene par **Positive YES** response milne ke ${percent1}%+ chances hain!

**Auspicious Time To Propose:**
Friday (Shukravar) evening during Shukra Hora (5:30 PM to 7:15 PM) or Abhijit Muhurat.

**Vedic Upay (Remedy):**
1. Chant **'Om Draam Dreem Droum Sah Shukraya Namah'** 108 times on Fridays.
2. Keep a Rose Quartz crystal or pink flower with you for romantic harmony.`;
  }

  // 3. EX RETURN & RECONNECTION
  if (
    lower.includes("ex") ||
    lower.includes("return") ||
    lower.includes("wapas") ||
    lower.includes("breakup") ||
    lower.includes("past relationship") ||
    lower.includes("block") ||
    lower.includes("unblock")
  ) {
    const exChance = Math.min(55, Math.max(25, 30 + (seed % 25)));
    const moveOnChance = 100 - exChance + 25;
    return `Pranam ${name}! 💔

**💔 Ex Return & Reconnection Prediction:**
- **Ex Reconnection Chance:** **${exChance}% Low/Moderate Probability** in current Rahu-Ketu transit.
- **Moving On & True Soulmate Arrival:** **${moveOnChance}% High Peace & Genuine Love**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) karmic path:** Bhagyank ${bhagyank} indicates an upgrade in soulmate relationship by 2026-2027.

**Guruji's Insight:**
Kundali ke 8th House aur Venus-Rahu transit me past karmic lessons complete ho rahe hain. Ex ke piche waqt zaya karne se accha hai ki aap aage badhein, kyunki ${moveOnChance}% chances hain ki ek sachha aur devoted partner jaldi aapki life me aayega!

**Vedic Upay:**
1. Perform Shivling Jalabhishek on Mondays with **'Om Namah Shivaya'**.
2. Donate white sweets or milk on Monday evenings for emotional peace.`;
  }

  // 4. MARRIAGE, WEDDING & LIFE PARTNER
  if (
    lower.includes("shaadi") ||
    lower.includes("marriage") ||
    lower.includes("wedding") ||
    lower.includes("spouse") ||
    lower.includes("husband") ||
    lower.includes("wife") ||
    lower.includes("partner") ||
    lower.includes("rishta") ||
    lower.includes("mangal")
  ) {
    return `Pranam ${name}! 💍✨

**💒 Marriage & Life Partner Timing Prediction:**
- **Marriage Favorable Yoga:** **${percent1}% High Probability Window!**
- **Moolank-Bhagyank Compatibility Score:** **${percent2}% Harmonious Sync**
- **7th House & Bhagyank (${bhagyank}):** Brihaspati (Jupiter) transit over 7th House of Marriage combined with Bhagyank ${bhagyank} (${bhagyankInfo.planet}) indicates strong marital alliance yoga.

**Guruji's Insight:**
Aapki Kundali aur Numerology me 7th House (Vivah Sthan) me Guru aur Shukra ka shubh prabhav hai. Agle 6 se 14 mahine ke andar ek caring, loyal aur well-settled spouse milne ke strong yoga hain.

**Vedic Upay:**
1. Chant **'Om Brim Brihaspataye Namah'** on Thursdays.
2. Offer yellow flowers or chana dal at Vishnu-Laxmi temple on Thursday mornings.`;
  }

  // 5. JOB, PROMOTION, SALARY & BUSINESS
  if (
    lower.includes("job") ||
    lower.includes("career") ||
    lower.includes("promotion") ||
    lower.includes("salary") ||
    lower.includes("business") ||
    lower.includes("hike") ||
    lower.includes("work") ||
    lower.includes("office") ||
    lower.includes("company") ||
    lower.includes("switch")
  ) {
    return `Pranam ${name}! 💼💰

**💼 Career, Job & Salary Growth Prediction:**
- **Job Promotion / Salary Hike Probability:** **${percent1}% High Chance!**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Career Synergy:** **${percent2}% Success Index**
- **10th House Karma Sthan:** Driver Number ${moolank} (${moolankInfo.planet}) & Sun/Saturn transits create solid authority & financial stability for ${rashi} Rashi.

**Guruji's Insight:**
Aapke Moolank ${moolank} aur 10th House (Karma Sthan) me Surya (Sun) Grah ki position kaafi mazboot hai. Agle 3-6 mahine me aapki salary hike aur post promotion ke shubh yog ban rahe hain.

**Vedic Upay:**
1. Subah Surya Dev ko Jal (Arghya) chadhayein with **'Om Suryaya Namah'**.
2. Wednesday ko gaaye ko hara chara khilayein for business intellect.`;
  }

  // 6. FOREIGN TRAVEL, VISA & PR
  if (
    lower.includes("foreign") ||
    lower.includes("visa") ||
    lower.includes("pr") ||
    lower.includes("abroad") ||
    lower.includes("videsh") ||
    lower.includes("passport") ||
    lower.includes("travel")
  ) {
    return `Pranam ${name}! ✈️🌍

**🌍 Foreign Placement & Visa Success Prediction:**
- **Visa Approval & Foreign Settlement Chance:** **${percent1}% High Success Rate!**
- **Moolank (${moolank}) Travel Alignment:** **${percent2}% Favorable Alignment**
- **House Transits:** 9th House (Bhagya Sthan) & 12th House (Videsh Sthan) lords are active for ${rashi} Rashi with Bhagyank ${bhagyank}.

**Guruji's Insight:**
Aapke 12th House me Rahu aur Jupiter ka positive transit hai. Abroad higher studies, job assignment, ya PR application me success milne ke strong chances hain.

**Vedic Upay:**
1. Chant **'Om Rahave Namah'** on Saturdays.
2. Keep a silver coin wrapped in clean cloth with your passport/documents.`;
  }

  // 7. WEALTH, DEBT, MONEY & PROPERTY
  if (
    lower.includes("money") ||
    lower.includes("dhan") ||
    lower.includes("debt") ||
    lower.includes("karza") ||
    lower.includes("lottery") ||
    lower.includes("invest") ||
    lower.includes("profit") ||
    lower.includes("property") ||
    lower.includes("makan") ||
    lower.includes("car") ||
    lower.includes("gaadi")
  ) {
    return `Pranam ${name}! 💰🏠

**🏠 Wealth, Property & Financial Prosperity Prediction:**
- **Financial Growth & Debt Clearance Chance:** **${percent1}% High Prosperity!**
- **Property & Vehicle Purchase Yoga:** **${percent2}% Favorable Window**
- **Bhagyank (${bhagyank}) Wealth Index:** Laxmi-Narayan Yoga supports asset accumulation for Moolank ${moolank} & ${lagna} Lagna.

**Guruji's Insight:**
Dhana Sthan (2nd & 11th House) me Shubh grah ki drishti hone se purane karzo se rahat milegi aur naye aay (income) ke strot khulenge.

**Vedic Upay:**
1. Chant Laxmi Beej Mantra: **'Om Shreem Hreem Shreem Kamale Kamalalaye Praseed'** daily.
2. Light a Ghee lamp (Diya) near Tulsi plant in the evening.`;
  }

  // 8. HEALTH & WELL-BEING
  if (
    lower.includes("health") ||
    lower.includes("bimari") ||
    lower.includes("illness") ||
    lower.includes("stress") ||
    lower.includes("headache") ||
    lower.includes("mental") ||
    lower.includes("peace") ||
    lower.includes("swasthya")
  ) {
    return `Pranam ${name}! 🌿🕊️

**🌿 Health, Vitality & Recovery Prediction:**
- **Overall Health Recovery Rate:** **${percent1}% High Energy Level**
- **Mental Peace & Stress Relief Score:** **${percent2}% Vitality Index**
- **Moolank (${moolank}) Protection:** 1st House & Sun/Moon placements shield your vitality for ${rashi} Rashi.

**Guruji's Insight:**
6th House (Roga Sthan) me Rahu/Saturn ka prabhav kam ho raha hai. Mental stress aur seasonal illness se jald rahat milegi.

**Vedic Upay:**
1. Chant **Mahamrityunjaya Mantra**: 'Om Tryambakam Yajamahe...' 11 times daily.
2. Drink water from a copper vessel in the morning.`;
  }

  // 9. TIMELINE & FUTURE FORECAST
  if (
    lower.includes("timeline") ||
    lower.includes("future") ||
    lower.includes("past") ||
    lower.includes("present") ||
    lower.includes("2026") ||
    lower.includes("2027") ||
    lower.includes("2028") ||
    lower.includes("saal")
  ) {
    return `Pranam ${name}! ⏳

**⏳ Life Timeline Forecast (Past, Present & Future):**
- **Past Karmic Phase:** Completed major structural struggles & learning.
- **Present Dasha Phase:** Transiting into **Guru (Jupiter) Benefic Period**.
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Golden Peak:** **2026 to 2028 (${percent1}% High Growth Window)**

**Guruji's Insight:**
Kundali me Mahadasha parivartan aur Bhagyank ${bhagyank} (${bhagyankInfo.planet}) se dhan, career aur family me sthirta aayegi. Aane wale saal me naye moke aur property gain ke yoga hain.

**Vedic Upay:**
Brihaspati Gayatri Mantra jaap karein aur Thursdays ko Vishnu Sahasranama sunein.`;
  }

  // 10. GENERAL / SPECIFIC DYNAMIC KUNDALI PREDICTION
  return `Pranam ${name}! 🙏

**✨ Overall Vedic & Numerology Life Prediction (${rashi} Rashi, Moolank ${moolank}, Bhagyank ${bhagyank}):**
- **Target Goal Success Probability:** **${percent1}% High Potential**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Resonance:** **${percent2}% Harmonic Alignment**
- **Current Transit:** Favorable transit of Jupiter & Sun in Karma Sthan.

**Guruji's Advice:**
Aapke question ke anusar Moolank ${moolank} (${moolankInfo.planet}) aur Bhagyank ${bhagyank} (${bhagyankInfo.planet}) me Shubh Raj Yoga ki sthiti hai. Apne lakshya par dhyan kendrit karein, grah dasha aapke paksh me rukhm le rahi hai.

**Vedic Upay:**
Daily **'Om Namah Shivaya'** & **Gayatri Mantra** 108 baar jaap karein aur needy logon ko daan dein.`;
}

export function generateClientFallbackMatchReport(partner1: any, partner2: any, mode: string): string {
  const p1 = partner1?.name || "Partner 1";
  const p2 = partner2?.name || "Partner 2";

  const m1 = partner1?.moolank || computeMoolank(partner1?.dob || "");
  const b1 = partner1?.bhagyank || computeBhagyank(partner1?.dob || "");
  const m2 = partner2?.moolank || computeMoolank(partner2?.dob || "");
  const b2 = partner2?.bhagyank || computeBhagyank(partner2?.dob || "");

  const seed = getDynamicSeed(p1, p2);
  const score = Math.min(98, Math.max(72, 78 + (seed % 20)));
  const numScore = Math.min(99, Math.max(70, 80 + ((seed * 3) % 19)));

  if (mode === 'crush') {
    return `💖 **Crush Proposal & Mutual Attraction Deep AI Analysis:**

- **Boy/Girl Names:** ${p1} & ${p2}
- **Proposal Acceptance Probability:** **${score}% High Probability (बहुत शुभ योग)**
- **Mutual Chemistry Score:** **${Math.min(99, score + 4)}% Emotional Magnetism**
- **Moolank Compatibility (${m1} & ${m2}):** **${numScore}% Numerology Alignment**
- **Astrological Verdict:** Venus (Shukra Grah) in 5th House of Romance combined with Moolank ${m1} & ${m2} creates an attractive bond between both horoscopes. Expressing feelings with sincerity and respect will yield a positive response!

- **Best Time To Propose:** Friday evening during Shukra Hora (5:30 PM to 7:15 PM) or Abhijit Muhurat.
- **Vedic Remedy for Success:** Offer pink flowers or sweets at a temple on Friday, and chant "Om Draam Dreem Droum Sah Shukraya Namah" 108 times.`;
  }

  if (mode === 'career') {
    const goal1 = partner1?.careerGoal || 'Software & IT / Tech';
    const goal2 = partner2?.careerGoal || 'Business & Startup';
    return `💼 **Career & Professional Compatibility Analysis (${p1} & ${p2}):**

- **Overall Career Synergy Score:** **${score}% High Professional Harmony**
- **Joint Financial Growth & Wealth Score:** **${Math.min(99, score + 3)}% Prosperity Index**
- **Business Venture Collaboration Score:** **${numScore}% Joint Venture Yoga**
- **Moolank (${m1}) & Bhagyank (${b1}) vs Moolank (${m2}) & Bhagyank (${b2}):**
  - ${p1}'s goal ("${goal1}") aligns synergistically with ${p2}'s goal ("${goal2}").
  - Moolank ${m1} brings leadership & strategic vision while Moolank ${m2} provides tactical execution and financial stability.

- **Guruji's Career Guidance:**
  Working or supporting each other's career goals in "${goal1}" and "${goal2}" will boost income streams and career reputation. Neither partner's horoscope shows professional ego friction.

- **Recommended Joint Remedies:**
  1. Keep a Pyrite / Green Aventurine gemstone pyramid in your joint study/workspace.
  2. Offer Jal to Surya Dev together on Sunday mornings with "Om Suryaya Namah" to unlock career promotions.`;
  }

  return `✨ **Vedic & Numerology Compatibility Report for ${p1} & ${p2}:**

- **Overall Match Resonance:** **${score}% High Harmony**
- **Moolank (${m1} vs ${m2}) & Bhagyank (${b1} vs ${b2}) Compatibility:** **${numScore}% Numerology Sync**
- **Key Strengths:** Strong emotional bonding, mutual respect, and stable planetary placement between Moon signs and Driver numbers.
- **Vedic Guidance:** Perfect compatibility for long-term growth and family bliss. Perform joint prayers on Mondays to enhance love and mental peace.`;
}
