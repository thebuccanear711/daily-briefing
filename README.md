# Daily Briefing Dashboard

A single-page daily briefing dashboard displaying current date, LA weather, stock market data (S&P 500 and NASDAQ), Google Calendar events, and news from two categories: World News and Legal-Tech.

## Features

- **Current Date Display**: Formatted date with day of week
- **LA Weather**: Temperature and conditions from OpenWeatherMap
- **Stock Market**: S&P 500 and NASDAQ prices with percentage changes
- **Google Calendar**: Timeline view showing today's meetings
- **Two-Column News Layout**:
  - World News (5 stories) - Claude-powered web search
  - Legal-Tech News (5 stories) - Claude-powered web search
- **Dark/Light Mode Toggle**: Persisted in localStorage (dark mode default)
- **1-Hour Caching**: All data cached locally to reduce API calls
- **Responsive Design**: Works on desktop and mobile
- **Avaros-inspired Design**: Gradient color splashes and floating dust particles

## Deployment to Vercel

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and create a new repository (e.g., `daily-briefing`)
2. Push the local repository:

```bash
cd "/Users/sean/Documents/Claude Projects/daily-briefing"
git remote add origin https://github.com/YOUR_USERNAME/daily-briefing.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import your `daily-briefing` repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: `./`
5. Add Environment Variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)
6. Click "Deploy"

### Step 3: Update Google OAuth (for Calendar)

After deployment, add your Vercel URL to Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project → Credentials → Your OAuth 2.0 Client
3. Add to "Authorized JavaScript origins":
   - `https://your-project-name.vercel.app`
4. Save changes

## Local Development

```bash
# Install dependencies
npm install

# Run with Vercel dev server (enables API routes)
vercel dev

# Or run with local server (no Claude-powered news)
npm start
```

Note: For local development with Claude-powered news, you need to:
1. Install Vercel CLI: `npm i -g vercel`
2. Link to your project: `vercel link`
3. Pull environment variables: `vercel env pull`
4. Run: `vercel dev`

## API Configuration

### Weather & Stocks (already configured in index.html)

The following API keys are embedded in the frontend:
- **OpenWeatherMap**: Weather data for Los Angeles
- **Alpha Vantage**: Stock prices for S&P 500 and NASDAQ

### News (Claude + Anthropic API)

News is fetched using Claude's web search capabilities via a Vercel serverless function. This requires the `ANTHROPIC_API_KEY` environment variable in Vercel.

### Google Calendar

The Google OAuth Client ID is embedded in the frontend. To use your own:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the "Google Calendar API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Add Authorized JavaScript origins:
   - `http://localhost:8000` (for local dev)
   - `https://your-vercel-url.vercel.app` (for production)
7. Copy the Client ID and update `CONFIG.GOOGLE_CLIENT_ID` in index.html

## Caching Behavior

- All API responses are cached in localStorage for 1 hour
- Weather, stocks, and news each have separate cache entries
- Theme preference is persisted indefinitely
- To force a refresh, clear localStorage or wait for cache expiration

### Cache Keys

| Key | Description |
|-----|-------------|
| `briefing_weather` | Weather data with timestamp |
| `briefing_stocks` | Stock market data with timestamp |
| `briefing_news_world_claude` | World news articles with timestamp |
| `briefing_news_legal_claude` | Legal-tech news articles with timestamp |
| `briefing_calendar_token` | Google OAuth token |
| `briefing_theme` | Theme preference (light/dark) |

## File Structure

```
daily-briefing/
├── index.html        # Main application (HTML + CSS + JS)
├── api/
│   └── news.js       # Vercel serverless function for Claude-powered news
├── package.json      # Dependencies (Anthropic SDK)
├── .gitignore        # Git ignore file
└── README.md         # This file
```

## Customization

### Change Location

Modify the `LOCATION` object in `CONFIG` within index.html:

```javascript
LOCATION: {
    city: 'New York',
    lat: 40.71,
    lon: -74.01
}
```

### Change Cache Duration

Modify `CACHE_DURATION` (in milliseconds):

```javascript
CACHE_DURATION: 1800000, // 30 minutes
```

## Browser Support

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires JavaScript enabled and localStorage available.

## Troubleshooting

### News Not Loading

- Check Vercel deployment logs for errors
- Verify `ANTHROPIC_API_KEY` is set in Vercel environment variables
- Ensure you have sufficient Anthropic API credits

### Stock Prices Showing "N/A"

- Alpha Vantage has strict rate limits (25 calls/day free)
- Try again after the rate limit resets

### Calendar Not Connecting

- Ensure your Vercel URL is added to Google OAuth authorized origins
- Clear localStorage and try signing in again

## License

MIT License - Feel free to use and modify as needed.
