# Bitcoin Tracker - HODL or Fold?

A Progressive Web App (PWA) for tracking Bitcoin prices in real-time with live charts, market insights, and powerful calculation tools.

## Features

### Real-Time Price Tracking
- Live Bitcoin price updates
- 24-hour price change percentage
- Multiple data sources with automatic fallback
- Auto-refresh every 30 seconds

### Interactive Charts
- Historical price data visualization
- Multiple timeframes (24h, 7d, 30d, 90d, 1y)
- Powered by Chart.js

### Advanced Tools

#### DCA (Dollar Cost Averaging) Calculator
- Calculate returns from regular Bitcoin investments
- Configurable frequency: Daily, Weekly, Bi-weekly, Monthly
- Date range selection with preset options
- Shows total invested, current value, profit/loss, and ROI

#### Bitcoin Unit Converter
- Real-time conversion between:
  - BTC (Bitcoin)
  - mBTC (Millibitcoin)
  - Satoshis
  - USD
- Live price updates

#### Profit/Loss Calculator
- Calculate exact profit/loss from Bitcoin trades
- Includes trading fee calculations
- Shows ROI percentage
- "Use Current Price" quick button

#### What If Calculator
- Explore hypothetical investment scenarios
- Calculate potential returns from past dates

### Market Intelligence

#### News Feed
- Latest Bitcoin and cryptocurrency news
- Real-time updates from crypto news sources

#### Social Sentiment
- Twitter feed integration
- Community discussions and trends

#### Whale Alerts
- Large Bitcoin transaction monitoring
- Track significant market movements

### Educational Resources
- Bitcoin basics
- Investment strategies
- Market analysis guides

## Themes

The app includes 8 beautiful themes:

1. **Light Theme** ☀️ - Clean, bright interface
2. **Dark Theme** 🌙 - Easy on the eyes
3. **Bitcoin Orange** ₿ - Classic Bitcoin colors
4. **Matrix Green** 🟢 - Hacker aesthetic
5. **Detroit Lions** 🦁 - Honolulu Blue and Silver
6. **Windy City (J)** 🌆 - Chicago Navy and Red
7. **Spartan Green** 🎓 - Michigan State University colors with custom Spartan helmet
8. **Go Blue** 〽️ - University of Michigan Maize and Blue

Themes persist across sessions using localStorage.

## PWA Features

### Installable
- Add to home screen on iOS and Android
- Works like a native app
- Custom install banner with easy setup

### Offline Support
- Service Worker caching
- Works without internet connection
- Cached static assets and API responses

### Future Enhancements (Placeholders)
- Background sync for price updates
- Push notifications for price alerts
- Badge notifications

## Technical Stack

### Frontend
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 with CSS Custom Properties
- Chart.js for data visualization
- Responsive design (mobile-first)

### Backend Proxy
- Node.js Express server
- CORS proxy for API requests
- Port 3003

### APIs Used
- CoinGecko API (primary price source)
- Blockchain.info API (fallback)
- Alternative.me API (additional data)

### PWA Technologies
- Service Workers
- Web App Manifest
- Cache API
- Install Prompt API

## File Structure

```
bitcoin-app/
├── index.html              # Main HTML structure
├── styles.css              # All styling and themes
├── app.js                  # Application logic
├── manifest.json           # PWA manifest
├── service-worker.js       # Service worker for offline support
├── proxy-server.js         # Backend CORS proxy
└── README.md              # This file
```

## Setup Instructions

### Prerequisites
- Node.js installed
- npm or npx available

### Running the App

1. **Start the Frontend Server**
   ```bash
   npx http-server -p 3002 --cors -c-1
   ```
   This serves the frontend files with CORS enabled and no caching.

2. **Start the Proxy Server**
   ```bash
   node proxy-server.js
   ```
   This runs on port 3003 and handles API requests.

3. **Access the App**
   - Local: `http://localhost:3002`
   - Mobile (same network): `http://[YOUR_IP]:3002`

### Finding Your IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network connection.

**Mac/Linux:**
```bash
ifconfig
```
or
```bash
ip addr show
```

### Mobile Access

1. Make sure your mobile device is on the same WiFi network as your computer
2. Find your computer's IP address (see above)
3. On your mobile browser, navigate to: `http://[YOUR_IP]:3002`
4. Install the app:
   - **iPhone**: Tap Share button → "Add to Home Screen"
   - **Android**: Tap menu (⋮) → "Install app" or "Add to Home Screen"

### Code Configuration for Mobile Access

The app automatically detects whether it's being accessed from localhost or via IP address and adjusts the API proxy URL accordingly:

```javascript
const getProxyBaseUrl = () => {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        return `http://${hostname}:3003`;
    }
    return 'http://localhost:3003';
};
```

## Development History

### Navigation Improvements
- Fixed mobile navigation button spacing
- Equal-width buttons using flexbox (`flex: 1 1 0`)
- Removed horizontal padding for perfect fit
- Reordered tabs: Price → News → Tools → Social → Whales → Learn

### Tools Enhancements
- Added DCA Calculator with preset investment scenarios
- Created Bitcoin Unit Converter with real-time conversion
- Built Profit/Loss Calculator with fee support
- Improved What If Calculator with better UX

### Theme System
- Added 4 new custom themes (Lions, Chicago, MSU, UMich)
- Created custom Spartan helmet SVG logo
- Made theme selector scrollable on mobile
- Sticky header and close button for mobile theme picker

### PWA Conversion
- Implemented Service Worker with cache-first strategy
- Created install banner with dismissible UI
- Added offline support for all static assets
- Configured manifest.json for installability

### Mobile Network Access
- Auto-detection of hostname for mobile devices
- Dynamic proxy URL configuration
- Instructions for local network access

## Browser Support

- Chrome/Edge (recommended for PWA features)
- Safari (iOS 11.3+)
- Firefox
- Opera

## API Rate Limits

The app uses free API tiers:
- CoinGecko: 10-50 calls/minute (public API)
- Updates every 30 seconds to stay within limits

## Future Enhancements

Potential features to add:
- [ ] Price alerts with push notifications
- [ ] Portfolio tracking
- [ ] Multiple cryptocurrency support
- [ ] Historical data export
- [ ] Advanced charting tools
- [ ] User accounts and cloud sync
- [ ] Customizable dashboard widgets
- [ ] Dark mode auto-scheduling

## Deployment Options

### Local Network Only (Current Setup)
- Access via IP address on same WiFi
- No internet exposure
- Requires both servers running

### Public Deployment Options

1. **GitHub Pages** (Frontend only)
   - Free static hosting
   - Requires separate API proxy hosting

2. **Netlify/Vercel** (Frontend)
   - Free tier available
   - Easy deployment from Git
   - Serverless functions for proxy

3. **Heroku/Railway** (Full stack)
   - Can host both frontend and proxy
   - Free tier available (with limitations)

4. **DigitalOcean/AWS** (Full control)
   - Paid hosting
   - Complete control over server

## Troubleshooting

### App won't load on mobile
- Verify both servers are running (frontend on 3002, proxy on 3003)
- Check that mobile and computer are on same WiFi network
- Try accessing `http://[YOUR_IP]:3002` directly in browser first
- Check Windows Firewall isn't blocking incoming connections

### Install button doesn't appear
- PWA install prompts only show on HTTPS or localhost
- Some browsers don't support PWA installation
- May need to access multiple times before prompt appears

### Prices not updating
- Check proxy server is running on port 3003
- Verify internet connection
- Check browser console for API errors
- API may have rate limits - wait a minute and try again

### Theme not saving
- Check browser localStorage is enabled
- Clear cache and reload
- Private/Incognito mode won't persist themes

## License

This project is open source and available for personal and educational use.

## Credits

- Built with vanilla JavaScript
- Chart.js for visualizations
- CoinGecko API for price data
- Design inspired by modern fintech apps

---

**Last Updated**: December 3, 2025

**Current Version**: 1.0.0 (PWA-enabled)
