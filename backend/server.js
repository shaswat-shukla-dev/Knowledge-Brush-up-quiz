require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend (static files from /frontend/public)
app.use(express.static(path.join(__dirname, "../frontend/public")));

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── POST /api/generate-quiz ──────────────────────────────
app.post("/api/generate-quiz", async (req, res) => {
  const { topic, count = 10, difficulty = "intermediate" } = req.body;

  // Validate inputs
  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    return res.status(400).json({ error: "Please provide a valid topic (at least 2 characters)." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Server is missing GEMINI_API_KEY. Check your .env file." });
  }

  const safeCount = Math.min(Math.max(parseInt(count) || 10, 3), 20);
  const safeDiff = ["beginner", "intermediate", "advanced", "mixed"].includes(difficulty)
    ? difficulty
    : "intermediate";

  const prompt = `You are a quiz generator. Generate exactly ${safeCount} multiple-choice questions about "${topic.trim()}" at ${safeDiff} difficulty.

STRICT JSON FORMAT — respond ONLY with valid JSON, nothing else:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why the answer is correct."
    }
  ]
}

Rules:
- Exactly 4 options per question
- correctIndex is 0-3 (index of correct option in the options array)
- Questions must be factually accurate
- Vary question types (recall, application, analysis)
- Explanations should be 1-2 sentences
- NO markdown, NO code fences — ONLY raw JSON`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.json().catch(() => ({}));
      const msg = errBody?.error?.message || `Gemini API error ${geminiRes.status}`;
      return res.status(502).json({ error: msg });
    }

    const data = await geminiRes.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Strip possible markdown fences
    const clean = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return res.status(422).json({ error: "No questions returned. Try a more specific topic." });
    }

    return res.json({ questions: parsed.questions, topic: topic.trim() });
  } catch (err) {
    console.error("Quiz generation error:", err.message);
    if (err instanceof SyntaxError) {
      return res.status(422).json({ error: "Failed to parse Gemini response. Please try again." });
    }
    return res.status(500).json({ error: err.message });
  }
});

// ─── Catch-all: serve frontend for any other route ─────────
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public/index.html"));
});

// ─── Start ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  QuizForge server running on http://localhost:${PORT}`);
  console.log(`🔑  Gemini API key: ${process.env.GEMINI_API_KEY ? "✅ Loaded" : "❌ Missing — add to .env"}`);
  console.log(`📁  Serving frontend from: ../frontend/public\n`);
});
