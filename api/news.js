import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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
    const articles = await fetchNewsWithClaude(category);
    return res.status(200).json({ articles });
  } catch (error) {
    console.error("Error fetching news:", error);
    return res.status(500).json({ error: "Failed to fetch news", details: error.message });
  }
}

async function fetchNewsWithClaude(category) {
  const prompts = {
    world: `Search the web for today's top 5 most important world news stories. Focus on major global events, politics, economics, and significant breaking news from reputable sources like Reuters, AP News, BBC, NPR, and major newspapers.

For each story, provide:
1. A compelling headline
2. A 2-sentence summary that captures the key facts
3. The source name
4. The URL to the original article

Return ONLY a valid JSON array with exactly 5 objects in this format:
[
  {
    "title": "Headline here",
    "summary": "Two sentence summary here.",
    "source": "Source Name",
    "url": "https://...",
    "imageUrl": null
  }
]

Do not include any text before or after the JSON array.`,

    "legal-tech": `Search the web for the latest 5 news stories about legal technology, law firm innovation, legal AI, courtroom technology, legal software, contract automation, legal tech startups, or legal industry digital transformation.

Prioritize sources like: Law.com, Law360, Artificial Lawyer, Legal Dive, TechCrunch (legal coverage), VentureBeat, ABA Journal, LawSites Blog, Legal Tech News, and StenoImperium.

For each story, provide:
1. A compelling headline
2. A 2-sentence summary that captures the key facts
3. The source name
4. The URL to the original article

Return ONLY a valid JSON array with exactly 5 objects in this format:
[
  {
    "title": "Headline here",
    "summary": "Two sentence summary here.",
    "source": "Source Name",
    "url": "https://...",
    "imageUrl": null
  }
]

Do not include any text before or after the JSON array.`
  };

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
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
        max_uses: 10
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
    // Try to extract JSON from the response (in case there's extra text)
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const articles = JSON.parse(jsonMatch[0]);
      return articles.slice(0, 5); // Ensure max 5 articles
    }
    throw new Error("No valid JSON array found in response");
  } catch (parseError) {
    console.error("Failed to parse Claude response:", textContent);
    throw new Error("Failed to parse news data from Claude");
  }
}
