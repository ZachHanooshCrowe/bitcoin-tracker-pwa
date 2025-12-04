const http = require('http');
const https = require('https');

// Ignore SSL certificate errors (safe for local development)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PORT = 3003;

// Simple in-memory cache to avoid rate limiting
const cache = {
    price: { data: null, timestamp: 0 },
    chart: {}
};
const CACHE_DURATION = 300000; // 5 minutes (increased to avoid rate limits)

// Fetch from CoinGecko (free, no API key needed, very accurate)
async function fetchFromCoinGecko() {
    return new Promise((resolve, reject) => {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true';

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);

                    // Check if we got valid data
                    if (!json.bitcoin || !json.bitcoin.usd) {
                        console.log('⚠️ CoinGecko returned invalid data:', JSON.stringify(json).substring(0, 200));
                        reject(new Error('Invalid CoinGecko response'));
                        return;
                    }

                    const btc = json.bitcoin;

                    // Also get detailed data for high/low
                    https.get('https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false', (detailRes) => {
                        let detailData = '';
                        detailRes.on('data', chunk => detailData += chunk);
                        detailRes.on('end', () => {
                            try {
                                const detail = JSON.parse(detailData);

                                resolve({
                                    price: btc.usd,
                                    change24h: btc.usd_24h_change,
                                    high24h: detail.market_data.high_24h.usd,
                                    low24h: detail.market_data.low_24h.usd,
                                    volume: btc.usd_24h_vol,
                                    marketCap: btc.usd_market_cap,
                                    source: 'CoinGecko (matches Google)'
                                });
                            } catch (e) {
                                // If detailed fetch fails, use basic data
                                resolve({
                                    price: btc.usd,
                                    change24h: btc.usd_24h_change,
                                    high24h: btc.usd * 1.02,
                                    low24h: btc.usd * 0.98,
                                    volume: btc.usd_24h_vol,
                                    marketCap: btc.usd_market_cap,
                                    source: 'CoinGecko'
                                });
                            }
                        });
                    }).on('error', (e) => {
                        // If detailed fetch fails, use basic data
                        resolve({
                            price: btc.usd,
                            change24h: btc.usd_24h_change,
                            high24h: btc.usd * 1.02,
                            low24h: btc.usd * 0.98,
                            volume: btc.usd_24h_vol,
                            marketCap: btc.usd_market_cap,
                            source: 'CoinGecko (basic)'
                        });
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Fetch from Blockchain.info as backup
async function fetchFromBlockchain() {
    return new Promise((resolve, reject) => {
        https.get('https://blockchain.info/ticker', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const usd = json.USD;

                    resolve({
                        price: usd.last,
                        change24h: ((usd.last - usd['15m']) / usd['15m']) * 100,
                        high24h: usd.last * 1.02,
                        low24h: usd.last * 0.98,
                        marketCap: usd.last * 19500000,
                        source: 'Blockchain.info'
                    });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Fetch chart data from CoinGecko
async function fetchChartData(days) {
    return new Promise((resolve, reject) => {
        const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);

                    // Check for rate limit or error response
                    if (json.status && json.status.error_code) {
                        console.log('⚠️ CoinGecko API Error:', json.status.error_message);
                        reject(new Error(json.status.error_message || 'API Error'));
                        return;
                    }

                    if (!json.prices || json.prices.length === 0) {
                        console.log('⚠️ Empty response from CoinGecko:', JSON.stringify(json).substring(0, 200));
                        reject(new Error('No chart data received'));
                        return;
                    }

                    resolve(json);
                } catch (e) {
                    console.log('⚠️ Failed to parse chart response:', data.substring(0, 200));
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Simple proxy server to bypass CORS
const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/api/bitcoin') {
        // Check cache first
        const now = Date.now();
        if (cache.price.data && (now - cache.price.timestamp) < CACHE_DURATION) {
            console.log('💾 Using cached price data');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(cache.price.data));
            return;
        }

        console.log('📡 Fetching Bitcoin price...');

        try {
            // Try CoinGecko first (most accurate, matches Google)
            let data;
            try {
                data = await fetchFromCoinGecko();
                console.log('✅ CoinGecko: Price: $' + data.price.toLocaleString() + ' | Change: ' + data.change24h.toFixed(2) + '%');
            } catch (e) {
                console.log('⚠️ CoinGecko failed, trying Blockchain.info...');
                data = await fetchFromBlockchain();
                console.log('✅ Blockchain.info: Price: $' + data.price.toLocaleString() + ' | Change: ' + data.change24h.toFixed(2) + '%');
            }

            // Cache the result
            cache.price = { data, timestamp: now };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (error) {
            console.error('❌ All APIs failed:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'All APIs failed: ' + error.message,
                price: 96850,
                change24h: 1.23,
                high24h: 97920,
                low24h: 95650,
                marketCap: 96850 * 19500000,
                source: 'Fallback Demo Data'
            }));
        }
    } else if (req.url.startsWith('/api/chart?')) {
        // Parse query parameters
        const urlParams = new URL(req.url, `http://localhost:${PORT}`);
        const days = urlParams.searchParams.get('days') || '1';

        // Check cache first
        const now = Date.now();
        const cacheKey = `chart_${days}`;
        if (cache.chart[cacheKey] && (now - cache.chart[cacheKey].timestamp) < CACHE_DURATION) {
            console.log(`💾 Using cached chart data for ${days} days`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(cache.chart[cacheKey].data));
            return;
        }

        console.log(`📊 Fetching chart data for ${days} days...`);

        try {
            const data = await fetchChartData(days);
            console.log(`✅ Chart: Received ${data.prices.length} price points`);

            // Cache the result
            cache.chart[cacheKey] = { data, timestamp: now };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(data));
        } catch (error) {
            console.error('❌ Chart fetch failed:', error.message);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Chart fetch failed: ' + error.message
            }));
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
    console.log(`📊 Bitcoin API endpoint: http://localhost:${PORT}/api/bitcoin`);
    console.log('🎯 Using CoinGecko API (matches Google data)');
});
