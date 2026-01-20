# Daily Briefing Dashboard

## Overview
A single-page company dashboard displaying weather, stocks, OKRs, metrics, and news. Deployed on Vercel.

**Live URL**: https://daily-briefing-[vercel-suffix].vercel.app
**GitHub**: https://github.com/thebuccanear711/daily-briefing

## Architecture

### Files
```
daily-briefing/
├── index.html          # Main app (HTML + CSS + JS, all-in-one)
├── api/
│   ├── news.js         # RSS news fetching (Vercel serverless)
│   └── metrics.js      # Google Sheets metrics (Vercel serverless)
├── vercel.json         # Vercel config
├── package.json        # Dependencies
└── CLAUDE.md           # This file
```

### Data Sources

| Section | Source | Cache |
|---------|--------|-------|
| Weather | OpenWeatherMap API | 1 hour (localStorage) |
| Stocks | Alpha Vantage API (SPY, QQQ) | 1 hour (localStorage) |
| Metrics | Google Sheets CSV export | 5 min (server) |
| World News | RSS feeds (Reuters, AP, BBC, NYT, NPR) | 30 min (server) |
| Legal-Tech News | RSS feeds (Law.com, Artificial Lawyer, etc.) | 30 min (server) |

### Key Features

**OKR Section**: Three company OKRs displayed horizontally with "#ktmttmt" tagline
- Feed the Golden Goose
- Have Multiple Thriving Growth Engines
- Build a Technology-Forward Culture

**Metrics**: Connected to Google Sheets for Zapier/Snowflake integration
- Sheet ID: `1yFOjVB_tMm3StcdEV6arJotWymrRxqaUJaK3g8P_x18`
- Columns: Label, Value, Change, Sparkline data (7 values)

**News Logic**:
- World news: Prioritizes stories covered by multiple sources (cross-source importance)
- Legal-tech: Fresh relevant articles first, older articles get daily rotation for variety
- Stock images used as fallbacks when RSS doesn't provide images

**Weather**: Uses browser geolocation (with fallback to LA)

**Theme**: Dark/light mode toggle, dark by default

## Environment Variables (Vercel)

```
ANTHROPIC_API_KEY=sk-...  # Not currently used (switched from Claude to RSS)
```

API keys embedded in index.html (for simplicity):
- `OPENWEATHERMAP_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `GOOGLE_CLIENT_ID` (for Calendar OAuth)

## Common Tasks

**Deploy**: Push to GitHub, Vercel auto-deploys

**Update metrics**: Edit the Google Sheet directly - changes reflect within 5 minutes

**Add RSS source**: Edit `api/news.js` → `RSS_SOURCES` object

**Change OKRs**: Edit the HTML in `index.html` → search for "okr-section"

## Design Notes

- No boxes around OKRs or metrics (clean, minimal look)
- Avaros-inspired: gradient color splashes, floating dust particles
- Calendar events color-coded: purple (solo), green (1:1), amber (group)
- Sparklines on metric cards show 7-day trends
