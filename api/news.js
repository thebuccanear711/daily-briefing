// RSS-based news fetching with cross-source importance ranking

// RSS feed sources
const RSS_SOURCES = {
  world: [
    { name: 'Reuters', url: 'https://feeds.reuters.com/reuters/topNews', priority: 1 },
    { name: 'AP News', url: 'https://rsshub.app/apnews/topics/apf-topnews', priority: 1 },
    { name: 'BBC', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', priority: 1 },
    { name: 'NYTimes', url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', priority: 1 },
    { name: 'NPR', url: 'https://feeds.npr.org/1001/rss.xml', priority: 2 },
  ],
  'legal-tech': [
    { name: 'Law.com', url: 'https://feeds.law.com/LawComNews', priority: 1 },
    { name: 'Artificial Lawyer', url: 'https://www.artificiallawyer.com/feed/', priority: 1 },
    { name: 'Above the Law', url: 'https://abovethelaw.com/feed/', priority: 2 },
    { name: 'LawSites', url: 'https://www.lawnext.com/feed', priority: 1 },
  ]
};

// Keywords to boost for legal-tech relevance
const LEGAL_TECH_KEYWORDS = [
  'legal tech', 'legaltech', 'legal ai', 'law firm technology', 'legal software',
  'contract ai', 'ediscovery', 'legal automation', 'courtroom', 'legal analytics',
  'document review', 'legal ops', 'legal operations', 'ai lawyer', 'legal startup'
];

// Cache
const cache = {
  world: { data: null, timestamp: 0 },
  'legal-tech': { data: null, timestamp: 0 }
};
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { category } = req.query;
  if (!category || !['world', 'legal-tech'].includes(category)) {
    return res.status(400).json({ error: "Invalid category. Use 'world' or 'legal-tech'" });
  }

  try {
    const cached = cache[category];
    const now = Date.now();

    if (cached.data && (now - cached.timestamp) < CACHE_DURATION) {
      return res.status(200).json({ articles: cached.data, cached: true });
    }

    const articles = await fetchRSSNews(category);
    cache[category] = { data: articles, timestamp: now };

    return res.status(200).json({ articles, cached: false });
  } catch (error) {
    console.error('RSS fetch error:', error);

    if (cache[category].data) {
      return res.status(200).json({ articles: cache[category].data, cached: true, stale: true });
    }

    return res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
}

async function fetchRSSNews(category) {
  const sources = RSS_SOURCES[category];
  const allArticles = [];

  // Fetch all sources in parallel
  const results = await Promise.allSettled(
    sources.map(source => fetchFeed(source))
  );

  // Collect successful results
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allArticles.push(...result.value);
    }
  }

  // Process based on category
  if (category === 'world') {
    return processWorldNews(allArticles);
  } else {
    return processLegalTechNews(allArticles);
  }
}

async function fetchFeed(source) {
  try {
    const response = await fetch(source.url, {
      headers: { 'User-Agent': 'DailyBriefing/1.0' }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const xml = await response.text();
    return parseRSS(xml, source.name, source.priority);
  } catch (error) {
    console.error(`Failed to fetch ${source.name}:`, error.message);
    return [];
  }
}

function parseRSS(xml, sourceName, sourcePriority) {
  const articles = [];

  // Extract items using regex (simple XML parsing)
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title = extractTag(item, 'title');
    const link = extractTag(item, 'link') || extractTag(item, 'guid');
    const description = extractTag(item, 'description');
    const pubDate = extractTag(item, 'pubDate');
    const image = extractImage(item);

    if (title && link) {
      articles.push({
        title: cleanText(title),
        url: link.trim(),
        summary: cleanText(description || '').slice(0, 200),
        source: sourceName,
        sourcePriority,
        imageUrl: image,
        pubDate: pubDate ? new Date(pubDate) : new Date(),
        rawTitle: title.toLowerCase() // for deduplication
      });
    }
  }

  return articles;
}

function extractTag(xml, tag) {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1];

  // Handle regular content
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractImage(item) {
  // Try media:content
  const mediaMatch = item.match(/<media:content[^>]*url=["']([^"']+)["']/i);
  if (mediaMatch) return mediaMatch[1];

  // Try enclosure
  const enclosureMatch = item.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image/i);
  if (enclosureMatch) return enclosureMatch[1];

  // Try media:thumbnail
  const thumbMatch = item.match(/<media:thumbnail[^>]*url=["']([^"']+)["']/i);
  if (thumbMatch) return thumbMatch[1];

  // Try image in description
  const descImgMatch = item.match(/<img[^>]*src=["']([^"']+)["']/i);
  if (descImgMatch) return descImgMatch[1];

  return null;
}

function cleanText(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function processWorldNews(articles) {
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

  // Filter to recent articles
  let recent = articles.filter(a => a.pubDate >= fourHoursAgo);

  // If not enough recent, expand to 12 hours
  if (recent.length < 5) {
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    recent = articles.filter(a => a.pubDate >= twelveHoursAgo);
  }

  // Group similar stories (cross-source matching)
  const storyGroups = groupSimilarStories(recent);

  // Score and sort by importance
  const scored = storyGroups.map(group => {
    const sourceCount = new Set(group.map(a => a.source)).size;
    const bestArticle = group.sort((a, b) => a.sourcePriority - b.sourcePriority)[0];

    return {
      ...bestArticle,
      importanceScore: sourceCount * 10 + (1 / bestArticle.sourcePriority),
      sourceCount
    };
  });

  // Sort by importance, then recency
  scored.sort((a, b) => {
    if (b.importanceScore !== a.importanceScore) {
      return b.importanceScore - a.importanceScore;
    }
    return b.pubDate - a.pubDate;
  });

  // Return top 5
  return scored.slice(0, 5).map(formatArticle);
}

function processLegalTechNews(articles) {
  // Score by keyword relevance
  const scored = articles.map(article => {
    const text = (article.title + ' ' + article.summary).toLowerCase();
    let keywordScore = 0;

    for (const keyword of LEGAL_TECH_KEYWORDS) {
      if (text.includes(keyword)) {
        keywordScore += 10;
      }
    }

    return {
      ...article,
      relevanceScore: keywordScore + (1 / article.sourcePriority)
    };
  });

  // Sort by relevance, then recency
  scored.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return b.pubDate - a.pubDate;
  });

  // Deduplicate by similar titles
  const unique = deduplicateByTitle(scored);

  return unique.slice(0, 5).map(formatArticle);
}

function groupSimilarStories(articles) {
  const groups = [];
  const used = new Set();

  for (let i = 0; i < articles.length; i++) {
    if (used.has(i)) continue;

    const group = [articles[i]];
    used.add(i);

    for (let j = i + 1; j < articles.length; j++) {
      if (used.has(j)) continue;

      if (isSimilar(articles[i].rawTitle, articles[j].rawTitle)) {
        group.push(articles[j]);
        used.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}

function isSimilar(title1, title2) {
  // Simple word overlap check
  const words1 = new Set(title1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(title2.split(/\s+/).filter(w => w.length > 3));

  let overlap = 0;
  for (const word of words1) {
    if (words2.has(word)) overlap++;
  }

  const minSize = Math.min(words1.size, words2.size);
  return minSize > 0 && overlap / minSize >= 0.5;
}

function deduplicateByTitle(articles) {
  const seen = new Set();
  return articles.filter(article => {
    const key = article.rawTitle.slice(0, 50);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function formatArticle(article) {
  return {
    title: article.title,
    summary: article.summary || 'No summary available.',
    source: article.source,
    url: article.url,
    imageUrl: article.imageUrl
  };
}
