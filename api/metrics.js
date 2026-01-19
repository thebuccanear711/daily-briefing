// Fetch metrics from Google Sheets

const SHEET_ID = '1yFOjVB_tMm3StcdEV6arJotWymrRxqaUJaK3g8P_x18';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

// Cache
let cache = { data: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const now = Date.now();

    // Return cached data if fresh
    if (cache.data && (now - cache.timestamp) < CACHE_DURATION) {
      return res.status(200).json({ metrics: cache.data, cached: true });
    }

    // Fetch from Google Sheets
    const response = await fetch(SHEET_URL);
    if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.status}`);

    const csv = await response.text();
    const metrics = parseCSV(csv);

    // Update cache
    cache = { data: metrics, timestamp: now };

    return res.status(200).json({ metrics, cached: false });
  } catch (error) {
    console.error('Metrics fetch error:', error);

    // Return stale cache on error
    if (cache.data) {
      return res.status(200).json({ metrics: cache.data, cached: true, stale: true });
    }

    return res.status(500).json({ error: 'Failed to fetch metrics', details: error.message });
  }
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header row
  const dataRows = lines.slice(1);

  return dataRows.map(row => {
    // Parse CSV row (handle commas in quoted strings)
    const cells = parseCSVRow(row);

    const [label, value, change, ...sparklineData] = cells;

    // Parse sparkline data as numbers
    const sparkline = sparklineData
      .slice(0, 7)
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v));

    // Determine if positive based on change value
    const isPositive = !change?.trim().startsWith('-');

    return {
      label: label?.trim() || 'Metric',
      value: value?.trim() || '--',
      change: change?.trim() || '',
      isPositive,
      sparkline: sparkline.length > 0 ? sparkline : null
    };
  }).filter(m => m.label && m.value);
}

function parseCSVRow(row) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);

  return cells;
}
