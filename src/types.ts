export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  pin?: string; // 4-digit Security PIN for account access verification
  gender: 'male' | 'female' | 'other';
  dob: string; // YYYY-MM-DD
  tob: string; // HH:MM
  pob: string; // City, Country
  availableMinutes: number;
  totalRechargedMinutes: number;
  createdAt: string;
}

export interface PlanetPosition {
  name: string;
  symbol: string;
  rashi: string;
  rashiHindi: string;
  house: number;
  degree: string;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  status: 'Exalted' | 'Debilitated' | 'Own House' | 'Friendly' | 'Neutral';
}

export interface KundaliChartData {
  lagnaRashi: string;
  lagnaRashiHindi: string;
  moonRashi: string;
  moonRashiHindi: string;
  sunRashi: string;
  sunRashiHindi: string;
  nakshatra: string;
  pada: number;
  planets: PlanetPosition[];
  houses: { [houseNumber: number]: { rashi: string; planets: string[] } };
  navamshaHouses: { [houseNumber: number]: { rashi: string; planets: string[] } };
  doshas: {
    manglik: { present: boolean; severity: 'Low' | 'Medium' | 'High' | 'None'; description: string };
    kaalSarp: { present: boolean; type: string; description: string };
    sadeSati: { present: boolean; phase: string; description: string };
    pitraDosha: { present: boolean; description: string };
  };
  dasha: {
    currentMahadasha: string;
    currentAntardasha: string;
    endDate: string;
    upcomingDashas: { planet: string; startYear: number; endYear: number }[];
  };
}

export interface NumerologyData {
  moolank: number; // Driver
  bhagyank: number; // Conductor
  namank: number; // Name number
  rulingPlanet: string;
  rulingPlanetHindi: string;
  traits: string[];
  luckyNumbers: number[];
  luckyColors: string[];
  luckyDays: string[];
  luckyGemstone: string;
  favorableDirections: string[];
  compatibilityNumbers: { best: number[]; neutral: number[]; avoid: number[] };
}

export interface AshtaKootaScore {
  varna: { score: number; max: number; description: string };
  vashya: { score: number; max: number; description: string };
  tara: { score: number; max: number; description: string };
  yoni: { score: number; max: number; description: string };
  maitri: { score: number; max: number; description: string };
  gana: { score: number; max: number; description: string };
  bhakoot: { score: number; max: number; description: string };
  nadi: { score: number; max: number; description: string };
  totalScore: number;
  percentage: number;
  verdict: 'Excellent Match' | 'Good Match' | 'Average Match' | 'Not Recommended';
}

export interface RechargePlan {
  id: string;
  minutes: number;
  priceINR: number;
  originalPriceINR: number;
  discountPercentage: number;
  badge?: string;
  popular?: boolean;
}

export interface RechargeTransaction {
  id: string;
  userId: string;
  userName: string;
  minutesAdded: number;
  amountPaid: number;
  type: 'SELF_PURCHASE' | 'ADMIN_GRANT';
  method: string;
  grantedBy?: string;
  note?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'astrologer';
  text: string;
  timestamp: string;
}

export interface UserActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

