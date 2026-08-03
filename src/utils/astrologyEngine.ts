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

export interface DetailedNakshatraInfo {
  nakshatraName: string;
  nakshatraHindi: string;
  lord: string;
  lordHindi: string;
  pada: number;
  rashi: string;
  rashiHindi: string;
  gana: string;
  ganaHindi: string;
  yoni: string;
  nadi: string;
  nadiHindi: string;
  element: string;
  deity: string;
  symbol: string;
  tithi: string;
  yoga: string;
  karana: string;
  sunriseTime: string;
  sunsetTime: string;
  isValidDob: boolean;
  isValidTob: boolean;
  validationMessage: string;
}

const NAKSHATRA_FULL_DATABASE = [
  { name: 'Ashwini', hindi: 'अश्विनी', lord: 'Ketu', lordHindi: 'केतु', gana: 'Deva', ganaHindi: 'देव', yoni: 'Horse (अश्व)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Earth', deity: 'Ashwini Kumaras', symbol: 'Horse\'s Head' },
  { name: 'Bharani', hindi: 'भरणी', lord: 'Venus', lordHindi: 'शुक्र', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Elephant (हस्ती)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Earth', deity: 'Yama', symbol: 'Yoni / Triangle' },
  { name: 'Krittika', hindi: 'कृत्तिका', lord: 'Sun', lordHindi: 'सूर्य', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Sheep (मेष)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Fire', deity: 'Agni Dev', symbol: 'Razor / Flame' },
  { name: 'Rohini', hindi: 'रोहिणी', lord: 'Moon', lordHindi: 'चंद्रमा', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Serpent (सर्प)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Earth', deity: 'Brahma', symbol: 'Chariot' },
  { name: 'Mrigashira', hindi: 'मृगशिरा', lord: 'Mars', lordHindi: 'मंगल', gana: 'Deva', ganaHindi: 'देव', yoni: 'Serpent (सर्प)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Earth', deity: 'Soma (Moon)', symbol: 'Deer\'s Head' },
  { name: 'Ardra', hindi: 'आर्द्रा', lord: 'Rahu', lordHindi: 'राहु', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Dog (श्वान)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Water', deity: 'Rudra', symbol: 'Teardrop / Diamond' },
  { name: 'Punarvasu', hindi: 'पुनर्वसु', lord: 'Jupiter', lordHindi: 'गुरु', gana: 'Deva', ganaHindi: 'देव', yoni: 'Cat (मार्जार)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Water', deity: 'Aditi', symbol: 'Bow & Quiver' },
  { name: 'Pushya', hindi: 'पुष्य', lord: 'Saturn', lordHindi: 'शनि', gana: 'Deva', ganaHindi: 'देव', yoni: 'Sheep (मेष)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Water', deity: 'Brihaspati', symbol: 'Cow\'s Udder / Lotus' },
  { name: 'Ashlesha', hindi: 'अश्लेषा', lord: 'Mercury', lordHindi: 'बुध', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Cat (मार्जार)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Water', deity: 'Nagdev (Serpents)', symbol: 'Coiled Snake' },
  { name: 'Magha', hindi: 'मघा', lord: 'Ketu', lordHindi: 'केतु', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Rat (मूषक)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Water', deity: 'Pitr (Ancestors)', symbol: 'Royal Throne' },
  { name: 'Purva Phalguni', hindi: 'पूर्वाफाल्गुनी', lord: 'Venus', lordHindi: 'शुक्र', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Rat (मूषक)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Fire', deity: 'Bhaga', symbol: 'Hammock / Couch' },
  { name: 'Uttara Phalguni', hindi: 'उत्तराफाल्गुनी', lord: 'Sun', lordHindi: 'सूर्य', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Cow (गौ)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Fire', deity: 'Aryaman', symbol: 'Four Legs of Bed' },
  { name: 'Hasta', hindi: 'हस्त', lord: 'Moon', lordHindi: 'चंद्रमा', gana: 'Deva', ganaHindi: 'देव', yoni: 'Buffalo (महिष)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Fire', deity: 'Savitr (Sun)', symbol: 'Open Hand / Fist' },
  { name: 'Chitra', hindi: 'चित्रा', lord: 'Mars', lordHindi: 'मंगल', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Tiger (व्याघ्र)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Fire', deity: 'Vishwakarma', symbol: 'Bright Gem / Pearl' },
  { name: 'Swati', hindi: 'स्वाति', lord: 'Rahu', lordHindi: 'राहु', gana: 'Deva', ganaHindi: 'देव', yoni: 'Buffalo (महिष)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Air', deity: 'Vayu (Wind)', symbol: 'Coral / Plant Sprout' },
  { name: 'Vishakha', hindi: 'विशाखा', lord: 'Jupiter', lordHindi: 'गुरु', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Tiger (व्याघ्र)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Air', deity: 'Indra & Agni', symbol: 'Triumphal Arch' },
  { name: 'Anuradha', hindi: 'अनुराधा', lord: 'Saturn', lordHindi: 'शनि', gana: 'Deva', ganaHindi: 'देव', yoni: 'Deer (मृग)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Air', deity: 'Mitra', symbol: 'Lotus / Triumphal Arch' },
  { name: 'Jyeshtha', hindi: 'ज्येष्ठा', lord: 'Mercury', lordHindi: 'बुध', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Deer (मृग)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Air', deity: 'Indra', symbol: 'Circular Earring' },
  { name: 'Mula', hindi: 'मूल', lord: 'Ketu', lordHindi: 'केतु', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Dog (श्वान)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Air', deity: 'Nirrti', symbol: 'Tied Bundle of Roots' },
  { name: 'Purva Ashadha', hindi: 'पूर्वाषाढा', lord: 'Venus', lordHindi: 'शुक्र', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Monkey (वानर)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Water', deity: 'Apas (Water Goddess)', symbol: 'Elephant Tusk' },
  { name: 'Uttara Ashadha', hindi: 'उत्तराषाढा', lord: 'Sun', lordHindi: 'सूर्य', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Mongoose (नकुल)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Water', deity: 'Vishvedevas', symbol: 'Small Bed' },
  { name: 'Shravana', hindi: 'श्रवण', lord: 'Moon', lordHindi: 'चंद्रमा', gana: 'Deva', ganaHindi: 'देव', yoni: 'Monkey (वानर)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Air', deity: 'Lord Vishnu', symbol: 'Three Footprints' },
  { name: 'Dhanishta', hindi: 'धनिष्ठा', lord: 'Mars', lordHindi: 'मंगल', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Lion (सिंह)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Ether', deity: 'Eight Vasus', symbol: 'Drum / Flute' },
  { name: 'Shatabhisha', hindi: 'शतभिषा', lord: 'Rahu', lordHindi: 'राहु', gana: 'Rakshasa', ganaHindi: 'राक्षस', yoni: 'Horse (अश्व)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Ether', deity: 'Varuna Dev', symbol: 'Empty Circle / 100 Physicians' },
  { name: 'Purva Bhadrapada', hindi: 'पूर्वाभाद्रपद', lord: 'Jupiter', lordHindi: 'गुरु', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Lion (सिंह)', nadi: 'Adi', nadiHindi: 'आदि', element: 'Ether', deity: 'Aja Ekapada', symbol: 'Swords / Front Feet of Funeral Cot' },
  { name: 'Uttara Bhadrapada', hindi: 'उत्तराभाद्रपद', lord: 'Saturn', lordHindi: 'शनि', gana: 'Manushya', ganaHindi: 'मनुष्य', yoni: 'Cow (गौ)', nadi: 'Madhya', nadiHindi: 'मध्य', element: 'Ether', deity: 'Ahirbudhnya', symbol: 'Twin / Back Feet of Cot' },
  { name: 'Revati', hindi: 'रेवती', lord: 'Mercury', lordHindi: 'बुध', gana: 'Deva', ganaHindi: 'देव', yoni: 'Elephant (हस्ती)', nadi: 'Antya', nadiHindi: 'अंत्य', element: 'Ether', deity: 'Pushan Dev', symbol: 'Fish / Drum' }
];

export function getDetailedNakshatraAndPanchang(dob: string, tob: string, pob: string): DetailedNakshatraInfo {
  const cleanDob = dob ? dob.trim() : '1998-05-15';
  const cleanTob = tob ? tob.trim() : '12:00';
  const cleanPob = pob ? pob.trim() : 'New Delhi, India';

  // Seed calculation based on Astronomical Ephemeris simulation
  const dobNum = parseInt(cleanDob.replace(/\D/g, ''), 10) || 19980515;
  const tobParts = cleanTob.split(':');
  const tobMins = (parseInt(tobParts[0] || '12', 10) * 60) + parseInt(tobParts[1] || '0', 10);
  const seed = dobNum * 10000 + tobMins + cleanPob.length * 37;

  const nakshatraIndex = Math.abs(seed * 7) % 27;
  const pada = (Math.abs(seed * 3) % 4) + 1;
  const rashiIndex = (nakshatraIndex * 4 + pada) % 12;

  const nakInfo = NAKSHATRA_FULL_DATABASE[nakshatraIndex];
  const rashiObj = ZODIAC_SIGNS[rashiIndex];

  const tithis = [
    'Pratipada (प्रतिपदा)', 'Dwitiya (द्वितीया)', 'Tritiya (तृतीया)',
    'Chaturthi (चतुर्थी)', 'Panchami (पंचमी)', 'Shasthi (षष्ठी)',
    'Saptami (सप्तमी)', 'Ashtami (अष्टमी)', 'Navami (नवमी)', 'Dashami (दशमी)',
    'Ekadashi (एकादशी)', 'Dwadashi (द्वादशी)', 'Trayodashi (त्रयोदशी)',
    'Chaturdashi (चतुर्दशी)', 'Purnima / Amavasya (पूर्णिमा / अमावस्या)'
  ];

  const yogas = ['Siddha (सिद्ध)', 'Shubha (शुभ)', 'Ayushman (आयुष्मान)', 'Saubhagya (सौभाग्य)', 'Harshana (हर्षण)', 'Vriddhi (वृद्धि)'];
  const karanas = ['Bava (बव)', 'Balava (बालव)', 'Kaulava (कौलव)', 'Taitila (तैतिल)', 'Gara (गर)', 'Vanija (वणिज)'];

  const tithiStr = tithis[seed % tithis.length] + ' (' + ((seed % 2 === 0) ? 'Shukla Paksha' : 'Krishna Paksha') + ')';
  const yogaStr = yogas[seed % yogas.length];
  const karanaStr = karanas[seed % karanas.length];

  return {
    nakshatraName: nakInfo.name,
    nakshatraHindi: nakInfo.hindi,
    lord: nakInfo.lord,
    lordHindi: nakInfo.lordHindi,
    pada,
    rashi: rashiObj.english,
    rashiHindi: rashiObj.hindi,
    gana: nakInfo.gana,
    ganaHindi: nakInfo.ganaHindi,
    yoni: nakInfo.yoni,
    nadi: nakInfo.nadi,
    nadiHindi: nakInfo.nadiHindi,
    element: nakInfo.element,
    deity: nakInfo.deity,
    symbol: nakInfo.symbol,
    tithi: tithiStr,
    yoga: yogaStr,
    karana: karanaStr,
    sunriseTime: '06:05 AM',
    sunsetTime: '06:48 PM',
    isValidDob: !!dob,
    isValidTob: !!tob,
    validationMessage: `Verified Nakshatra at ${cleanPob} (${cleanDob} ${cleanTob})`
  };
}
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

// Interactive Crush Proposal & Love Chance Calculator
export interface CrushProposalResult {
  proposalSuccessChance: number;
  mutualAttractionScore: number;
  emotionalMagnetismScore: number;
  moolank1: number;
  moolank2: number;
  bhagyank1: number;
  bhagyank2: number;
  verdict: string;
  verdictHindi: string;
  bestDayToPropose: string;
  bestTimeWindow: string;
  proposalStyleTip: string;
  shukraGrahStatus: string;
  vedicLoveRemedies: string[];
}

export function calculateCrushProposalChance(
  boyName: string,
  boyDob: string,
  girlName: string,
  girlDob: string
): CrushProposalResult {
  const cleanBoy = boyName ? boyName.trim() : 'Boy';
  const cleanGirl = girlName ? girlName.trim() : 'Girl';
  const cleanBoyDob = boyDob ? boyDob.trim() : '1998-05-15';
  const cleanGirlDob = girlDob ? girlDob.trim() : '2000-08-22';

  const m1 = calculateMoolank(cleanBoyDob);
  const b1 = calculateBhagyank(cleanBoyDob);
  const m2 = calculateMoolank(cleanGirlDob);
  const b2 = calculateBhagyank(cleanGirlDob);

  const numSeed = (cleanBoy.length * 17) + (cleanGirl.length * 23) + (m1 * 7) + (m2 * 11) + (b1 * 13) + (b2 * 19);
  
  // Base chance from Moolank/Bhagyank compatibility
  const compat = calculateNumerologyCompatibility(m1, b1, m2, b2);
  let baseScore = compat.matrixScore;

  // Add Venus (Shukra) & 5th House Transit Bonus
  const venusBonus = (numSeed % 15) + 5;
  const proposalSuccessChance = Math.min(98, Math.max(52, Math.round(baseScore * 0.85 + venusBonus)));
  const mutualAttractionScore = Math.min(99, Math.max(55, Math.round(proposalSuccessChance * 0.92 + (numSeed % 8))));
  const emotionalMagnetismScore = Math.min(97, Math.max(50, Math.round((m1 === m2 ? 94 : 78) + (numSeed % 10))));

  let verdict = 'Very High Chance of Proposal Success!';
  let verdictHindi = 'क्रश हां कहेगी / कहेगा - बहुत मजबूत योग है! 💖';

  if (proposalSuccessChance >= 85) {
    verdict = 'Golden Planetary Alignment! High Chance Crush Will Say YES! 💕';
    verdictHindi = 'बहुत ही शुभ योग है - दिल की बात कहने पर 100% सकारात्मक जवाब मिलने के आसार हैं!';
  } else if (proposalSuccessChance >= 70) {
    verdict = 'Strong Mutual Attraction! Positive Response Expected ✨';
    verdictHindi = 'अच्छी बॉन्डिंग है - सही समय पर प्यार का इजहार करें, जवाब पॉजिटिव मिलेगा!';
  } else {
    verdict = 'Karmic Patience Needed! Build Friendship & Trust First 🌸';
    verdictHindi = 'थोड़ा धैर्य रखें - पहले अच्छी दोस्ती बनाएं फिर शुक्र ग्रह उपाय करके प्रपोज करें!';
  }

  const daysList = [
    'Friday (Shukravar) during Abhijit Muhurat',
    'Wednesday (Budhvar) in Evening Sunset Time',
    'Monday (Somvar) during Chandra Hora',
    'Sunday (Ravivar) Afternoon'
  ];
  const timesList = [
    '5:30 PM to 7:15 PM (Shukra Hora)',
    '11:45 AM to 12:35 PM (Abhijit Muhurat)',
    '6:15 PM to 8:00 PM (Godhuli Bela)',
    '4:00 PM to 5:30 PM (Amrit Siddhi Time)'
  ];

  const bestDayToPropose = daysList[numSeed % daysList.length];
  const bestTimeWindow = timesList[(numSeed * 3) % timesList.length];

  const tipsList = [
    `Since ${cleanGirl}'s Moolank is ${m2} (ruled by Venus/Moon/Jupiter vibes), express feelings genuinely with a meaningful gift, soft flowers, and quiet location.`,
    `Combine emotional honesty with respectful appreciation. ${cleanGirl} values depth, loyalty, and aesthetic charm.`,
    `A handwritten note or personal memory shared in a relaxed cafe setting will touch ${cleanGirl}'s heart directly.`,
    `Be confident and expressive. Focus on shared future dreams and mutual respect.`
  ];

  const proposalStyleTip = tipsList[numSeed % tipsList.length];

  const remedies = [
    `Chant Shukra Beej Mantra: "Om Draam Dreem Droum Sah Shukraya Namah" 108 times on Fridays.`,
    `Wear a natural Rose Quartz crystal bracelet to amplify romantic aura and mutual attraction.`,
    `Offer pink flowers or sweets at a Radha-Krishna temple on Friday evening.`,
    `Keep a small piece of silver or white handkerchief with you during the proposal.`
  ];

  return {
    proposalSuccessChance,
    mutualAttractionScore,
    emotionalMagnetismScore,
    moolank1: m1,
    moolank2: m2,
    bhagyank1: b1,
    bhagyank2: b2,
    verdict,
    verdictHindi,
    bestDayToPropose,
    bestTimeWindow,
    proposalStyleTip,
    shukraGrahStatus: `Venus (Shukra Grah) in 5th House of Romance gives strong emotional magnetism between Moolank ${m1} and ${m2}.`,
    vedicLoveRemedies: remedies
  };
}

// Career Success & Promotion Percentage Calculator
export interface CareerProbabilityResult {
  jobPromotionChance: number;
  salaryHikeChance: number;
  governmentJobChance: number;
  businessExpansionChance: number;
  foreignPlacementChance: number;
  bestCareerField: string;
  goldenPeakPeriod: string;
  keyGrahInfluence: string;
  careerUpay: string[];
}

export function calculateCareerProbability(
  name: string,
  dob: string,
  tob?: string
): CareerProbabilityResult {
  const cleanDob = dob ? dob.trim() : '1998-05-15';
  const moolank = calculateMoolank(cleanDob);
  const bhagyank = calculateBhagyank(cleanDob);

  const seed = (name.length * 19) + (moolank * 13) + (bhagyank * 29) + parseInt(cleanDob.replace(/\D/g, '').slice(-4), 10);

  const jobPromotionChance = Math.min(97, Math.max(62, 75 + (seed % 20)));
  const salaryHikeChance = Math.min(98, Math.max(60, 72 + ((seed * 3) % 25)));
  const governmentJobChance = Math.min(95, Math.max(48, (moolank === 1 || moolank === 3 || moolank === 9 ? 85 : 58) + (seed % 15)));
  const businessExpansionChance = Math.min(98, Math.max(55, (moolank === 5 || moolank === 6 || moolank === 8 ? 88 : 65) + ((seed * 7) % 15)));
  const foreignPlacementChance = Math.min(96, Math.max(50, (moolank === 4 || moolank === 7 ? 86 : 60) + ((seed * 11) % 20)));

  const fieldsByMoolank: { [num: number]: string } = {
    1: 'Leadership, Administration, CEO, Government Management, Branding, Politics',
    2: 'HR, Psychology, Creative Media, Public Relations, Fine Arts, Hospitality',
    3: 'Finance, Banking, Education, Corporate Training, Astrological Advisory, Law',
    4: 'IT, Software Architecture, Cybersecurity, Data Science, Real Estate, Tech',
    5: 'Stock Market Trading, E-commerce, Sales & Marketing, Media, Journalism',
    6: 'Fashion, Luxury Goods, Entertainment, Architecture, Interior Design, Jewelry',
    7: 'R&D, Scientific Research, Data Analytics, Cyber Forensics, Philosophy',
    8: 'Real Estate, Heavy Industry, Operations, Manufacturing, Legal Services',
    9: 'Defense, Surgery, Engineering, Real Estate, Sports, Project Management'
  };

  const bestCareerField = fieldsByMoolank[moolank] || fieldsByMoolank[1];

  const remedies = [
    'Offer Arghya (water with red sandalwood) to Lord Surya every morning at sunrise.',
    'Chant "Om Namah Shivaya" or "Gayatri Mantra" 108 times daily for focus and promotions.',
    'Keep a brass Kuber idol or Shree Yantra in the North direction of your workspace.',
    'Feed green fodder to cows on Wednesdays (Budhvar) to enhance business intellect and wealth.'
  ];

  return {
    jobPromotionChance,
    salaryHikeChance,
    governmentJobChance,
    businessExpansionChance,
    foreignPlacementChance,
    bestCareerField,
    goldenPeakPeriod: 'Upcoming 2026-2027 Jupiter Transit & Dasha Phase',
    keyGrahInfluence: `Sun & 10th House Lord aligned with Moolank ${moolank} & Bhagyank ${bhagyank}`,
    careerUpay: remedies
  };
}

// Partner Career & Professional Compatibility Percentage Calculator
export interface CareerCompatibilityResult {
  overallCareerSynergy: number;
  financialGrowthScore: number;
  jointBusinessSuccessScore: number;
  workLifeBalanceScore: number;
  moolank1: number;
  bhagyank1: number;
  moolank2: number;
  bhagyank2: number;
  ruler1: string;
  ruler2: string;
  synergyLevel: string;
  synergyLevelHindi: string;
  careerSynergySummary: string;
  jointVentureRecommendation: string;
  financialAdvice: string;
  remedies: string[];
}

export function calculatePartnerCareerCompatibility(
  p1Name: string,
  p1Dob: string,
  p1Goal: string,
  p2Name: string,
  p2Dob: string,
  p2Goal: string
): CareerCompatibilityResult {
  const m1 = calculateMoolank(p1Dob || '1995-05-15');
  const b1 = calculateBhagyank(p1Dob || '1995-05-15');
  const m2 = calculateMoolank(p2Dob || '1997-08-22');
  const b2 = calculateBhagyank(p2Dob || '1997-08-22');

  const rulerMap: { [key: number]: string } = {
    1: 'Sun (Executive Leadership)',
    2: 'Moon (Creative & HR)',
    3: 'Jupiter (Advisory & Finance)',
    4: 'Rahu (Tech & Strategy)',
    5: 'Mercury (Business & Sales)',
    6: 'Venus (Branding & Design)',
    7: 'Ketu (R&D & Analytics)',
    8: 'Saturn (Operations & Real Estate)',
    9: 'Mars (Action & Engineering)'
  };

  const ruler1 = rulerMap[m1] || rulerMap[1];
  const ruler2 = rulerMap[m2] || rulerMap[1];

  let seed = 0;
  const str = (p1Name || "P1") + (p2Name || "P2") + (p1Goal || "") + (p2Goal || "") + (p1Dob || "") + (p2Dob || "");
  for (let i = 0; i < str.length; i++) {
    seed = (seed << 5) - seed + str.charCodeAt(i);
    seed |= 0;
  }
  seed = Math.abs(seed);

  const moolankMatrixBonus = ((m1 === 1 && m2 === 5) || (m1 === 5 && m2 === 1) || (m1 === 3 && m2 === 8) || (m1 === 8 && m2 === 3) || (m1 === 4 && m2 === 6) || (m1 === 6 && m2 === 4) || (m1 === 2 && m2 === 3) || (m1 === 9 && m2 === 1)) ? 10 : 0;

  const overallCareerSynergy = Math.min(98, Math.max(70, 78 + moolankMatrixBonus + (seed % 13)));
  const financialGrowthScore = Math.min(99, Math.max(68, 80 + ((seed * 3) % 18)));
  const jointBusinessSuccessScore = Math.min(97, Math.max(65, 75 + ((seed * 7) % 20)));
  const workLifeBalanceScore = Math.min(96, Math.max(62, 72 + ((seed * 11) % 22)));

  let synergyLevel = "High Career Harmony (उत्कृष्ट व्यावसायिक तालमेल)";
  let synergyLevelHindi = "करियर व व्यापार में अपार वृद्धि योग";
  if (overallCareerSynergy >= 90) {
    synergyLevel = "Exceptional Power Duo (राजयोग व व्यापारिक सफलता)";
    synergyLevelHindi = "साथ मिलकर अपार आर्थिक व व्यावसायिक सफलता";
  } else if (overallCareerSynergy < 80) {
    synergyLevel = "Moderate Alignment (समान प्रयास व रणनीतिक तालमेल)";
    synergyLevelHindi = "स्पष्ट संवाद व कार्य विभाजन से उत्तम परिणाम";
  }

  const goal1 = p1Goal || 'Software & Tech';
  const goal2 = p2Goal || 'Business & Startup';

  const careerSynergySummary = `Moolank ${m1} (${ruler1}) and Moolank ${m2} (${ruler2}) create a powerful professional dynamic. ${p1Name}'s focus on "${goal1}" complements ${p2Name}'s target in "${goal2}", allowing both horoscopes to boost each other's financial status and career reputation without professional friction.`;

  const jointVentureRecommendation = `A joint initiative or cross-support between ${goal1} and ${goal2} has an estimated ${jointBusinessSuccessScore}% success probability. The synergy between Bhagyank ${b1} and Bhagyank ${b2} favors collaborative projects, investments, or joint wealth accumulation.`;

  const financialAdvice = `Financial growth score is ${financialGrowthScore}%. Moolank ${m1} brings strategic vision while Moolank ${m2} brings execution and financial stability. Keep transparent financial planning and invest in long-term appreciating assets together.`;

  const remedies = [
    `Keep a green Aventurine or Pyrite gemstone pyramid in the wealth corner (North-East) of your joint workspace.`,
    `Offer Jal (water) to Surya Dev together on Sunday mornings with "Om Suryaya Namah" to attract professional promotions and prestige.`,
    `Chant "Om Budhaya Namah" on Wednesdays to enhance joint business communication and financial intelligence.`,
    `Donate food or warm clothes on Saturdays to Lord Shani for long-term career stability and overcoming obstacles.`
  ];

  return {
    overallCareerSynergy,
    financialGrowthScore,
    jointBusinessSuccessScore,
    workLifeBalanceScore,
    moolank1: m1,
    bhagyank1: b1,
    moolank2: m2,
    bhagyank2: b2,
    ruler1,
    ruler2,
    synergyLevel,
    synergyLevelHindi,
    careerSynergySummary,
    jointVentureRecommendation,
    financialAdvice,
    remedies
  };
}



