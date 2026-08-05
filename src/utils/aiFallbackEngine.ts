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

  const wantsRemedy = /upay|remedy|gemstone|totka|solution|mantra|daan|pooja|kaise theek|kya kare/i.test(lower);

  const seed = getDynamicSeed(name, lower);
  const percent1 = Math.min(98, Math.max(65, 72 + (seed % 24)));
  const percent2 = Math.min(96, Math.max(60, 68 + ((seed * 7) % 27)));

  // 1. EXAMS, STUDIES & COMPETITIVE TESTS
  if (/exam|clear|pass|result|upsc|ssc|jee|neet|bank|study|padhai|test|rank|college/i.test(lower)) {
    let reply = `Pranam ${name}! 📚✨

Aapke exam aur padhai ke sawal ke liye aapki Janm Kundali (${rashi} Rashi, ${lagna} Lagna) aur Numerology (Moolank ${moolank}, Bhagyank ${bhagyank}) ka gahan vishleshana:

• **5th House (Vidya & Buddhi Sthan) & Budh Grah Alignment:**
  Moolank ${moolank} (${moolankInfo.planet}) aapke retention aur focus ko drive karta hai. Present transit me 5th House lord aur Mercury (Budh) ki position favorable timing darsha rahi hai.

• **Success Chance & Focus Index:**
  Current planetary period ke hisab se competitive exams aur selection me **${percent1}% High Probability** ban rahi hai. Memory focus index **${percent2}%** hai.

• **Guruji's Direct Advice:**
  Agle 3 se 6 mahine aapke liye kaafi crucial hain. Subah Brahma Muhurat (4:30 AM to 6:30 AM) me padhai karne par aapki concentration doubled ho jayegi.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (Specific for Academic Success - Mercury/Saraswati Alignment):**
1. Wednesdays ko 21 baar **'Om Budhaya Namah'** ka jaap karein ya Saraswati Vandana karein.
2. Study table par Kapoor (Camphor) rakhein aur Lord Ganesha ko Durva offer karein.`;
    }
    return reply;
  }

  // 2. CRUSH & PROPOSAL
  if (/crush|love|propose|manegi|manega|feelings|attraction|proposal|pyaar|dil/i.test(lower)) {
    let reply = `Pranam ${name}! 💕

Crush aur proposal acceptance ke baare me aapki Kundali aur Moolank ${moolank} ka analysis:

• **5th House (Love & Romance) & Shukra (Venus) Prabhav:**
  Aapke Moolank ${moolank} (${moolankInfo.planet}) aur Bhagyank ${bhagyank} (${bhagyankInfo.planet}) me 5th House lord Venus ka active aspect hai.

• **Proposal Acceptance Chance:**
  Respectful aur genuine tarike se feelings express karne par positive response milne ke **${percent1}% chances** hain. Emotional attraction score **${percent2}%** hai.

• **Auspicious Timing:**
  Friday (Shukravar) evening ya Abhijit Muhurat me baat shuru karna astrological perspective se sabse favorable rahega.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (Targeted for Romantic Harmony & Venus Strength):**
1. Fridays ko **'Om Draam Dreem Droum Sah Shukraya Namah'** 108 baar jaap karein.
2. Apne paas Rose Quartz crystal ya light pink handkerchief rakhein.`;
    }
    return reply;
  }

  // 3. EX RETURN & BREAKUP
  if (/ex|return|wapas|breakup|past relationship|block|unblock/i.test(lower)) {
    const exChance = Math.min(52, Math.max(22, 28 + (seed % 24)));
    const moveOnChance = 100 - exChance + 20;

    let reply = `Pranam ${name}! 💔

Past relationship aur ex ke wapas aane ke vishaye me astrological evaluation:

• **8th House Karmic Cycle & Transit:**
  Kundali me Venus-Rahu transit past karmic lesson complete kar raha hai. Ex ki wapsi ke chances **${exChance}% (Low to Moderate)** hain.

• **New Chapter & Future Soulmate:**
  Bhagyank ${bhagyank} (${bhagyankInfo.planet}) yeh sanket deta hai ki self-growth par focus karne se aane wale time me ek sachha aur loyal partner milne ke **${moveOnChance}% strong chances** hain.

• **Guruji's Guidance:**
  Purani yaadon me apna time waist na karein. Planetary transits aapko aage badhne ka raasta dikha rahe hain.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (For Emotional Peace & Karmic Healing):**
1. Mondays ko Shivling par Jalabhishek karein aur **'Om Namah Shivaya'** jaap karein.
2. Monday evenings ko kisi zarooratmand ko doodh ya safed mithai daan karein.`;
    }
    return reply;
  }

  // 4. MARRIAGE & TIMING
  if (/shaadi|marriage|wedding|spouse|husband|wife|partner|rishta|mangal/i.test(lower)) {
    let reply = `Pranam ${name}! 💍✨

Shaadi aur life partner ke sawal par aapki Kundali (${rashi} Rashi, ${lagna} Lagna) ka vivaran:

• **7th House (Vivah Sthan) & Jupiter/Venus Aspect:**
  Guru (Jupiter) aur Shukra (Venus) ka 7th House par shubh drishti yog hai. Bhagyank ${bhagyank} (${bhagyankInfo.planet}) marital harmony ko support karta hai.

• **Marriage Yoga & Timing Window:**
  Agle 6 se 14 mahine ke dauran ek caring, well-settled aur understanding life partner milne ka **${percent1}% strong yoga** hai.

• **Nature of Spouse:**
  Spouse highly educated, supportive aur respectable background se honge.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (For Early & Happy Marriage - Jupiter Alignment):**
1. Thursdays ko **'Om Brim Brihaspataye Namah'** ka 108 baar jaap karein.
2. Thursdays ko Vishnu-Laxmi mandir me peele phool ya chana dal arpit karein.`;
    }
    return reply;
  }

  // 5. JOB, CAREER & SALARY
  if (/job|career|promotion|salary|business|hike|work|office|company|switch/i.test(lower)) {
    let reply = `Pranam ${name}! 💼💰

Career, job growth aur financial stability ka Kundali vishleshana:

• **10th House (Karma Sthan) & Sun/Saturn Balance:**
  Moolank ${moolank} (${moolankInfo.planet}) leadership traits deta hai. 10th House me Surya aur Guru transit se authority aur career upliftment ke yog hain.

• **Promotion & Salary Hike Probability:**
  Agle 3 se 6 mahine me career transition, promotion, ya salary hike ka **${percent1}% high chance** hai.

• **Guruji's Practical Advice:**
  Skill upgrade karein aur office conflicts se door rahein; Dasha period aapko growth dene ke liye tayyar hai.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (For Career Promotion & Authority - Sun Alignment):**
1. Daily subah Surya Dev ko Jal (Arghya) arpit karein with **'Om Suryaya Namah'**.
2. Wednesdays को gaaye ko hara chara khilayein intellect aur business acumen ke liye.`;
    }
    return reply;
  }

  // 6. FOREIGN TRAVEL & VISA
  if (/foreign|visa|pr|abroad|videsh|passport|travel/i.test(lower)) {
    let reply = `Pranam ${name}! ✈️🌍

Videsh Yatra aur Visa ke vishaye me planetary positioning:

• **12th House (Videsh Sthan) & 9th House (Bhagya Sthan) Yog:**
  Aapki Rashi ${rashi} me Rahu aur Guru ka 12th house aspect foreign travel aur abroad settlement ko support karta hai.

• **Visa Approval & Success Rate:**
  Foreign assignment, higher education ya PR application me success ka **${percent1}% high probability** hai.`;

    if (wantsRemedy) {
      reply += `\n\n**Vedic Upay (For Foreign Travel Success - Rahu/Ketu Cleanse):**
1. Saturdays ko **'Om Rahave Namah'** ka jaap karein.
2. Apne passport/documents ke saath chandi ka sikka rkhein.`;
    }
    return reply;
  }

  // GENERAL RESPONSE
  let reply = `Pranam ${name}! 🙏

Aapke sawal par aapki Janm Kundali (${rashi} Rashi, ${lagna} Lagna) aur Numerology (Moolank ${moolank}, Bhagyank ${bhagyank}) ka realistic evaluation:

• **Astrological Insights:**
  Driver Number ${moolank} (${moolankInfo.planet}) aur Conductor Number ${bhagyank} (${bhagyankInfo.planet}) ki dasha aapke goal ke sath align ho rahi hai.

• **Favorable Alignment & Probability:**
  Current planetary transits me aapke maamle me positive outcome ke **${percent1}% favorable chances** hain.

• **Guruji's Perspective:**
  Patience aur consistent effort banaye rakhein, grah dasha aapke paksh me rukh mod rahi hai.`;

  if (wantsRemedy) {
    reply += `\n\n**Vedic Upay (General Energy Alignment):**
1. Daily **'Om Namah Shivaya'** ka 108 baar jaap karein.
2. Rozana subah Surya Dev ko arghya arpit karein.`;
  }
  return reply;
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
