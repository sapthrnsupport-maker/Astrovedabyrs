import { KundaliChartData, NumerologyData, AshtaKootaScore, PlanetPosition } from '../types';

export const ZODIAC_SIGNS = [
  { english: 'Aries', hindi: 'मेष (Mesh)', element: 'Fire', lord: 'Mars' },
  { english: 'Taurus', hindi: 'वृषभ (Vrishabh)', element: 'Earth', lord: 'Venus' },
  { english: 'Gemini', hindi: 'मिथुन (Mithun)', element: 'Air', lord: 'Mercury' },
  { english: 'Cancer', hindi: 'कर्क (Kark)', element: 'Water', lord: 'Moon' },
  { english: 'Leo', hindi: 'सिंह (Singh)', element: 'Fire', lord: 'Sun' },
  { english: 'Virgo', hindi: 'कन्या (Kanya)', element: 'Earth', lord: 'Mercury' },
  { english: 'Libra', hindi: 'तुला (Tula)', element: 'Air', lord: 'Venus' },
  { english: 'Scorpio', hindi: 'वृश्चिक (Vrishchik)', element: 'Water', lord: 'Mars' },
  { english: 'Sagittarius', hindi: 'धनु (Dhanu)', element: 'Fire', lord: 'Jupiter' },
  { english: 'Capricorn', hindi: 'मकर (Makar)', element: 'Earth', lord: 'Saturn' },
  { english: 'Aquarius', hindi: 'कुंभ (Kumbh)', element: 'Air', lord: 'Saturn' },
  { english: 'Pisces', hindi: 'मीन (Meen)', element: 'Water', lord: 'Jupiter' }
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
  'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
  'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

// Chaldean letter values for Namank calculation
const CHALDEAN_MAP: { [key: string]: number } = {
  a: 1, i: 1, j: 1, q: 1, y: 1,
  b: 2, c: 2, k: 2, r: 2,
  c_alt: 3, g: 3, l: 3, s: 3,
  d: 4, m: 4, t: 4,
  e: 5, h: 5, n: 5, x: 5,
  u: 6, v: 6, w: 6,
  o: 7, z: 7,
  f: 8, p: 8
};

// Calculate Moolank (Driver Number) from birth date day
export function calculateMoolank(dobString: string): number {
  if (!dobString) return 1;
  const parts = dobString.split('-');
  const day = parseInt(parts[2] || '1', 10);
  return reduceToSingleDigit(day);
}

// Calculate Bhagyank (Conductor / Life Path Number) from full DOB
export function calculateBhagyank(dobString: string): number {
  if (!dobString) return 1;
  const digits = dobString.replace(/\D/g, '');
  let sum = 0;
  for (const char of digits) {
    sum += parseInt(char, 10);
  }
  return reduceToSingleDigit(sum);
}

// Calculate Namank (Name Number)
export function calculateNamank(name: string): number {
  if (!name) return 1;
  const cleanName = name.toLowerCase().replace(/[^a-z]/g, '');
  let sum = 0;
  for (const char of cleanName) {
    sum += CHALDEAN_MAP[char] || 1;
  }
  return reduceToSingleDigit(sum);
}

function reduceToSingleDigit(num: number): number {
  while (num > 9) {
    let sum = 0;
    while (num > 0) {
      sum += num % 10;
      num = Math.floor(num / 10);
    }
    num = sum;
  }
  return num || 1;
}

// Generate complete Numerology Profile
export function getNumerologyProfile(name: string, dob: string): NumerologyData {
  const moolank = calculateMoolank(dob);
  const bhagyank = calculateBhagyank(dob);
  const namank = calculateNamank(name);

  const planetInfo: { [key: number]: { planet: string; planetHindi: string; traits: string[]; colors: string[]; gems: string; days: string[] } } = {
    1: {
      planet: 'Sun (Surya)',
      planetHindi: 'सूर्य',
      traits: ['natural Leader', 'Ambitious', 'Self-Confident', 'Independent', 'Dynamic'],
      colors: ['Ruby Red', 'Golden Yellow', 'Orange'],
      gems: 'Ruby (Manikya)',
      days: ['Sunday', 'Monday']
    },
    2: {
      planet: 'Moon (Chandra)',
      planetHindi: 'चंद्रमा',
      traits: ['Intuitive', 'Emotional', 'Creative', 'Gentle', 'Diplomatic'],
      colors: ['Pearl White', 'Silver', 'Cream'],
      gems: 'Pearl (Moti) or Moonstone',
      days: ['Monday', 'Sunday']
    },
    3: {
      planet: 'Jupiter (Guru)',
      planetHindi: 'बृहस्पति',
      traits: ['Wise', 'Optimistic', 'Spiritual', 'Knowledgeable', 'Generous'],
      colors: ['Yellow', 'Gold', 'Saffron'],
      gems: 'Yellow Sapphire (Pukhraj)',
      days: ['Thursday', 'Tuesday']
    },
    4: {
      planet: 'Rahu (North Node)',
      planetHindi: 'राहु',
      traits: ['Practical', 'Innovative', 'Unconventional', 'Determined', 'Strategic'],
      colors: ['Electric Blue', 'Grey', 'Smoky Brown'],
      gems: 'Hessonite (Gomed)',
      days: ['Saturday', 'Sunday']
    },
    5: {
      planet: 'Mercury (Budh)',
      planetHindi: 'बुध',
      traits: ['Intellectual', 'Adaptable', 'Charming Communicator', 'Analytical', 'Witty'],
      colors: ['Emerald Green', 'Light Green'],
      gems: 'Emerald (Panna)',
      days: ['Wednesday', 'Friday']
    },
    6: {
      planet: 'Venus (Shukra)',
      planetHindi: 'शुक्र',
      traits: ['Artistic', 'Harmonious', 'Romantic', 'Magnetic', 'Luxury Lover'],
      colors: ['Bright White', 'Pink', 'Pastel Shades'],
      gems: 'Diamond (Heera) or White Sapphire',
      days: ['Friday', 'Wednesday']
    },
    7: {
      planet: 'Ketu (South Node)',
      planetHindi: 'केतु',
      traits: ['Analytical', 'Mystical', 'Philosophical', 'Research Oriented', 'Intuitive'],
      colors: ['Cat Eye Yellow', 'Smoky Grey', 'White'],
      gems: 'Cat’s Eye (Lahsuniya)',
      days: ['Tuesday', 'Thursday']
    },
    8: {
      planet: 'Saturn (Shani)',
      planetHindi: 'शनि',
      traits: ['Disciplined', 'Hardworking', 'Resilient', 'Patient', 'Justice Driven'],
      colors: ['Navy Blue', 'Black', 'Dark Brown'],
      gems: 'Blue Sapphire (Neelam) or Amethyst',
      days: ['Saturday', 'Friday']
    },
    9: {
      planet: 'Mars (Mangal)',
      planetHindi: 'मंगल',
      traits: ['Courageous', 'Passionate', 'Protective', 'Energetic', 'Action Oriented'],
      colors: ['Red', 'Crimson', 'Coral'],
      gems: 'Red Coral (Moonga)',
      days: ['Tuesday', 'Sunday']
    }
  };

  const info = planetInfo[moolank] || planetInfo[1];

  return {
    moolank,
    bhagyank,
    namank,
    rulingPlanet: info.planet,
    rulingPlanetHindi: info.planetHindi,
    traits: info.traits,
    luckyNumbers: [moolank, (moolank + 3) % 9 || 9, (moolank + 5) % 9 || 9],
    luckyColors: info.colors,
    luckyDays: info.days,
    luckyGemstone: info.gems,
    favorableDirections: ['North-East', 'East', 'North'],
    compatibilityNumbers: {
      best: [moolank, (moolank + 2) % 9 || 9, (moolank + 4) % 9 || 9],
      neutral: [(moolank + 1) % 9 || 9, (moolank + 5) % 9 || 9],
      avoid: [(moolank + 7) % 9 || 9]
    }
  };
}

// Generate Vedic Kundali Data
export function calculateVedicKundali(dob: string, tob: string, name: string): KundaliChartData {
  const seed = (dob ? dob.replace(/\D/g, '') : '19950101') + (tob ? tob.replace(/\D/g, '') : '1200') + name.length;
  const numSeed = parseInt(seed.slice(-6), 10) || 123456;

  const lagnaIndex = numSeed % 12;
  const moonRashiIndex = (numSeed * 3) % 12;
  const sunRashiIndex = (numSeed * 7) % 12;
  const nakshatraIndex = (numSeed * 5) % 27;

  const lagnaRashi = ZODIAC_SIGNS[lagnaIndex].english;
  const lagnaRashiHindi = ZODIAC_SIGNS[lagnaIndex].hindi;
  const moonRashi = ZODIAC_SIGNS[moonRashiIndex].english;
  const moonRashiHindi = ZODIAC_SIGNS[moonRashiIndex].hindi;
  const sunRashi = ZODIAC_SIGNS[sunRashiIndex].english;
  const sunRashiHindi = ZODIAC_SIGNS[sunRashiIndex].hindi;

  const planetNames = [
    { name: 'Sun', symbol: 'Su', rashiIdx: sunRashiIndex, deg: '14° 22\'' },
    { name: 'Moon', symbol: 'Mo', rashiIdx: moonRashiIndex, deg: '22° 11\'' },
    { name: 'Mars', symbol: 'Ma', rashiIdx: (lagnaIndex + 2) % 12, deg: '08° 45\'' },
    { name: 'Mercury', symbol: 'Me', rashiIdx: (sunRashiIndex + 1) % 12, deg: '19° 03\'' },
    { name: 'Jupiter', symbol: 'Ju', rashiIdx: (lagnaIndex + 4) % 12, deg: '11° 50\'' },
    { name: 'Venus', symbol: 'Ve', rashiIdx: (sunRashiIndex + 2) % 12, deg: '27° 14\'' },
    { name: 'Saturn', symbol: 'Sa', rashiIdx: (lagnaIndex + 9) % 12, deg: '04° 33\'' },
    { name: 'Rahu', symbol: 'Ra', rashiIdx: (lagnaIndex + 1) % 12, deg: '15° 00\'' },
    { name: 'Ketu', symbol: 'Ke', rashiIdx: (lagnaIndex + 7) % 12, deg: '15° 00\'' }
  ];

  const planets: PlanetPosition[] = planetNames.map((p, i) => {
    const r = ZODIAC_SIGNS[p.rashiIdx];
    const house = ((p.rashiIdx - lagnaIndex + 12) % 12) + 1;
    return {
      name: p.name,
      symbol: p.symbol,
      rashi: r.english,
      rashiHindi: r.hindi,
      house: house,
      degree: p.deg,
      nakshatra: NAKSHATRAS[(nakshatraIndex + i) % 27],
      pada: ((i + 1) % 4) + 1,
      retrograde: i === 6 || i === 4, // Saturn/Jupiter simulated retro
      status: i === 4 ? 'Exalted' : i === 6 ? 'Own House' : 'Friendly'
    };
  });

  // Populate 12 Houses
  const houses: { [h: number]: { rashi: string; planets: string[] } } = {};
  const navamshaHouses: { [h: number]: { rashi: string; planets: string[] } } = {};

  for (let h = 1; h <= 12; h++) {
    const rIndex = (lagnaIndex + h - 1) % 12;
    const navRIndex = (lagnaIndex * 9 + h - 1) % 12;
    houses[h] = {
      rashi: ZODIAC_SIGNS[rIndex].english,
      planets: planets.filter(p => p.house === h).map(p => p.symbol)
    };
    navamshaHouses[h] = {
      rashi: ZODIAC_SIGNS[navRIndex].english,
      planets: planets.filter((_, idx) => (idx + h) % 12 === 0).map(p => p.symbol)
    };
  }

  // Manglik Check (Mars in house 1, 4, 7, 8, 12)
  const marsHouse = planets.find(p => p.name === 'Mars')?.house || 1;
  const isManglik = [1, 4, 7, 8, 12].includes(marsHouse);

  // Kaal Sarp Check
  const isKaalSarp = (numSeed % 3) === 0;

  // Sade Sati Check
  const isSadeSati = moonRashiIndex === 9 || moonRashiIndex === 10 || moonRashiIndex === 11;

  return {
    lagnaRashi,
    lagnaRashiHindi,
    moonRashi,
    moonRashiHindi,
    sunRashi,
    sunRashiHindi,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    pada: (numSeed % 4) + 1,
    planets,
    houses,
    navamshaHouses,
    doshas: {
      manglik: {
        present: isManglik,
        severity: isManglik ? 'Medium' : 'None',
        description: isManglik
          ? `Mars is situated in House ${marsHouse} causing Manglik Yoga. Can be pacified through Hanuman Chalisa & Red Coral.`
          : 'No Manglik Dosha detected in Lagna Chart.'
      },
      kaalSarp: {
        present: isKaalSarp,
        type: isKaalSarp ? 'Anant Kaal Sarp Yoga' : 'None',
        description: isKaalSarp
          ? 'Planets are hemmed between Rahu and Ketu. Worship Lord Shiva on Mondays for mental peace and accelerated success.'
          : 'No Kaal Sarp Dosha present.'
      },
      sadeSati: {
        present: isSadeSati,
        phase: isSadeSati ? 'Rising / Core Phase' : 'Inactive',
        description: isSadeSati
          ? 'Saturn transit impacts Moon sign. Practice discipline, light mustard oil lamp under Peepal tree on Saturdays.'
          : 'You are currently free from Shani Sade Sati transit.'
      },
      pitraDosha: {
        present: (numSeed % 5) === 0,
        description: (numSeed % 5) === 0
          ? 'Affliction to 9th Lord/Sun. Donate food on Amavasya to ancestral lineage.'
          : 'No significant Pitra Dosha observed.'
      }
    },
    dasha: {
      currentMahadasha: 'Jupiter (Guru)',
      currentAntardasha: 'Mercury (Budh)',
      endDate: '2028-11-14',
      upcomingDashas: [
        { planet: 'Jupiter', startYear: 2022, endYear: 2038 },
        { planet: 'Saturn', startYear: 2038, endYear: 2057 },
        { planet: 'Mercury', startYear: 2057, endYear: 2074 }
      ]
    }
  };
}

// Gun Milan 36 Points Matchmaking Calculator
export function calculateAshtaKoota(boyDob: string, girlDob: string): AshtaKootaScore {
  const seed = (boyDob ? boyDob.replace(/\D/g, '') : '19940510') + (girlDob ? girlDob.replace(/\D/g, '') : '19960822');
  const num = parseInt(seed.slice(-5), 10) || 54321;

  const varna = (num % 2) + 0; // max 1
  const vashya = (num % 3) === 0 ? 2 : 1; // max 2
  const tara = (num % 4) + 1; // max 3
  const yoni = (num % 5) + 1; // max 4
  const maitri = (num % 5) + 1; // max 5
  const gana = (num % 6) + 1; // max 6
  const bhakoot = (num % 2) === 0 ? 7 : 0; // max 7
  const nadi = (num % 3) === 0 ? 8 : 0; // max 8

  const total = varna + vashya + tara + yoni + maitri + gana + bhakoot + nadi;
  const pct = Math.round((total / 36) * 100);

  let verdict: AshtaKootaScore['verdict'] = 'Not Recommended';
  if (total >= 28) verdict = 'Excellent Match';
  else if (total >= 18) verdict = 'Good Match';
  else if (total >= 12) verdict = 'Average Match';

  return {
    varna: { score: varna, max: 1, description: 'Work compatibility and spiritual ego sync' },
    vashya: { score: vashya, max: 2, description: 'Mutual attraction and emotional dominance' },
    tara: { score: tara, max: 3, description: 'Destiny, health and longevity synchronization' },
    yoni: { score: yoni, max: 4, description: 'Physical compatibility and intimacy harmony' },
    maitri: { score: maitri, max: 5, description: 'Friendship, mental frequency & communication' },
    gana: { score: gana, max: 6, description: 'Temperament (Deva, Manushya, Rakshasa match)' },
    bhakoot: { score: bhakoot, max: 7, description: 'Family welfare, prosperity and progeny' },
    nadi: { score: nadi, max: 8, description: 'Genetic health, nervous sync & spiritual pulse' },
    totalScore: total,
    percentage: pct,
    verdict
  };
}

// Today's Panchang mock data
export function getTodayPanchang() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return {
    date: dateStr,
    tithi: 'Shukla Paksha Ekadashi',
    nakshatra: 'Rohini Nakshatra',
    yoga: 'Ayushman Yoga',
    karana: 'Vishti (Bhadra)',
    sunRise: '05:42 AM',
    sunSet: '07:11 PM',
    rahuKalam: '09:05 AM - 10:45 AM',
    shubhMuhurat: '11:58 AM - 12:51 PM (Abhijit Muhurat)',
    moonSign: 'Taurus (Vrisha Rashi)'
  };
}

// Numerology Domain Specific Predictions Data
export function getNumerologyDomainPredictions(moolank: number, bhagyank: number, namank: number) {
  const moolankDict: { [num: number]: { career: string; health: string; love: string; wealth: string; personality: string } } = {
    1: {
      personality: 'Ruled by Sun (Surya). You possess innate authority, high ambition, unwavering willpower, and a command-oriented presence.',
      career: 'Ideal for CEO, IAS/IPS, Business Owner, Politics, Management, Branding, Government Officer, and Pioneering Startups.',
      health: 'Vitality is strong. Pay attention to eye health, heart rate, blood pressure, and avoiding excessive heat/anger.',
      love: 'You desire a respectful, supportive, and dignified partner. You lead in relationships but must balance self-pride with warmth.',
      wealth: 'Strong earning capability through direct leadership and risky investments. Financial stability blossoms in early 30s.'
    },
    2: {
      personality: 'Ruled by Moon (Chandra). Gentle, highly intuitive, artistic, peacemaker, and deeply sensitive to emotional atmospheres.',
      career: 'Thrives in Psychology, Creative Writing, Nursing, HR, Hospitality, Public Relations, Music, Fine Arts, and Counseling.',
      health: 'Sensitive digestive system and fluid balance. Prone to mood fluctuations, anxiety, and cold/cough during seasonal changes.',
      love: 'Devoted, romantic, and deeply affectionate. Seeks emotional security and a gentle, protective partner.',
      wealth: 'Fluctuating money cycles like Moon phases. Gains wealth steadily when partnering with grounded, practical business minds.'
    },
    3: {
      personality: 'Ruled by Jupiter (Guru). Knowledge seeker, optimistic, born mentor, spiritual speaker, and natural problem solver.',
      career: 'Exceptional in Teaching, Law, Finance, Astrological Counseling, Corporate Training, Publishing, Ministry, and Higher Education.',
      health: 'Robust constitution. Watch out for liver health, weight management, diabetes, and over-indulgence in rich foods.',
      love: 'Values intellectual bonding, shared spiritual values, and open communication. Highly loyal once committed.',
      wealth: 'Natural attractor of wealth and prosperity through wisdom and advisory roles. Excellent long-term investment luck.'
    },
    4: {
      personality: 'Ruled by Rahu. Unconventional thinker, highly organized, hardworking, sharp analytical mind, and system breaker.',
      career: 'Excels in IT, Software Architecture, Cybersecurity, Engineering, Real Estate Development, Data Analytics, and Aviation.',
      health: 'Nervous system sensitivity, unexplained physical fatigue, or sudden health fluctuations. Daily meditation brings grounding.',
      love: 'Seeks absolute loyalty and a steady anchor. May face sudden ups and downs in romance until finding a calm soulmate.',
      wealth: 'Sudden financial gains and unexpected turnarounds. Wealth builds through systematic discipline and tech/property assets.'
    },
    5: {
      personality: 'Ruled by Mercury (Budh). High speed, versatile, witty communicator, adventure seeker, and sharp business strategist.',
      career: 'Outstanding in Stock Market Trading, Media, E-commerce, Sales, Journalism, Travel Industry, Marketing, and Negotiation.',
      health: 'Restless mind, sleep irregular patterns, and nervous tension. Beneficial to practice breathing exercises (Pranayama).',
      love: 'Fun-loving, expressive, and freedom-oriented partner. Needs intellectual stimulation and excitement in relationships.',
      wealth: 'Multiple income sources and quick commercial gains. Highly resourceful in turning ideas into profitable ventures.'
    },
    6: {
      personality: 'Ruled by Venus (Shukra). Magnetic charm, lover of luxury, family-first protector, aesthetic sense, and artistic flair.',
      career: 'Thrives in Fashion, Interior Design, Jewelry, Luxury Hospitality, Entertainment, Cosmetics, Architecture, and Fine Dining.',
      health: 'Good general health. Pay attention to throat, kidney health, skin care, and avoiding excessive sugar consumption.',
      love: 'Deeply romantic, nurturing, and family-focused. Creates a warm, beautiful home environment for their soulmate.',
      wealth: 'attracts comfort, luxury vehicles, and real estate assets smoothly. High prosperity through creative and Venusian sectors.'
    },
    7: {
      personality: 'Ruled by Ketu. Deep researcher, philosophical, analytical, intuitive, introverted, and seeker of ultimate truth.',
      career: 'Great in Research & Development, Data Science, Scientific Innovation, Occult Sciences, Philosophy, Writing, and Cyber Forensics.',
      health: 'Prone to overthinking, insomnia, and psychosomatic tension. Solitude in nature and spiritual grounding restores energy.',
      love: 'Seeks soul-level depth rather than superficial romance. Deeply faithful but requires personal space and quiet time.',
      wealth: 'Wealth comes as a byproduct of mastery and specialized knowledge. Financial peace unlocked through wise, quiet planning.'
    },
    8: {
      personality: 'Ruled by Saturn (Shani). Master of endurance, justice lover, practical administrator, patient builder, and resilient leader.',
      career: 'Dominates Real Estate, Mining, Manufacturing, Construction, Law & Judiciary, Heavy Industries, and Corporate Operations.',
      health: 'Bone density, joint health, teeth, and chronic fatigue requires care. Regular exercise and disciplined daily routine works magic.',
      love: 'Takes time to open up, but commitment is lifelong and rock solid. Highly dependable and protective partner.',
      wealth: 'Huge wealth accumulation in mature years (after age 35). Unshakeable financial empire built step-by-step through patience.'
    },
    9: {
      personality: 'Ruled by Mars (Mangal). Fearless warrior spirit, passionate, protective, high energy, humanitarian, and natural champion.',
      career: 'Leading in Military, Police, Sports, Surgery, Real Estate, Fire & Rescue, Engineering, Project Management, and Social Work.',
      health: 'High body heat, prone to minor injuries, cuts, or sprains due to fast pace. Stay hydrated and practice calming exercises.',
      love: 'Intense, protective, and wholehearted in love. Needs an energetic partner who respects their independence and passion.',
      wealth: 'Gains land, property, and rapid financial momentum. Direct and action-oriented approach creates profitable ventures.'
    }
  };

  const data = moolankDict[moolank] || moolankDict[1];

  return {
    personality: data.personality,
    career: data.career,
    health: data.health,
    love: data.love,
    wealth: data.wealth,
    bhagyankSummary: `Bhagyank ${bhagyank} acts as your destiny conductor, shaping your major life phase milestones and overarching karmic direction.`,
    namankHarmony: `Namank ${namank} gives your public name vibration. ${
      namank === moolank || namank === bhagyank
        ? 'Your name number is in divine harmony with your birth numbers, boosting fame and career luck!'
        : 'Your name number has a unique vibration. Minor spelling tuning can further enhance your luck aura.'
    }`
  };
}

// Moolank & Bhagyank Numerology Compatibility Matrix
export function calculateNumerologyCompatibility(moolank1: number, bhagyank1: number, moolank2: number, bhagyank2: number) {
  // Planet names for 1-9
  const planetRulers: { [key: number]: string } = {
    1: 'Sun (Surya)',
    2: 'Moon (Chandra)',
    3: 'Jupiter (Guru)',
    4: 'Rahu',
    5: 'Mercury (Budh)',
    6: 'Venus (Shukra)',
    7: 'Ketu',
    8: 'Saturn (Shani)',
    9: 'Mars (Mangal)'
  };

  // Planet friendliness chart (1-9)
  const friendlyMatrix: { [num: number]: number[] } = {
    1: [1, 2, 3, 5, 9],
    2: [1, 2, 3, 5],
    3: [1, 2, 3, 5, 7, 9],
    4: [1, 5, 6, 7, 8],
    5: [1, 2, 3, 5, 6, 8],
    6: [4, 5, 6, 7, 8],
    7: [1, 3, 4, 6],
    8: [4, 5, 6, 8],
    9: [1, 3, 5, 9]
  };

  const isMoolankFriendly = (friendlyMatrix[moolank1] || []).includes(moolank2);
  const isBhagyankFriendly = (friendlyMatrix[bhagyank1] || []).includes(bhagyank2);

  let moolankScore = 65;
  if (moolank1 === moolank2) moolankScore = 92;
  else if (isMoolankFriendly) moolankScore = 88;
  else moolankScore = 60;

  let bhagyankScore = 62;
  if (bhagyank1 === bhagyank2) bhagyankScore = 90;
  else if (isBhagyankFriendly) bhagyankScore = 85;
  else bhagyankScore = 58;

  let matrixScore = Math.round((moolankScore * 0.5) + (bhagyankScore * 0.5));

  let moolankVerdict = 'Balanced Emotional Bond';
  if (moolankScore >= 88) moolankVerdict = 'Highly Compatible Soul Connection';
  else if (moolankScore >= 70) moolankVerdict = 'Harmonious Love Chemistry';
  else moolankVerdict = 'Karmic Learning Partnership';

  let matrixVerdict = 'Balanced Lifetime Synergy';
  if (matrixScore >= 85) matrixVerdict = 'Divine Marriage & Destiny Match';
  else if (matrixScore >= 70) matrixVerdict = 'Strong Long-Term Compatibility';
  else matrixVerdict = 'Growth-Oriented Destiny Match';

  return {
    moolankScore,
    moolankVerdict,
    bhagyankScore,
    matrixScore,
    matrixVerdict,
    moolankOnlyMatch: {
      score: moolankScore,
      verdict: moolankVerdict,
      ruler1: planetRulers[moolank1] || 'Sun',
      ruler2: planetRulers[moolank2] || 'Sun',
      desc: isMoolankFriendly || moolank1 === moolank2
        ? `Moolank ${moolank1} (${planetRulers[moolank1]}) and Moolank ${moolank2} (${planetRulers[moolank2]}) form a natural, harmonious love alignment. Daily communication, attraction, and emotional understanding flow effortlessly.`
        : `Moolank ${moolank1} (${planetRulers[moolank1]}) and Moolank ${moolank2} (${planetRulers[moolank2]}) bring contrasting personality energies. With mutual respect and open discussion, this pair creates dynamic balance.`
    },
    combinedMatch: {
      score: matrixScore,
      verdict: matrixVerdict,
      moolankBhagyankPairing: `(${moolank1} + ${bhagyank1}) & (${moolank2} + ${bhagyank2})`,
      desc: isBhagyankFriendly || bhagyank1 === bhagyank2
        ? `The combined destiny numbers (${moolank1}+${bhagyank1}) and (${moolank2}+${bhagyank2}) align beautifully for marriage, family prosperity, property growth, and shared life goals.`
        : `The combined destiny numbers (${moolank1}+${bhagyank1}) and (${moolank2}+${bhagyank2}) yield a ${matrixScore}% compatibility score, supporting steady joint progress over time.`
    },
    relationship: {
      score: Math.min(100, matrixScore + 4),
      desc: isMoolankFriendly
        ? `Driver numbers (${moolank1} & ${moolank2}) share natural emotional warmth, romance, and attraction.`
        : `Driver numbers (${moolank1} & ${moolank2}) require active listening to bridge personality differences.`
    },
    career: {
      score: isBhagyankFriendly ? 90 : 72,
      desc: isBhagyankFriendly
        ? `Conductor numbers (${bhagyank1} & ${bhagyank2}) bring excellent financial luck, property accumulation, and business success.`
        : `Conductor numbers (${bhagyank1} & ${bhagyank2}) benefit from defined roles in managing family finances.`
    },
    health: {
      score: Math.min(100, matrixScore + 2),
      desc: `Elemental balance between Planet ${moolank1} and Planet ${moolank2} maintains vitality and stress peace.`
    },
    lifePath: {
      score: matrixScore,
      desc: `Complete Moolank + Bhagyank matrix yields a ${matrixScore}% overall lifetime harmony alignment.`
    }
  };
}

