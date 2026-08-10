import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-Side Database File Persistence
const DB_FILE_PATH = path.join(process.cwd(), "astroveda_server_db.json");

interface ServerDbData {
  users: { [id: string]: any };
  transactions: any[];
  activities: any[];
}

function loadServerDb(): ServerDbData {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to load server DB file, initializing defaults:", err);
  }

  const defaultDb: ServerDbData = {
    users: {
      '880101': {
        id: '880101',
        name: 'Rahul Sharma',
        pin: '1234',
        gender: 'male',
        dob: '1996-08-15',
        tob: '10:30',
        pob: 'New Delhi, India',
        availableMinutes: 15,
        totalRechargedMinutes: 15,
        createdAt: new Date().toISOString()
      },
      '904212': {
        id: '904212',
        name: 'Priya Patel',
        pin: '1234',
        gender: 'female',
        dob: '1998-11-23',
        tob: '18:45',
        pob: 'Ahmedabad, India',
        availableMinutes: 30,
        totalRechargedMinutes: 30,
        createdAt: new Date().toISOString()
      }
    },
    transactions: [
      {
        id: 'tx_init_1',
        userId: '880101',
        userName: 'Rahul Sharma',
        minutesAdded: 15,
        amountPaid: 0,
        type: 'ADMIN_GRANT',
        method: 'Welcome Bonus',
        grantedBy: 'Guruji Admin',
        note: 'Initial Registration Bonus Minutes',
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ],
    activities: []
  };

  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), "utf-8");
  } catch (e) {
    console.error("Could not write initial DB file:", e);
  }

  return defaultDb;
}

let serverDb: ServerDbData = loadServerDb();

function saveServerDb() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(serverDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save server DB file:", err);
  }
}

// Server-side Gemini AI client initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// User DB API Routes
app.get("/api/users", (_req, res) => {
  res.json(serverDb.users);
});

// Bulk sync endpoint to merge local storage users with server DB
app.post("/api/users/sync", (req, res) => {
  const { users } = req.body || {};
  if (users && typeof users === 'object') {
    let hasChanges = false;
    for (const [id, u] of Object.entries(users)) {
      if (!u || typeof u !== 'object') continue;
      const cleanId = (id || (u as any).id || "").trim().toUpperCase();
      if (!cleanId) continue;

      if (!serverDb.users[cleanId]) {
        serverDb.users[cleanId] = { ...(u as any), id: cleanId };
        hasChanges = true;
      } else {
        // Preserve higher minutes or merge updated profile info
        const existing = serverDb.users[cleanId];
        const localUser = u as any;
        const mergedMins = Math.max(existing.availableMinutes || 0, localUser.availableMinutes || 0);
        const mergedTotal = Math.max(existing.totalRechargedMinutes || 0, localUser.totalRechargedMinutes || 0);
        serverDb.users[cleanId] = {
          ...existing,
          ...localUser,
          id: cleanId,
          availableMinutes: mergedMins,
          totalRechargedMinutes: mergedTotal
        };
        hasChanges = true;
      }
    }
    if (hasChanges) {
      saveServerDb();
    }
  }
  return res.json({ success: true, users: serverDb.users });
});

// Flexible user lookup helper across server DB
function findUserInServerDb(query: string): any | null {
  if (!query || !query.trim()) return null;
  const cleanTrim = query.trim();
  const cleanUpper = cleanTrim.toUpperCase();
  const cleanLower = cleanTrim.toLowerCase();
  const digitsOnly = cleanTrim.replace(/\D/g, '');

  const allUsers = Object.values(serverDb.users).filter(Boolean);

  // 1. Direct key or user.id exact match
  for (const user of allUsers) {
    if (user.id && String(user.id).trim().toUpperCase() === cleanUpper) return user;
  }
  for (const [key, user] of Object.entries(serverDb.users)) {
    if (String(key).trim().toUpperCase() === cleanUpper) return user;
  }

  // 2. Numeric ID match (e.g. "880101" vs "USER-880101" or numeric string)
  if (digitsOnly.length >= 4) {
    for (const user of allUsers) {
      if (user.id && String(user.id).replace(/\D/g, '') === digitsOnly) return user;
    }
  }

  // 3. Email match (exact case-insensitive)
  for (const user of allUsers) {
    if (user.email && String(user.email).trim().toLowerCase() === cleanLower) return user;
  }

  // 4. Phone / Mobile match
  for (const user of allUsers) {
    if (user.phone && String(user.phone).trim() === cleanTrim) return user;
  }

  // 5. Name match (exact case-insensitive)
  for (const user of allUsers) {
    if (user.name && String(user.name).trim().toLowerCase() === cleanLower) return user;
  }

  // 6. Name partial / includes match
  for (const user of allUsers) {
    if (user.name && String(user.name).trim().toLowerCase().includes(cleanLower)) return user;
  }

  return null;
}

app.get("/api/users/:id", (req, res) => {
  const query = (req.params.id || "").trim();
  const user = findUserInServerDb(query);

  if (!user) {
    return res.status(404).json({ error: `User ID or Email '${query}' does not exist on server database.` });
  }
  return res.json(user);
});

app.post("/api/users/login", (req, res) => {
  const { userId, pin } = req.body;
  const query = (userId || "").trim();

  if (!query) {
    return res.status(400).json({ error: "Please enter your User ID or Email." });
  }

  const user = findUserInServerDb(query);

  if (!user) {
    return res.status(404).json({
      error: `Account '${query}' not found on server database. Please check your 6-digit User ID or Email, or create a new account.`
    });
  }

  const userPin = String(user.pin || '1234').trim();
  const inputPin = String(pin || '').trim();

  if (inputPin !== userPin) {
    return res.status(401).json({ error: `Incorrect Security PIN / Password! Please enter the correct PIN for ${user.name} (${user.id}).` });
  }

  return res.json({ success: true, user });
});

app.post("/api/users/create", (req, res) => {
  const { id, name, email, dob, tob, pob, gender, pin, initialMinutes, availableMinutes, totalRechargedMinutes } = req.body;

  if (!name || !name.trim() || !/[a-zA-Z]/.test(name)) {
    return res.status(400).json({ error: "Name must contain valid alphabetic letters." });
  }

  let formattedId = (id || "").trim().toUpperCase();

  if (formattedId) {
    const existing = findUserInServerDb(formattedId);
    if (existing) {
      // If user already exists on server, update it if pins match
      if (pin && existing.pin && pin.trim() === existing.pin.trim()) {
        const targetId = existing.id || formattedId;
        serverDb.users[targetId] = {
          ...existing,
          name: name.trim(),
          email: email || existing.email || '',
          dob: dob || existing.dob,
          tob: tob || existing.tob,
          pob: pob || existing.pob,
          gender: gender || existing.gender
        };
        saveServerDb();
        return res.json({ success: true, user: serverDb.users[targetId] });
      }
      return res.status(400).json({
        error: `User ID '${formattedId}' ALREADY EXISTS (${existing.name})! Please log in with Security PIN.`
      });
    }
  }

  if (!formattedId) {
    do {
      formattedId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (serverDb.users[formattedId]);
  }

  const mins = typeof availableMinutes === 'number'
    ? availableMinutes
    : (typeof initialMinutes === 'number' ? initialMinutes : 2);

  const newUser = {
    id: formattedId,
    name: name.trim(),
    email: email || '',
    pin: (pin || '1234').trim(),
    gender: gender || 'male',
    dob: dob || '1998-01-01',
    tob: tob || '12:00',
    pob: pob || 'New Delhi, India',
    availableMinutes: mins,
    totalRechargedMinutes: typeof totalRechargedMinutes === 'number' ? totalRechargedMinutes : mins,
    createdAt: new Date().toISOString()
  };

  serverDb.users[formattedId] = newUser;
  saveServerDb();

  return res.json({ success: true, user: newUser });
});

app.post("/api/users/update", (req, res) => {
  const { userId, updates } = req.body;
  const query = (userId || "").trim();

  const user = findUserInServerDb(query);

  if (!user || !user.id) {
    return res.status(404).json({ error: `User ID or Email '${query}' not found on server.` });
  }

  serverDb.users[user.id] = { ...serverDb.users[user.id], ...updates };
  saveServerDb();

  return res.json({ success: true, user: serverDb.users[user.id] });
});

app.post("/api/users/deduct-minute", (req, res) => {
  const { userId } = req.body;
  const query = (userId || "").trim();

  const user = findUserInServerDb(query);

  if (!user || !user.id) {
    return res.status(404).json({ error: `User ID '${query}' not found.` });
  }

  if (user.availableMinutes <= 0) {
    return res.json({ hasMinutes: false, remainingMinutes: 0, user });
  }

  user.availableMinutes = Math.max(0, user.availableMinutes - 1);
  serverDb.users[user.id] = user;
  saveServerDb();

  return res.json({
    hasMinutes: user.availableMinutes > 0,
    remainingMinutes: user.availableMinutes,
    user
  });
});

app.post("/api/users/recharge", (req, res) => {
  const { userId, minutes, amountPaid, type, method, grantedBy, note, actionType, userProfile } = req.body;
  const query = (userId || "").trim();

  let user = findUserInServerDb(query);

  const minsNum = Number(minutes) || 0;

  // Auto-create/upsert user if not found on server database
  if (!user || !user.id) {
    let targetId = query.toUpperCase();
    if (!targetId || targetId === 'NEW-PROFILE') {
      do {
        targetId = Math.floor(100000 + Math.random() * 900000).toString();
      } while (serverDb.users[targetId]);
    }

    user = {
      id: targetId,
      name: userProfile?.name || (userProfile?.email ? userProfile.email.split('@')[0] : `Astro Client ${targetId}`),
      email: userProfile?.email || '',
      pin: userProfile?.pin || '1234',
      gender: userProfile?.gender || 'male',
      dob: userProfile?.dob || '1998-01-01',
      tob: userProfile?.tob || '12:00',
      pob: userProfile?.pob || 'New Delhi, India',
      availableMinutes: actionType === 'DEDUCT' ? 0 : minsNum,
      totalRechargedMinutes: actionType === 'DEDUCT' ? 0 : minsNum,
      createdAt: new Date().toISOString()
    };
    serverDb.users[targetId] = user;
  } else {
    if (actionType === 'DEDUCT') {
      user.availableMinutes = Math.max(0, (user.availableMinutes || 0) - minsNum);
    } else {
      user.availableMinutes = (user.availableMinutes || 0) + minsNum;
      user.totalRechargedMinutes = (user.totalRechargedMinutes || 0) + minsNum;
    }
    serverDb.users[user.id] = user;
  }

  const tx = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: user.id,
    userName: user.name,
    minutesAdded: actionType === 'DEDUCT' ? -minsNum : minsNum,
    amountPaid: amountPaid || 0,
    type: type || 'SELF_PURCHASE',
    method: method || 'UPI / Payment Gateway',
    grantedBy: grantedBy || '',
    note: note || '',
    timestamp: new Date().toISOString()
  };

  serverDb.transactions.unshift(tx);
  saveServerDb();

  return res.json({ success: true, user: serverDb.users[user.id], tx });
});

app.delete("/api/users/:id", (req, res) => {
  const query = (req.params.id || "").trim();
  const user = findUserInServerDb(query);
  if (!user || !user.id) {
    return res.status(404).json({ error: `User ID '${query}' not found.` });
  }
  const deletedName = user.name;
  const deletedId = user.id;
  delete serverDb.users[deletedId];
  saveServerDb();
  return res.json({ success: true, message: `Deleted user ${deletedName} (${deletedId})` });
});

app.get("/api/transactions", (_req, res) => {
  res.json(serverDb.transactions);
});

app.get("/api/activities", (_req, res) => {
  res.json(serverDb.activities);
});

app.post("/api/activities", (req, res) => {
  const { userId, userName, action, details } = req.body;
  const log = {
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    userId: (userId || "").trim().toUpperCase(),
    userName: (userName || "").trim(),
    action: action || "Activity",
    details: (details || "").trim(),
    timestamp: new Date().toISOString()
  };
  serverDb.activities.unshift(log);
  if (serverDb.activities.length > 500) {
    serverDb.activities = serverDb.activities.slice(0, 500);
  }
  saveServerDb();
  return res.json({ success: true, log });
});

// AI Kundali Deep Analysis Endpoint
app.post("/api/ai/kundali-reading", async (req, res) => {
  try {
    const { name, dob, tob, pob, gender, rashi, lagna, planets } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    const prompt = `
You are a highly revered Vedic Astrologer (Guruji Jyotish) with 40 years of experience in Vedic Parashari Astrology.
Analyze the following birth chart (Kundali) details for ${name}:

- Name: ${name}
- Gender: ${gender}
- Date of Birth: ${dob}
- Time of Birth: ${tob}
- Place of Birth: ${pob}
- Moon Sign (Rashi): ${rashi}
- Ascendant (Lagna): ${lagna}
- Key Planetary Placements: ${JSON.stringify(planets || [])}

Provide a detailed, respectful, authentic Vedic Kundali Life Prediction in a mix of clear English and Hindi/Hinglish terms (e.g., Mahadasha, Graha Drishti, Shubh Yoga, Upay, Remedy).
Structure your response in markdown format with clear headings:

### 1. Overall Personality & Lagna Energy
### 2. Career & Financial Outlook (Dhana & Raj Yogas)
### 3. Marriage, Relationships & Compatibility
### 4. Health, Peace of Mind & Spiritual Path
### 5. Present Dasha & Key Planetary Transits
### 6. Powerful Vedic Remedies (Upay) & Gemstone Advice

Keep the tone warm, deeply insightful, encouraging, and accurate to Vedic astrology principles.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Guruji, an authentic and compassionate expert Vedic Astrologer.",
        temperature: 0.7,
      },
    });

    return res.json({ reading: response.text });
  } catch (error: any) {
    console.error("Error generating Kundali reading:", error);
    return res.status(500).json({ error: error.message || "Failed to generate Kundali reading" });
  }
});

// AI Daily Rashifal Endpoint
app.post("/api/ai/rashifal", async (req, res) => {
  try {
    const { rashi, panchang } = req.body;
    const rashiName = typeof rashi === 'string' ? rashi : rashi?.english || 'Aries';
    const rashiHindi = rashi?.hindi || rashiName;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    const prompt = `
You are Guruji, an expert Vedic Astrologer providing today's authentic Daily Rashifal (Aaj Ka Rashifal) for ${rashiName} (${rashiHindi}).
Panchang Details for Today:
- Date: ${panchang?.date || 'Today'}
- Tithi: ${panchang?.tithi || 'Shukla Paksha'}
- Nakshatra: ${panchang?.nakshatra || 'Pushya'}
- Moon Sign: ${panchang?.moonSign || 'Transit Moon'}
- Rahu Kalam: ${panchang?.rahuKalam || '1:30 PM - 3:00 PM'}

Provide a deep, highly specific, inspiring, and authentic Vedic Rashifal prediction for ${rashiName} (${rashiHindi}).
Structure with bullet points in markdown:

### ✨ Guruji Daily ${rashiName} (${rashiHindi}) Rashifal & Transit Guidance:
- **❤️ Love & Relationships:** Specific guidance on romantic alignment, communication, and emotional harmony.
- **💼 Career & Business:** Precise advice on workplace productivity, key meetings, and business growth.
- **💰 Wealth & Money:** Financial opportunities, investment warnings during Rahu Kalam, and money flow.
- **🌿 Health & Energy:** Wellness advice, stamina management, and dietary/mental care.
- **🌟 Lucky Elements:** Lucky Color, Lucky Number, and Peak Lucky Hours today.
- **🕉️ Powerful Vedic Remedy (Upay):** A simple, actionable mantra or ritual (e.g. Arghya, Chalisa, Daan).

Keep the language warm, respectful, deeply astrologically accurate to ${rashiName}, and easy to understand.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Guruji, a wise and respected Vedic Astrologer.",
        temperature: 0.7,
      },
    });

    return res.json({ reading: response.text });
  } catch (error: any) {
    console.error("Error generating Rashifal:", error);
    return res.status(500).json({ error: error.message || "Failed to generate Rashifal" });
  }
});

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

const NUMEROLOGY_PLANETS: { [key: number]: { planet: string; planetHindi: string; lord: string; trait: string } } = {
  1: { planet: 'Sun (Surya)', planetHindi: 'सूर्य', lord: 'Leadership, Authority & Willpower', trait: 'Ambitious, Independent & Dynamic' },
  2: { planet: 'Moon (Chandra)', planetHindi: 'चंद्रमा', lord: 'Mind, Emotions & Intuition', trait: 'Creative, Sensitive & Diplomatic' },
  3: { planet: 'Jupiter (Guru)', planetHindi: 'बृहस्पति', lord: 'Wisdom, Knowledge & Education', trait: 'Wise, Expressive & Optimistic' },
  4: { planet: 'Rahu', planetHindi: 'राहु', lord: 'Ambition, Innovation & Quick Gains', trait: 'Sharp, Practical & Growth-Driven' },
  5: { planet: 'Mercury (Budh)', planetHindi: 'बुध', lord: 'Intellect, Communication & Business', trait: 'Versatile, Fast-Learner & Communicative' },
  6: { planet: 'Venus (Shukra)', planetHindi: 'शुक्र', lord: 'Love, Romance, Wealth & Luxury', trait: 'Charming, Artistic & Wealthy' },
  7: { planet: 'Ketu', planetHindi: 'केतु', lord: 'Intuition, Mysticism & Deep Research', trait: 'Analytical, Philosophical & Intuitive' },
  8: { planet: 'Saturn (Shani)', planetHindi: 'शनि', lord: 'Karma, Hard Work & Discipline', trait: 'Resilient, Dedicated & Structured' },
  9: { planet: 'Mars (Mangal)', planetHindi: 'मंगल', lord: 'Courage, Energy & Action', trait: 'Bold, High-Energy & Determined' }
};

// Helper for fallback chat replies when Gemini API key is missing or encounters errors
function generateFallbackChatReply(userPrompt: string, kundaliContext: any): string {
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

  let hash = 0;
  const str = (name || "Jatak") + (userPrompt || "Kundali");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const p1 = Math.min(98, Math.max(65, 72 + (seed % 24)));
  const p2 = Math.min(96, Math.max(60, 68 + ((seed * 7) % 27)));

  // 1. EXAMS & STUDIES
  if (/exam|clear|pass|result|upsc|ssc|jee|neet|bank|study|padhai|test|rank|college/i.test(lower)) {
    let reply = `Pranam ${name}! 📚✨

Aapke exam aur padhai ke sawal ke liye aapki Janm Kundali (${rashi} Rashi, ${lagna} Lagna) aur Numerology (Moolank ${moolank}, Bhagyank ${bhagyank}) ka gahan vishleshana:

• **5th House (Vidya & Buddhi Sthan) & Budh Grah Alignment:**
  Moolank ${moolank} (${moolankInfo.planet}) aapke retention aur focus ko drive karta hai. Present transit me 5th House lord aur Mercury (Budh) ki position favorable timing darsha rahi hai.

• **Success Chance & Focus Index:**
  Current planetary period ke hisab se competitive exams aur selection me **${p1}% High Probability** ban rahi hai. Memory focus index **${p2}%** hai.

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
  Respectful aur genuine tarike se feelings express karne par positive response milne ke **${p1}% chances** hain. Emotional attraction score **${p2}%** hai.

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
  Agle 6 se 14 mahine ke dauran ek caring, well-settled aur understanding life partner milne ka **${p1}% strong yoga** hai.

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
  Agle 3 se 6 mahine me career transition, promotion, ya salary hike ka **${p1}% high chance** hai.

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
  Foreign assignment, higher education ya PR application me success ka **${p1}% high probability** hai.`;

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
  Current planetary transits me aapke maamle me positive outcome ke **${p1}% favorable chances** hain.

• **Guruji's Perspective:**
  Patience aur consistent effort banaye rakhein, grah dasha aapke paksh me rukh mod rahi hai.`;

  if (wantsRemedy) {
    reply += `\n\n**Vedic Upay (General Energy Alignment):**
1. Daily **'Om Namah Shivaya'** ka 108 baar jaap karein.
2. Rozana subah Surya Dev ko arghya arpit karein.`;
  }
  return reply;
}

// AI Astrologer Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { userPrompt, kundaliContext, chatHistory } = req.body;

  const dob = kundaliContext?.dob || "";
  const moolankVal = kundaliContext?.moolank || computeMoolank(dob);
  const bhagyankVal = kundaliContext?.bhagyank || computeBhagyank(dob);
  const moolankInfo = NUMEROLOGY_PLANETS[moolankVal] || NUMEROLOGY_PLANETS[1];
  const bhagyankInfo = NUMEROLOGY_PLANETS[bhagyankVal] || NUMEROLOGY_PLANETS[1];

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, using smart fail-safe astrologer engine.");
      return res.json({ reply: generateFallbackChatReply(userPrompt, { ...kundaliContext, moolank: moolankVal, bhagyank: bhagyankVal }) });
    }

    let systemInstruction = `You are "Guruji Jyotish", an authentic, highly respected, and deeply knowledgeable AI Vedic & Numerology Astrologer.
You speak in a warm, polite, empathetic tone using a natural mix of English and Hindi/Hinglish terms (e.g. 'Pranam', 'Janm Kundali', 'Moolank', 'Bhagyank', 'Graha Dasha', 'Rashi').

CRITICAL RULES AND MANDATES FOR GURUJI:
1. DEEP, DIRECT, & REALISTIC ANALYSIS (NO CANNED TEMPLATES):
   - Listen carefully to the user's specific question. Provide an authentic, customized astrological analysis based on their query and birth details.
   - DO NOT use repetitive copy-paste headers or force identical percentage lists in every response.
   - Speak naturally like a real human astrologer. Analyze relevant houses (1st, 2nd, 5th, 7th, 10th, 12th, etc.), planetary transits (Jupiter, Saturn, Rahu-Ketu), and Dasha periods related to their exact question.
   - Vary your structure and tone naturally so every conversation feels unique, genuine, and deeply personal.

2. STRICT RULE ON REMEDIES (UPAY / GEMSTONES / MANTRAS):
   - ABSOLUTELY DO NOT PROVIDE REMEDIES, UPAY, GEMSTONES, OR MANTRAS UNLESS THE USER EXPLICITLY ASKS FOR THEM in their message (e.g. asking "upay batao", "remedy please", "gemstone", "kaise theek karein", "totka", "solution", "mantra", "kya karein").
   - If the user DID NOT ask for remedies/upay, DO NOT include any 'Vedic Upay' or 'Remedy' section. End your response after providing deep, thoughtful astrological analysis, practical advice, and timeline guidance.

3. REALISTIC & TAILORED REMEDIES (WHEN EXPLICITLY REQUESTED):
   - If (and ONLY IF) the user explicitly asks for remedies, provide highly specific, realistic, and planet-focused remedies tailored to their specific chart affliction (e.g. Venus/Shukra for love, Sun/Surya for career, Saturn/Shani for discipline, Rahu/Ketu for mental calm, Mercury/Budh for intellect).
   - Avoid generic copy-paste remedies. Provide practical actions, specific deity prayers, or ethical/lifestyle remedies matching the planet in question.`;

    if (kundaliContext) {
      systemInstruction += `\n\nUser Astrological & Numerology Profile:\n- Name: ${kundaliContext.name}\n- Date of Birth: ${kundaliContext.dob}\n- Time of Birth: ${kundaliContext.tob}\n- Place of Birth: ${kundaliContext.pob}\n- Moon Sign (Rashi): ${kundaliContext.rashi}\n- Ascendant (Lagna): ${kundaliContext.lagna}\n- Moolank (Driver Number): ${moolankVal} (Ruled by ${moolankInfo.planet})\n- Bhagyank (Conductor Number): ${bhagyankVal} (Ruled by ${bhagyankInfo.planet})`;
    }

    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((msg: { sender: string; text: string }) => {
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ reply: response.text || generateFallbackChatReply(userPrompt, { ...kundaliContext, moolank: moolankVal, bhagyank: bhagyankVal }) });
  } catch (error: any) {
    console.error("Error in AI Astrologer chat, falling back to local engine:", error);
    return res.json({ reply: generateFallbackChatReply(userPrompt, { ...kundaliContext, moolank: moolankVal, bhagyank: bhagyankVal }) });
  }
});

// AI Compatibility Gun Milan Analysis
app.post("/api/ai/compatibility", async (req, res) => {
  try {
    const { partner1, partner2, gunaScore, mode } = req.body;

    const m1 = partner1?.moolank || computeMoolank(partner1?.dob || "");
    const b1 = partner1?.bhagyank || computeBhagyank(partner1?.dob || "");
    const m2 = partner2?.moolank || computeMoolank(partner2?.dob || "");
    const b2 = partner2?.bhagyank || computeBhagyank(partner2?.dob || "");

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    const prompt = `
As an expert Vedic & Numerology Matchmaking Astrologer (Gun Milan Specialist), provide a deep compatibility and relationship breakdown for:

Partner 1: ${partner1.name} (DOB: ${partner1.dob}, Time: ${partner1.tob || "Unknown"}, Rashi: ${partner1.rashi}, Moolank: ${m1}, Bhagyank: ${b1})
Partner 2: ${partner2.name} (DOB: ${partner2.dob}, Time: ${partner2.tob || "Unknown"}, Rashi: ${partner2.rashi}, Moolank: ${m2}, Bhagyank: ${b2})
Calculated Score / Mode: ${gunaScore} (Mode: ${mode || "Vedic"})

MANDATORY RESPONSE REQUIREMENTS:
1. SPECIFIC PERCENTAGE COMPATIBILITY SCORES:
   - Overall Relationship Harmony Score (%)
   - Moolank (${m1} vs ${m2}) & Bhagyank (${b1} vs ${b2}) Numerology Compatibility (%)
   - Emotional & Romantic Chemistry Score (%)
   - Financial & Career Growth Together Score (%)
2. Detailed Numerology & Vedic Analysis based on Moolank Driver numbers (${m1} & ${m2}) and Bhagyank Life Path numbers (${b1} & ${b2}).
3. Core Strengths, Potential Friction Points, and Auspicious Guidance for long-term marital/relationship success.
4. Vedic & Numerological Remedies (Upay) for any planetary or numerical friction.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Guruji, a master Vedic & Numerology Matchmaker. Always provide specific percentage-based compatibility scores and detailed Moolank/Bhagyank predictions.",
        temperature: 0.7,
      },
    });

    return res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error in compatibility analysis:", error);
    return res.status(500).json({ error: error.message || "Failed to process compatibility analysis" });
  }
});

// AI Numerology Deep Analysis
app.post("/api/ai/numerology", async (req, res) => {
  try {
    const { name, dob, moolank, bhagyank, namank } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    const prompt = `
Provide an in-depth Vedic & Pythogorean Numerology Reading for:
- Name: ${name}
- Date of Birth: ${dob}
- Moolank (Driver / Birth Number): ${moolank}
- Bhagyank (Conductor / Life Path Number): ${bhagyank}
- Namank (Name Number): ${namank}

Detail:
1. Personality & Life Purpose based on Moolank ${moolank} and Bhagyank ${bhagyank} synergy
2. Career paths suited for Moolank ${moolank}
3. Love & Relationship inclination
4. Lucky Numbers, Colors, Gemstones, and Auspicious Days
5. Name Spelling correction analysis if Namank ${namank} is hostile to Moolank ${moolank}
6. Yearly Forecast for 2026
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert Vedic & Western Numerologist.",
        temperature: 0.7,
      },
    });

    return res.json({ reading: response.text });
  } catch (error: any) {
    console.error("Error in numerology reading:", error);
    return res.status(500).json({ error: error.message || "Failed to generate numerology reading" });
  }
});

async function startServer() {
  // Vite middleware for development or static serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AstroVeda Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
