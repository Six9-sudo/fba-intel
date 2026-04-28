const express  = require("express");
const OpenAI   = require("openai");
const { calculateProfit } = require("./profitCalc");

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── POST /api/calculate ──────────────────────────────────────────────────────
// Full profit breakdown for a product
router.post("/calculate", (req, res) => {
  try {
    const result = calculateProfit(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ─── POST /api/sourcing-plan ──────────────────────────────────────────────────
// AI generates a 30-day sourcing plan from budget + ROI target
router.post("/sourcing-plan", async (req, res) => {
  try {
    const { budget, roiTarget = 40, categories = [], riskLevel = "moderate" } = req.body;
    if (!budget || budget < 100) return res.status(400).json({ error: "Budget must be at least $100" });

    const prompt = `You are an expert Amazon FBA sourcing consultant.

A seller has $${budget} to invest. They want ${roiTarget}%+ ROI.
Risk level: ${riskLevel}. Preferred categories: ${categories.join(", ") || "any"}.

Create a practical 30-day Amazon FBA sourcing plan. Return ONLY a JSON object:
{
  "overview": "<2 sentence strategy summary>",
  "budgetAllocation": [
    { "category": "<category>", "amount": <number>, "rationale": "<why>", "targetROI": <number> }
  ],
  "week1": ["<action1>", "<action2>", "<action3>"],
  "week2": ["<action1>", "<action2>", "<action3>"],
  "week3": ["<action1>", "<action2>", "<action3>"],
  "week4": ["<action1>", "<action2>", "<action3>"],
  "topProductCriteria": ["<criterion1>", "<criterion2>", "<criterion3>"],
  "warnings": ["<risk1>", "<risk2>"]
}

No markdown, no backticks. Return only the JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const raw    = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({ success: true, data: parsed });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/restock ────────────────────────────────────────────────────────
// AI generates a restock schedule from sell-through data
router.post("/restock", async (req, res) => {
  try {
    const { products } = req.body;
    // products: [{ name, currentStock, dailySales, leadTimeDays }]
    if (!products?.length) return res.status(400).json({ error: "Provide at least one product" });

    const prompt = `You are an Amazon FBA inventory expert.

Given these products and their sales data, create a restock schedule so the seller never runs out of stock:

${JSON.stringify(products, null, 2)}

Return ONLY a JSON array:
[
  {
    "name": "<product name>",
    "daysUntilStockout": <number>,
    "reorderDate": "<YYYY-MM-DD>",
    "reorderQuantity": <number>,
    "urgency": "critical|high|normal|ok",
    "note": "<one line tip>"
  }
]

Sort by urgency (critical first). No markdown, no backticks. Only JSON.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw    = response.choices[0].message.content.trim();
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({ success: true, data: parsed });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── POST /api/chat ───────────────────────────────────────────────────────────
// General AI assistant for Amazon FBA questions
router.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const messages = [
      {
        role: "system",
        content: `You are FBA Intel, an expert AI assistant for Amazon FBA sellers.
You help with: product research, profit calculations, sourcing strategies, supplier finding,
inventory management, and scaling Amazon businesses.
Be direct, data-driven, and practical. Keep responses concise and actionable.
When asked to calculate profits, ask for: buy cost, sell price, and category.`,
      },
      ...history.slice(-10), // keep last 10 messages for context
      { role: "user", content: message },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      temperature: 0.5,
      max_tokens: 600,
    });

    res.json({
      success: true,
      data: { reply: response.choices[0].message.content },
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/health ──────────────────────────────────────────────────────────
router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "FBA Intel API", timestamp: new Date().toISOString() });
});

module.exports = router;
