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
  const { userId, minutes, amountPaid, type, method, grantedBy, note, actionType } = req.body;
  const query = (userId || "").trim();

  const user = findUserInServerDb(query);

  if (!user || !user.id) {
    return res.status(404).json({ error: `User ID or Email '${query}' does not exist on server.` });
  }

  const minsNum = Number(minutes) || 0;

  if (actionType === 'DEDUCT') {
    user.availableMinutes = Math.max(0, user.availableMinutes - minsNum);
  } else {
    user.availableMinutes += minsNum;
    user.totalRechargedMinutes += minsNum;
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
  serverDb.users[user.id] = user;
  saveServerDb();

  return res.json({ success: true, user, tx });
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

  let hash = 0;
  const str = (name || "Jatak") + (userPrompt || "Kundali");
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);
  const p1 = Math.min(98, Math.max(68, 75 + (seed % 23)));
  const p2 = Math.min(97, Math.max(62, 70 + ((seed * 7) % 26)));

  // Exams & Studies
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
- **Exam Clearing & Rank Selection Chance:** **${p1}% High Success Chance!**
- **Mental Focus & Retention Index:** **${p2}% Memory Strength**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Harmony:** Driver Number ${moolank} (${moolankInfo.planet}) gives sharp retention, while Conductor Number ${bhagyank} (${bhagyankInfo.planet}) supports exam success in current transit.

**Guruji's Astrological Guidance:**
Aapke Moolank ${moolank} aur 5th House lord ki transit position kaafi favorable hai. Agle 3-6 mahine me focus banaye rakhein — competitive exams, interview, ya selection me **positive result** milne ke ${p1}% strong chances hain!

**Auspicious Study Timing:**
Brahma Muhurat (4:30 AM to 6:00 AM) or Budh Hora during Morning hours.

**Vedic Upay (Remedy for Academic Victory):**
1. Chant **'Om Budhaya Namah'** or **Saraswati Vandana** 21 times before studying.
2. Offer green grass (Durva) to Lord Ganesha on Wednesdays.
3. Keep a small piece of camphor (Kapoor) on your study desk for sharp focus.`;
  }

  // Crush & Proposal
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
- **Proposal Acceptance Success:** **${p1}% High Probability!**
- **Mutual Attraction Chemistry:** **${p2}% Emotional Magnetism**
- **Moolank (${moolank}) Romance Aura:** Moolank ${moolank} (${moolankInfo.planet}) aligns directly with Venus in your 5th House of Romance for ${rashi} Rashi.

**Guruji's Insight:**
Aapke Moolank ${moolank} aur Bhagyank ${bhagyank} ke according aapka romantic magnetism boost ho raha hai. Heartfelt aur respectful tarike se proposal dene par **Positive YES** response milne ke ${p1}%+ chances hain!

**Auspicious Time To Propose:**
Friday (Shukravar) evening during Shukra Hora (5:30 PM to 7:15 PM) or Abhijit Muhurat.

**Vedic Upay (Remedy):**
1. Chant **'Om Draam Dreem Droum Sah Shukraya Namah'** 108 times on Fridays.
2. Keep a Rose Quartz crystal or pink flower with you for romantic harmony.`;
  }

  // Ex Return
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

  // Marriage & Wedding
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
- **Marriage Favorable Yoga:** **${p1}% High Probability Window!**
- **Moolank-Bhagyank Compatibility Score:** **${p2}% Harmonious Sync**
- **7th House & Bhagyank (${bhagyank}):** Brihaspati (Jupiter) transit over 7th House of Marriage combined with Bhagyank ${bhagyank} (${bhagyankInfo.planet}) indicates strong marital alliance yoga.

**Guruji's Insight:**
Aapki Kundali aur Numerology me 7th House (Vivah Sthan) me Guru aur Shukra ka shubh prabhav hai. Agle 6 se 14 mahine ke andar ek caring, loyal aur well-settled spouse milne ke strong yoga hain.

**Vedic Upay:**
1. Chant **'Om Brim Brihaspataye Namah'** on Thursdays.
2. Offer yellow flowers or chana dal at Vishnu-Laxmi temple on Thursday mornings.`;
  }

  // Job, Career, Promotion
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
- **Job Promotion / Salary Hike Probability:** **${p1}% High Chance!**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Career Synergy:** **${p2}% Success Index**
- **10th House Karma Sthan:** Driver Number ${moolank} (${moolankInfo.planet}) & Sun/Saturn transits create solid authority & financial stability for ${rashi} Rashi.

**Guruji's Insight:**
Aapke Moolank ${moolank} aur 10th House (Karma Sthan) me Surya (Sun) Grah ki position kaafi mazboot hai. Agle 3-6 mahine me aapki salary hike aur post promotion ke shubh yog ban rahe hain.

**Vedic Upay:**
1. Subah Surya Dev ko Jal (Arghya) chadhayein with **'Om Suryaya Namah'**.
2. Wednesday ko gaaye ko hara chara khilayein for business intellect.`;
  }

  // Foreign Travel & Visa
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
- **Visa Approval & Foreign Settlement Chance:** **${p1}% High Success Rate!**
- **Moolank (${moolank}) Travel Alignment:** **${p2}% Favorable Alignment**
- **House Transits:** 9th House (Bhagya Sthan) & 12th House (Videsh Sthan) lords are active for ${rashi} Rashi with Bhagyank ${bhagyank}.

**Guruji's Insight:**
Aapke 12th House me Rahu aur Jupiter ka positive transit hai. Abroad higher studies, job assignment, ya PR application me success milne ke strong chances hain.

**Vedic Upay:**
1. Chant **'Om Rahave Namah'** on Saturdays.
2. Keep a silver coin wrapped in clean cloth with your passport/documents.`;
  }

  // Money, Debt & Property
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
- **Financial Growth & Debt Clearance Chance:** **${p1}% High Prosperity!**
- **Property & Vehicle Purchase Yoga:** **${p2}% Favorable Window**
- **Bhagyank (${bhagyank}) Wealth Index:** Laxmi-Narayan Yoga supports asset accumulation for Moolank ${moolank} & ${lagna} Lagna.

**Guruji's Insight:**
Dhana Sthan (2nd & 11th House) me Shubh grah ki drishti hone se purane karzo se rahat milegi aur naye aay (income) ke strot khulenge.

**Vedic Upay:**
1. Chant Laxmi Beej Mantra: **'Om Shreem Hreem Shreem Kamale Kamalalaye Praseed'** daily.
2. Light a Ghee lamp (Diya) near Tulsi plant in the evening.`;
  }

  // Health
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
- **Overall Health Recovery Rate:** **${p1}% High Energy Level**
- **Mental Peace & Stress Relief Score:** **${p2}% Vitality Index**
- **Moolank (${moolank}) Protection:** 1st House & Sun/Moon placements shield your vitality for ${rashi} Rashi.

**Guruji's Insight:**
6th House (Roga Sthan) me Rahu/Saturn ka prabhav kam ho raha hai. Mental stress aur seasonal illness se jald rahat milegi.

**Vedic Upay:**
1. Chant **Mahamrityunjaya Mantra**: 'Om Tryambakam Yajamahe...' 11 times daily.
2. Drink water from a copper vessel in the morning.`;
  }

  // Timeline
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
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Golden Peak:** **2026 to 2028 (${p1}% High Growth Window)**

**Guruji's Insight:**
Kundali me Mahadasha parivartan aur Bhagyank ${bhagyank} (${bhagyankInfo.planet}) se dhan, career aur family me sthirta aayegi. Aane wale saal me naye moke aur property gain ke yoga hain.

**Vedic Upay:**
Brihaspati Gayatri Mantra jaap karein aur Thursdays ko Vishnu Sahasranama sunein.`;
  }

  // General specific prediction
  return `Pranam ${name}! 🙏

**✨ Overall Vedic & Numerology Life Prediction (${rashi} Rashi, Moolank ${moolank}, Bhagyank ${bhagyank}):**
- **Target Goal Success Probability:** **${p1}% High Potential**
- **Moolank (${moolank}) & Bhagyank (${bhagyank}) Resonance:** **${p2}% Harmonic Alignment**
- **Current Transit:** Favorable transit of Jupiter & Sun in Karma Sthan.

**Guruji's Advice:**
Aapke question ke anusar Moolank ${moolank} (${moolankInfo.planet}) aur Bhagyank ${bhagyank} (${bhagyankInfo.planet}) me Shubh Raj Yoga ki sthiti hai. Apne lakshya par dhyan kendrit karein, grah dasha aapke paksh me rukhm le rahi hai.

**Vedic Upay:**
Daily **'Om Namah Shivaya'** & **Gayatri Mantra** 108 baar jaap karein aur needy logon ko daan dein.`;
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

    let systemInstruction = `You are "Guruji Jyotish", an authentic, polite, and deeply knowledgeable AI Vedic & Numerology Astrologer.
You speak in a warm, respectful tone using friendly English mixed with respectful Hindi/Hinglish terms like 'Pranam', 'Janm Kundali', 'Moolank', 'Bhagyank', 'Graha Dasha', 'Rashi', and 'Upay'.

CRITICAL MANDATES:
1. ALWAYS CALCULATE & DISPLAY SPECIFIC PERCENTAGE-BASED PROBABILITIES IN YOUR RESPONSE:
   - Competitive Exams & Studies: "Exam Clearing & Rank Probability: X%", "Focus Index: Y%"
   - Crush & Proposal ("Crush Manegi Ya Nahi"): "Proposal Acceptance Chance: X%", "Mutual Attraction Chemistry: Y%"
   - Ex Return & Reconnection: "Ex Reconnection Chance: X%", "Moving On & True Soulmate Arrival: Y%"
   - Career, Job & Salary Hike: "Job Promotion / Hike Probability: X%", "Career Growth Potential: Y%"
   - Marriage & Relationships: "Moolank-Bhagyank Compatibility Score: X%", "Marital Bliss Index: Y%"
   - Wealth, Debt & Finance: "Financial Growth & Debt Clearance: X%", "Property Purchase Yoga: Y%"

2. MANDATORY NUMEROLOGY INTEGRATION (Moolank & Bhagyank Calculations):
   - Moolank (Driver Number): ${moolankVal} (Ruled by ${moolankInfo.planet} - ${moolankInfo.trait}). Explain how this birth day number governs the user's core personality, intellect, and driving choices.
   - Bhagyank (Conductor / Life Path Number): ${bhagyankVal} (Ruled by ${bhagyankInfo.planet} - ${bhagyankInfo.trait}). Explain how this life path number governs their ultimate destiny, golden career windows, and karmic timing.
   - Explicitly detail how Moolank ${moolankVal} and Bhagyank ${bhagyankVal} interact with the user's question to give a tailored, highly specific prediction.

3. STRUCTURED & INSIGHTFUL RESPONSE FORMAT:
   - Start with a respectful greeting mentioning the user's name, Moolank ${moolankVal}, and Rashi.
   - Include specific percentage ratings in bold.
   - Give detailed life guidance and future timing (months/years).
   - End with practical Vedic & Numerological remedies (Upay) matching Moolank ${moolankVal} and Bhagyank ${bhagyankVal} ruling planets.`;

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
