const https = require('https');

// Simple in-memory cache to avoid rate limiting
const cache = {};
const CACHE_DURATION = 300000; // 5 minutes

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

// Vercel Serverless Function Handler
module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Parse query parameters
    const days = req.query.days || '1';

    // Check cache first
    const now = Date.now();
    const cacheKey = `chart_${days}`;
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`💾 Using cached chart data for ${days} days`);
        res.status(200).json(cache[cacheKey].data);
        return;
    }

    console.log(`📊 Fetching chart data for ${days} days...`);

    try {
        const data = await fetchChartData(days);
        console.log(`✅ Chart: Received ${data.prices.length} price points`);

        // Cache the result
        cache[cacheKey] = { data, timestamp: now };

        res.status(200).json(data);
    } catch (error) {
        console.error('❌ Chart fetch failed:', error.message);
        res.status(500).json({
            error: 'Chart fetch failed: ' + error.message
        });
    }
};
