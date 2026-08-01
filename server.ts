import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

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

// AI Astrologer Chat Endpoint
app.post("/api/ai/chat", async (req, res) => {
  try {
    const { userPrompt, kundaliContext, chatHistory } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in server environment.",
      });
    }

    let systemInstruction = `You are "Guruji Jyotish", an authentic, polite, and deeply knowledgeable AI Vedic Astrologer.
You speak in a warm, respectful tone using friendly English mixed with respectful Hindi/Hinglish terms like 'Pranam', 'Janm Kundali', 'Graha Dasha', 'Rashi', 'Karmic Path', and 'Upay'.

Specialized Capabilities:
1. EX PREDICTIONS (Recent Ex, Ex Return, Karmic Bonds): Evaluate Venus, Rahu, 7th & 8th House transits, emotional closure, whether ex will reconnect, and whether moving on is karmically recommended.
2. CRUSH PREDICTIONS (Mutual Feelings, Attraction, Proposal Timing): Evaluate 5th House of romance, 7th House lord, Venus/Jupiter transits, mutual chemistry, and auspicious dates for proposing.
3. CAREER PREDICTIONS (Best Field, Job Change, Promotion, High Income): Evaluate 10th House, Sun, Saturn, D-10 Dashamsha indicators, and Mahadasha influence.
4. TIMELINE PREDICTIONS (Past, Present & Future): Analyze Past Karmic lessons, Present Dasha phase, and Future 1-5 year life timeline forecasts.
5. SPECIFIC ANSWERS: Answer exactly as asked ("jo jaisa puche waisa clear aur honest batayein"), giving clear astrological clarity with practical Vedic Upay (Mantra, Gemstone, Daan).

Keep responses focused, comforting, structured, and authentic to Vedic astrology principles. Do not use alarming or doom-saying language.`;

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

    return res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Error in AI Astrologer chat:", error);
    return res.status(500).json({ error: error.message || "Failed to process AI Astrologer response" });
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
