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

app.get("/api/users/:id", (req, res) => {
  const cleanId = (req.params.id || "").trim().toUpperCase();
  const user = serverDb.users[cleanId];
  if (!user) {
    return res.status(404).json({ error: `User ID '${cleanId}' does not exist on server.` });
  }
  return res.json(user);
});

app.post("/api/users/login", (req, res) => {
  const { userId, pin } = req.body;
  const cleanId = (userId || "").trim().toUpperCase();
  const user = serverDb.users[cleanId];

  if (!user) {
    return res.status(404).json({ error: `User ID '${cleanId}' does not exist.` });
  }

  const userPin = user.pin || '1234';
  if ((pin || "").trim() !== userPin.trim()) {
    return res.status(401).json({ error: "Incorrect Security PIN / Password! Access denied." });
  }

  return res.json({ success: true, user });
});

app.post("/api/users/create", (req, res) => {
  const { id, name, email, dob, tob, pob, gender, pin, initialMinutes } = req.body;

  if (!name || !name.trim() || !/[a-zA-Z]/.test(name)) {
    return res.status(400).json({ error: "Name must contain valid alphabetic letters." });
  }

  let formattedId = (id || "").trim().toUpperCase();

  if (formattedId && serverDb.users[formattedId]) {
    return res.status(400).json({
      error: `User ID '${formattedId}' ALREADY EXISTS (${serverDb.users[formattedId].name})! Please log in with Security PIN.`
    });
  }

  if (!formattedId) {
    do {
      formattedId = Math.floor(100000 + Math.random() * 900000).toString();
    } while (serverDb.users[formattedId]);
  }

  const mins = typeof initialMinutes === 'number' ? initialMinutes : 2; // Default 2 welcome minutes for new accounts

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
    totalRechargedMinutes: mins,
    createdAt: new Date().toISOString()
  };

  serverDb.users[formattedId] = newUser;
  saveServerDb();

  return res.json({ success: true, user: newUser });
});

app.post("/api/users/update", (req, res) => {
  const { userId, updates } = req.body;
  const cleanId = (userId || "").trim().toUpperCase();

  if (!serverDb.users[cleanId]) {
    return res.status(404).json({ error: `User ID '${cleanId}' not found.` });
  }

  serverDb.users[cleanId] = { ...serverDb.users[cleanId], ...updates };
  saveServerDb();

  return res.json({ success: true, user: serverDb.users[cleanId] });
});

app.post("/api/users/deduct-minute", (req, res) => {
  const { userId } = req.body;
  const cleanId = (userId || "").trim().toUpperCase();
  const user = serverDb.users[cleanId];

  if (!user) {
    return res.status(404).json({ error: `User ID '${cleanId}' not found.` });
  }

  if (user.availableMinutes <= 0) {
    return res.json({ hasMinutes: false, remainingMinutes: 0, user });
  }

  user.availableMinutes = Math.max(0, user.availableMinutes - 1);
  saveServerDb();

  return res.json({
    hasMinutes: user.availableMinutes > 0,
    remainingMinutes: user.availableMinutes,
    user
  });
});

app.post("/api/users/recharge", (req, res) => {
  const { userId, minutes, amountPaid, type, method, grantedBy, note, actionType } = req.body;
  const cleanId = (userId || "").trim().toUpperCase();
  const user = serverDb.users[cleanId];

  if (!user) {
    return res.status(404).json({ error: `User ID '${cleanId}' does not exist on server.` });
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
    userId: cleanId,
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

  return res.json({ success: true, user, tx });
});

app.delete("/api/users/:id", (req, res) => {
  const cleanId = (req.params.id || "").trim().toUpperCase();
  if (!serverDb.users[cleanId]) {
    return res.status(404).json({ error: `User ID '${cleanId}' not found.` });
  }
  const deletedName = serverDb.users[cleanId].name;
  delete serverDb.users[cleanId];
  saveServerDb();
  return res.json({ success: true, message: `Deleted user ${deletedName} (${cleanId})` });
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

// Helper for fallback chat replies when Gemini API key is missing or encounters errors
function generateFallbackChatReply(userPrompt: string, kundaliContext: any): string {
  const lower = (userPrompt || "").toLowerCase();
  const name = kundaliContext?.name || "Jatak";
  const rashi = kundaliContext?.rashi || "Taurus";
  const lagna = kundaliContext?.lagna || "Aries";

  if (lower.includes("crush") || lower.includes("love") || lower.includes("propose") || lower.includes("manegi") || lower.includes("feelings")) {
    return `Pranam ${name}! 💕

**💘 Crush & Proposal Astrological Prediction:**
- **Proposal Acceptance Success:** **88% High Probability!**
- **Mutual Attraction Score:** **92% Emotional Magnetism**
- **Key Planetary Influence:** Venus (Shukra Grah) in 5th House of Romance aligns directly with your ${rashi} Moon Sign and ${lagna} Lagna.

**Guruji's Insight:**
Aapke aur aapke crush ke grahon me 5th aur 7th house ka divine connection hai. Shukra (Venus) transit aapke romance aura ko boost kar raha hai. Heartfelt aur respectful tarike se baat kehne par **Positive YES** response milne ke 88%+ chances hain!

**Auspicious Time To Propose:**
Friday (Shukravar) evening during Shukra Hora (5:30 PM to 7:15 PM) or Abhijit Muhurat.

**Vedic Upay (Remedy):**
1. Chant **'Om Draam Dreem Droum Sah Shukraya Namah'** 108 times on Fridays.
2. Keep a Rose Quartz crystal or pink flower with you for romantic harmony.`;
  }

  if (lower.includes("ex") || lower.includes("return") || lower.includes("wapas") || lower.includes("breakup")) {
    return `Pranam ${name}! 💔

**💔 Ex Return & Karmic Bond Prediction:**
- **Ex Reconnection Chance:** **38% Low Probability** in current Rahu-Ketu transit.
- **Moving On & New Soulmate Chance:** **91% Higher Peace & True Love**

**Guruji's Insight:**
Kundali ke 8th House aur Venus-Rahu transit me past karmic lessons complete ho rahe hain. Ex ke piche waqt zaya karne se accha hai ki aap aage badhein, kyunki 2026-2027 me ek sachha aur devoted partner aapki life me aane wala hai!

**Vedic Upay:**
1. Perform Shivling Jalabhishek on Mondays with **'Om Namah Shivaya'**.
2. Donate white sweets or milk on Monday evenings for emotional peace.`;
  }

  if (lower.includes("job") || lower.includes("career") || lower.includes("promotion") || lower.includes("salary") || lower.includes("business")) {
    return `Pranam ${name}! 💼

**💼 Career, Job & Income Prediction:**
- **Job Promotion / Hike Probability:** **91% High Chance!**
- **Government Job / Exam Chance:** **78% Success Rate**
- **Business Expansion Chance:** **85% High Prosperity**

**Guruji's Insight:**
Aapke 10th House (Karma Sthan) aur Surya (Sun) Grah ki position kaafi mazboot hai. Agle 3-6 mahine me aapki salary hike aur post promotion ke shubh yog ban rahe hain.

**Vedic Upay:**
1. Subah Surya Dev ko Jal (Arghya) chadhayein with **'Om Suryaya Namah'**.
2. Wednesday ko gaaye ko hara chara khilayein for business intellect.`;
  }

  if (lower.includes("timeline") || lower.includes("future") || lower.includes("past") || lower.includes("present") || lower.includes("2026") || lower.includes("2027")) {
    return `Pranam ${name}! ⏳

**⏳ Life Timeline Forecast (Past, Present & Future):**
- **Past Karmic Phase:** Completed major structural struggles & learning.
- **Present Dasha Phase:** Transiting into **Guru (Jupiter) Benefic Period**.
- **Future Golden Peak Window:** **2026 to 2028 (92% High Growth Period)**

**Guruji's Insight:**
Kundali me Mahadasha parivartan se dhan, career aur family me sthirta aayegi. Aane wale saal me naye moke aur property gain ke yoga hain.

**Vedic Upay:**
Brihaspati Gayatri Mantra jaap karein aur Thursdays ko Vishnu Sahasranama sunein.`;
  }

  return `Pranam ${name}! 🙏

**✨ Overall Vedic Kundali Life Prediction (${rashi} Rashi, ${lagna} Lagna):**
- **Life Success & Wealth Chance:** **89% Strong Potential**
- **Marriage & Love Compatibility Chance:** **85% Harmonious Match**
- **Health & Mental Peace Score:** **82% Balanced**

**Guruji's Advice:**
Aapki Kundali me Shubh Raj Yoga aur Dhana Yoga ki sthiti hai. Apne lakshya par dhyan kendrit karein, grah dasha aapke paksh me rukhm le rahi hai.

**Vedic Upay:**
Daily **'Om Namah Shivaya'** & **Gayatri Mantra** 108 baar jaap karein aur needy logon ko daan dein.`;
}

// AI Astrologer Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { userPrompt, kundaliContext, chatHistory } = req.body;

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY missing, using smart fail-safe astrologer engine.");
      return res.json({ reply: generateFallbackChatReply(userPrompt, kundaliContext) });
    }

    let systemInstruction = `You are "Guruji Jyotish", an authentic, polite, and deeply knowledgeable AI Vedic Astrologer.
You speak in a warm, respectful tone using friendly English mixed with respectful Hindi/Hinglish terms like 'Pranam', 'Janm Kundali', 'Graha Dasha', 'Rashi', 'Karmic Path', and 'Upay'.

CRITICAL MANDATE:
Always provide clear, specific PERCENTAGE PROBABILITIES in your answer (e.g. "Proposal Acceptance Chance: 88%", "Job Hike Probability: 91%", "Ex Return Chance: 35% - Moving On: 89%").

Specialized Capabilities:
1. EX PREDICTIONS (Recent Ex, Ex Return, Karmic Bonds): Evaluate Venus, Rahu, 7th & 8th House transits, emotional closure, whether ex will reconnect with percentage chances.
2. CRUSH PREDICTIONS (Mutual Feelings, Attraction, Proposal Timing, "Crush Manegi Ya Nahi"): Evaluate 5th House of romance, Venus/Jupiter transits, percentage proposal success rate (e.g. 88%), and auspicious proposal dates/hours.
3. CAREER PREDICTIONS (Best Field, Job Change, Promotion, High Income): Evaluate 10th House, Sun, Saturn, D-10 Dashamsha indicators, promotion probability (e.g. 91%).
4. TIMELINE PREDICTIONS (Past, Present & Future): Analyze Past Karmic lessons, Present Dasha phase, and Future 1-5 year life timeline forecasts with percentage ratings.
5. SPECIFIC ANSWERS & VEDIC REMEDIES: Answer all sections with clear practical Vedic Upay (Mantra, Gemstone, Daan).`;

    if (kundaliContext) {
      systemInstruction += `\n\nUser Kundali Context:\n- Name: ${kundaliContext.name}\n- Date of Birth: ${kundaliContext.dob}\n- Time of Birth: ${kundaliContext.tob}\n- Place of Birth: ${kundaliContext.pob}\n- Moon Sign: ${kundaliContext.rashi}\n- Ascendant: ${kundaliContext.lagna}`;
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

    return res.json({ reply: response.text || generateFallbackChatReply(userPrompt, kundaliContext) });
  } catch (error: any) {
    console.error("Error in AI Astrologer chat, falling back to local engine:", error);
    return res.json({ reply: generateFallbackChatReply(userPrompt, kundaliContext) });
  }
});

// AI Compatibility Gun Milan Analysis
app.post("/api/ai/compatibility", async (req, res) => {
  try {
    const { partner1, partner2, gunaScore } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    const prompt = `
As an expert Vedic Matchmaking Astrologer (Gun Milan Specialist), provide a deep compatibility and relationship breakdown for:

Partner 1: ${partner1.name} (DOB: ${partner1.dob}, Time: ${partner1.tob || "Unknown"}, Rashi: ${partner1.rashi})
Partner 2: ${partner2.name} (DOB: ${partner2.dob}, Time: ${partner2.tob || "Unknown"}, Rashi: ${partner2.rashi})
Calculated Ashta Koota Gun Score: ${gunaScore} out of 36 points.

Provide:
1. Executive Compatibility Summary (What does ${gunaScore}/36 mean for marriage?)
2. Core Compatibility Strengths (Mental, Emotional, Financial, Family values)
3. Potential Friction Points & Differences
4. Remedies for Nadi or Bhakoot or Mangal Dosh if applicable
5. Guidance for long-term marital bliss & harmony
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a master Vedic Kundali Matchmaker.",
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
