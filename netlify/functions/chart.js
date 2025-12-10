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
                        console.log('⚠️ Empty response from CoinGecko');
                        reject(new Error('No chart data received'));
                        return;
                    }

                    resolve(json);
                } catch (e) {
                    console.log('⚠️ Failed to parse chart response');
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Netlify Serverless Function Handler
exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Parse query parameters
    const days = event.queryStringParameters?.days || '1';

    // Check cache first
    const now = Date.now();
    const cacheKey = `chart_${days}`;
    if (cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION) {
        console.log(`💾 Using cached chart data for ${days} days`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(cache[cacheKey].data)
        };
    }

    console.log(`📊 Fetching chart data for ${days} days...`);

    try {
        const data = await fetchChartData(days);
        console.log(`✅ Chart: Received ${data.prices.length} price points`);

        // Cache the result
        cache[cacheKey] = { data, timestamp: now };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('❌ Chart fetch failed:', error.message);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: 'Chart fetch failed: ' + error.message
            })
        };
    }
};
