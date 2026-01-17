# Daily Briefing Dashboard

A single-page daily briefing dashboard displaying current date, LA weather, stock market data (S&P 500 and NASDAQ), and news from two categories: World News and Legal-Tech.

## Features

- **Current Date Display**: Formatted date with day of week
- **LA Weather**: Temperature and conditions from OpenWeatherMap
- **Stock Market**: S&P 500 and NASDAQ prices with color-coded changes
- **Two-Column News Layout**:
  - World News (5 stories)
  - Legal-Tech News (5 stories)
- **Dark/Light Mode Toggle**: Persisted in localStorage
- **1-Hour Caching**: All data cached locally to reduce API calls
- **Responsive Design**: Works on desktop and mobile
- **Graceful Fallbacks**: Mock data shown when APIs unavailable

## Quick Start

1. Open `index.html` in your browser
2. The page works immediately with mock data
3. For live data, configure your API keys (see below)

## API Key Configuration

To fetch live data, you'll need free API keys from three services:

### 1. OpenWeatherMap (Weather)

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Go to "API Keys" in your account
4. Copy your API key

**Free Tier**: 1,000 calls/day

### 2. Alpha Vantage (Stocks)

1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Enter your email to get a free API key
3. Copy the key from the confirmation page/email

**Free Tier**: 25 calls/day

### 3. NewsAPI (News)

1. Visit [NewsAPI](https://newsapi.org/register)
2. Sign up for a free account
3. Copy your API key from the dashboard

**Free Tier**: 100 calls/day (development only)

### Adding Your Keys

Open `index.html` and find the `CONFIG` object near the bottom of the file:

```javascript
const CONFIG = {
    // API Keys - Replace with your own keys
    WEATHER_API_KEY: 'YOUR_OPENWEATHERMAP_API_KEY',
    STOCKS_API_KEY: 'YOUR_ALPHAVANTAGE_API_KEY',
    NEWS_API_KEY: 'YOUR_NEWSAPI_API_KEY',
    // ...
};
```

Replace the placeholder values with your actual API keys.

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
| `briefing_news_world` | World news articles with timestamp |
| `briefing_news_legal` | Legal-tech news articles with timestamp |
| `briefing_theme` | Theme preference (light/dark) |

## Customization

### Change Location

Modify the `LOCATION` object in `CONFIG`:

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

### Change Number of Stories

Modify `STORIES_PER_COLUMN`:

```javascript
STORIES_PER_COLUMN: 10, // Show 10 stories per column
```

## Browser Support

Works in all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

Requires JavaScript enabled and localStorage available.

## Troubleshooting

### "API Keys Required" Notice

This appears when using placeholder API keys. Either:
- Add your real API keys
- Continue with mock data (the page still functions)

### News Not Loading

- NewsAPI free tier only works on localhost
- For production, you'll need a paid NewsAPI plan or alternative news API

### Stock Prices Showing "N/A"

- Alpha Vantage has strict rate limits (25 calls/day free)
- Try again after the rate limit resets

### Weather Not Loading

- Check that your OpenWeatherMap API key is activated (may take a few hours after signup)
- Verify the API key is correctly entered

## File Structure

```
daily-briefing/
├── index.html    # Complete application (HTML + CSS + JS)
└── README.md     # This file
```

## License

MIT License - Feel free to use and modify as needed.
