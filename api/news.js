import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Simple in-memory cache (persists across warm serverless invocations)
const cache = {
  world: { data: null, timestamp: 0 },
  "legal-tech": { data: null, timestamp: 0 }
};

// Cache duration: 30 minutes (in milliseconds)
const CACHE_DURATION = 30 * 60 * 1000;

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category } = req.query;

  if (!category || !["world", "legal-tech"].includes(category)) {
    return res.status(400).json({ error: "Invalid category. Use 'world' or 'legal-tech'" });
  }

  try {
    // Check cache first
    const cached = cache[category];
    const now = Date.now();

    if (cached.data && (now - cached.timestamp) < CACHE_DURATION) {
      console.log(`Returning cached ${category} news`);
      return res.status(200).json({ articles: cached.data, cached: true });
    }

    // Fetch fresh data
    console.log(`Fetching fresh ${category} news from Claude`);
    const articles = await fetchNewsWithClaude(category);

    // Update cache
    cache[category] = { data: articles, timestamp: now };

    return res.status(200).json({ articles, cached: false });
  } catch (error) {
    console.error("Error fetching news:", error);

    // If we have stale cache, return it on error
    if (cache[category].data) {
      console.log(`Returning stale cached ${category} news due to error`);
      return res.status(200).json({
        articles: cache[category].data,
        cached: true,
        stale: true
      });
    }

    return res.status(500).json({ error: "Failed to fetch news", details: error.message });
  }
}

async function fetchNewsWithClaude(category) {
  const prompts = {
    world: `Find today's top 5 world news stories from Reuters, AP, BBC, or NPR.

Return ONLY a JSON array:
[{"title":"Headline","summary":"Two sentences.","source":"Source","url":"https://...","imageUrl":null}]`,

    "legal-tech": `Find 5 recent legal technology news stories from Law.com, Law360, Artificial Lawyer, or TechCrunch.

Return ONLY a JSON array:
[{"title":"Headline","summary":"Two sentences.","source":"Source","url":"https://...","imageUrl":null}]`
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: prompts[category]
      }
    ],
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 5
      }
    ]
  });

  // Extract the text response
  let textContent = "";
  for (const block of response.content) {
    if (block.type === "text") {
      textContent += block.text;
    }
  }

  // Parse the JSON response
  try {
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const articles = JSON.parse(jsonMatch[0]);
      return articles.slice(0, 5);
    }
    throw new Error("No valid JSON array found in response");
  } catch (parseError) {
    console.error("Failed to parse Claude response:", textContent);
    throw new Error("Failed to parse news data from Claude");
  }
}
