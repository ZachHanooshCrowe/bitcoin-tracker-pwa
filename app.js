// Bitcoin Tracker & Education App
// Humor Engine with Mixed Reactions

// API Configuration - Use local proxy to bypass CORS
// Auto-detect if accessing from mobile device on same network or production
const getProxyBaseUrl = () => {
    const hostname = window.location.hostname;

    // In production (Vercel, Netlify, etc), use relative paths
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') ||
        (!hostname.includes('localhost') && !hostname.includes('127.0.0.1') &&
         !hostname.match(/^\d+\.\d+\.\d+\.\d+$/))) {
        return ''; // Use relative paths for production
    }

    // For local network IP addresses (mobile testing on same WiFi)
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `http://${hostname}:3003`;
    }

    // For localhost development
    return 'http://localhost:3003';
};

const PROXY_BASE = getProxyBaseUrl();

const API_SOURCES = {
    localProxy: {
        price: `${PROXY_BASE}/api/bitcoin`,
        chart: `${PROXY_BASE}/api/chart`
    },
    coingecko: {
        price: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true',
        detailed: 'https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false',
        chart: 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart'
    },
    coincap: {
        price: 'https://api.coincap.io/v2/assets/bitcoin'
    },
    binance: {
        price: 'https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'
    }
};

// Legacy constants for backward compatibility
const COINGECKO_API = API_SOURCES.coingecko.price;
const DETAILED_API = API_SOURCES.coingecko.detailed;
const CHART_API = API_SOURCES.localProxy.chart; // Use proxy for chart data

// State
let currentPrice = 0;
let priceChange24h = 0;
let previousPrice = 0;
let priceChart = null;
let currentTimeframe = 1; // days
let lastRefreshTime = 0; // Track last refresh to prevent spam
let isRefreshing = false; // Prevent multiple simultaneous refreshes
let soundEnabled = true; // Sound effects toggle
let audioContext = null; // Web Audio API context
let panicModeActive = false; // Panic mode state
let panicTimer = null; // Panic mode countdown timer
let panicTimeRemaining = 30; // Panic cooldown time in seconds
let triviaQuestions = []; // Trivia questions array
let currentQuestionIndex = 0; // Current question index
let triviaScore = 0; // Trivia score
let answeredCurrentQuestion = false; // Track if current question was answered
let currentMeme = null; // Currently generated meme canvas
let memeTemplates = {}; // Meme templates
let whaleTransactions = []; // Whale transactions feed
let whaleRefreshInterval = null; // Whale auto-refresh interval
let sentimentData = null; // Social sentiment tracker data
let sentimentRefreshInterval = null; // Sentiment auto-refresh interval
let priceAlerts = []; // Price alerts array
let notificationPermission = 'default'; // Notification permission status
let alertIdCounter = 1; // Counter for alert IDs
let lastEmojiRainTime = 0; // Track last emoji rain to prevent spam
let emojiRainActive = false; // Track if emoji rain is currently active
let currentTheme = 'light'; // Current theme
let copeCounter = 0; // Count of copes generated
let chatMessages = []; // Chat message history
let chatInterval = null; // Chat message generation interval
let onlineCount = 247; // Simulated online users

// Humor Database - Mixed reactions (encouraging, sarcastic, memes)
const humorReactions = {
    moonShot: [
        {
            emoji: '🚀🌕',
            title: 'TO THE MOON!',
            message: 'WEN LAMBO? NOW LAMBO! Bitcoin is absolutely mooning! Your portfolio is looking thicc! Diamond hands paying off! 💎🙌',
            meme: '📈💰🎉'
        },
        {
            emoji: '🤑💎',
            title: 'GENERATIONAL WEALTH UNLOCKED',
            message: 'This is it! This is the pump we\'ve been waiting for! Time to screenshot your portfolio and pretend you knew this would happen all along!',
            meme: '👑🏆💸'
        }
    ],
    bigGain: [
        {
            emoji: '😎📈',
            title: 'Nice Gains, Chad',
            message: 'Looking good! Up significantly today. The hodlers are eating well tonight. Maybe don\'t check your ex\'s Instagram, check your portfolio instead!',
            meme: '💪🐂'
        },
        {
            emoji: '🎯✨',
            title: 'Bullish Vibes',
            message: 'Bitcoin is pumping and so is your confidence! Remember: past performance doesn\'t guarantee future results, but it feels GREAT right now!',
            meme: '🔥📊'
        }
    ],
    smallGain: [
        {
            emoji: '🙂📊',
            title: 'Slow and Steady',
            message: 'Small gains are still gains! Rome wasn\'t built in a day, and neither is generational wealth. Keep stacking those sats!',
            meme: '🐢💰'
        },
        {
            emoji: '😌💚',
            title: 'Green is Green',
            message: 'Not every day is a moon mission, but we\'ll take the W! Up is up, no matter how small. Diamond hands don\'t panic over small moves.',
            meme: '✅💎'
        }
    ],
    flat: [
        {
            emoji: '😐📊',
            title: 'Crab Market Engaged',
            message: 'Bitcoin is moving sideways like a crab on the beach. Time to touch grass, check back later. Or don\'t. The chart isn\'t doing anything exciting anyway.',
            meme: '🦀💤'
        },
        {
            emoji: '🤷‍♂️',
            title: 'Meh. Could Be Worse.',
            message: 'Perfectly balanced, as all things should be. Not up, not down, just... existing. At least you\'re not panic selling. Yet.',
            meme: '😶📉📈'
        },
        {
            emoji: '☕😴',
            title: 'Calm Before the Storm?',
            message: 'Nothing to see here folks! Either accumulation phase or everyone forgot Bitcoin exists. Time for a coffee break ☕',
            meme: '⏸️🤔'
        }
    ],
    smallLoss: [
        {
            emoji: '💎🙌',
            title: 'DIAMOND HANDS ACTIVATED',
            message: 'This is just a small dip! A buying opportunity! The weak hands are getting shaken out. You? You\'re HODLING like a champion! We don\'t panic here!',
            meme: '💪🛡️'
        },
        {
            emoji: '🧘‍♂️',
            title: 'Zoom Out, Breathe',
            message: 'Down a few percent? That\'s just Tuesday in crypto! Remember: "Time in the market beats timing the market." Also remember: you\'re dead inside now.',
            meme: '😌📉'
        },
        {
            emoji: '🎢😅',
            title: 'Volatility = Feature',
            message: 'You signed up for this! Bitcoin isn\'t for the faint of heart. This is just a healthy correction. Right? RIGHT?! Actually, don\'t check your portfolio.',
            meme: '🎭💦'
        }
    ],
    bigLoss: [
        {
            emoji: '😱📉',
            title: 'HODL MODE: MAXIMUM',
            message: 'Okay, this is fine. Everything is fine. You only lose if you sell! This is just a dip before the rip... probably. Maybe. Hopefully? Delete your trading app!',
            meme: '🔥💸😭'
        },
        {
            emoji: '🤡',
            title: 'Bought the Top?',
            message: 'Welcome to crypto! Where you buy high and sell low like a true degen! But seriously, this is temporary. Zoom out to the 4-year chart and cope harder!',
            meme: '🎪😢'
        },
        {
            emoji: '💀',
            title: 'Pain. Suffering. HODL.',
            message: 'This is character building! Your ancestors survived wars, you can survive a red portfolio. Remember: you haven\'t lost until you sell. So don\'t sell, you paperhanded coward!',
            meme: '⚰️📉💎'
        },
        {
            emoji: '🙃',
            title: 'Upside Down Gains',
            message: 'If you turn your phone upside down, it looks like you\'re up! Galaxy brain move! Also this is definitely not financial advice because clearly we have no idea what we\'re doing.',
            meme: '🔄🤯'
        }
    ],
    crash: [
        {
            emoji: '🔥💸',
            title: 'FIRE SALE! EVERYTHING MUST GO!',
            message: 'Okay don\'t panic. Actually DO panic but also don\'t sell! This is a MASSIVE buying opportunity! Or a sign to quit crypto forever. You decide! (Hint: HODL)',
            meme: '🚨💀🎢'
        },
        {
            emoji: '📉😭',
            title: 'GUH.',
            message: 'Is this what they mean by "generational wealth transfer"? Because it feels like wealth is transferring FROM you. Stay strong soldier. The bears can\'t hurt you if you don\'t look.',
            meme: '🐻💔😰'
        }
    ]
};

// Calming Messages for Panic Mode
const calmingMessages = [
    "Take a deep breath. You only lose if you sell. Step away and come back with a clear mind. 🧘‍♂️",
    "Go touch grass. Literally. The charts will still be here when you get back. The world is bigger than Bitcoin. 🌿",
    "Remember: Bitcoin has crashed 90% multiple times and always came back. Zoom out. This too shall pass. 📊",
    "Your mental health is worth more than any gains. Take this time to center yourself. Everything will be okay. 💚",
    "The best investment you can make right now is in your own peace of mind. Go for a walk. 🚶",
    "Forced HODL mode engaged! You can't panic sell if you can't see the charts. Diamond hands activated! 💎🙌",
    "This cooldown is protecting you from yourself. Future you will thank present you for this break. ⏰",
    "Bitcoin has survived: Mt. Gox, China bans (5+ times), COVID crash, FTX collapse, and countless 'deaths'. It'll be fine. You'll be fine. 🛡️",
    "Go call a friend. Pet your dog. Make a coffee. Do literally anything except stare at red candles. ☕🐕",
    "You're not a trader. You're an investor. Traders check charts. Investors check years. Remember why you're here. 🎯",
    "The market doesn't care about your feelings. Take this time to remember that your feelings shouldn't dictate market decisions either. 😌",
    "If you're stressed about Bitcoin, you've invested more than you can afford to lose. This is a lesson. Learn it. 📚",
    "Close your laptop. Put down your phone. Go experience the real world. It's still pretty cool out there. 🌍",
    "Warren Buffett holds stocks for decades. You can wait 30 seconds before looking at charts again. Patience, young grasshopper. 🦗",
    "This panic button has been clicked by thousands before you. You're not alone in this. We all freak out sometimes. It's okay. 🤝"
];

// Bitcoin Trivia Questions Database
const triviaQuestionsBank = [
    {
        question: "Who is the mysterious creator of Bitcoin?",
        answers: ["Satoshi Nakamoto", "Elon Musk", "Vitalik Buterin", "Charlie Lee"],
        correct: 0,
        funFact: "Satoshi Nakamoto's true identity remains unknown to this day. They disappeared in 2010 and are estimated to hold about 1 million BTC, worth billions! 🕵️"
    },
    {
        question: "What is the maximum supply of Bitcoin that will ever exist?",
        answers: ["21 billion", "21 million", "100 million", "Unlimited"],
        correct: 1,
        funFact: "Only 21 million Bitcoin will ever exist! This scarcity is built into the code, making Bitcoin deflationary. Currently, about 19.5 million have been mined. ⛏️"
    },
    {
        question: "What was the first real-world Bitcoin transaction?",
        answers: ["Buying a Tesla", "Buying 2 pizzas", "Buying a house", "Buying coffee"],
        correct: 1,
        funFact: "In May 2010, Laszlo Hanyecz paid 10,000 BTC for 2 Papa John's pizzas. At today's prices, that's worth hundreds of millions of dollars! 🍕💀"
    },
    {
        question: "What is 'mining' in Bitcoin?",
        answers: ["Digging for physical coins", "Validating transactions and creating new blocks", "Trading Bitcoin on exchanges", "Stealing Bitcoin"],
        correct: 1,
        funFact: "Mining is the process of using computational power to solve complex math problems, which secures the network and creates new Bitcoin. It's called 'mining' as an analogy to gold mining! 💻⛏️"
    },
    {
        question: "What happens to Bitcoin every 4 years?",
        answers: ["The price doubles", "The Halving - mining rewards cut in half", "All Bitcoin gets deleted", "Trading stops for a day"],
        correct: 1,
        funFact: "The 'Halving' reduces mining rewards by 50% every 4 years (210,000 blocks). This makes Bitcoin increasingly scarce over time. The next halving is in 2028! 📉➡️📈"
    },
    {
        question: "What is the smallest unit of Bitcoin called?",
        answers: ["A bit", "A coin", "A satoshi", "A crypto"],
        correct: 2,
        funFact: "A satoshi (named after Bitcoin's creator) is 0.00000001 BTC. This means 1 Bitcoin = 100 million satoshis! Most people will likely transact in sats, not whole bitcoins. ⚡"
    },
    {
        question: "What technology underlies Bitcoin?",
        answers: ["Cloudchain", "Blockchain", "Datachain", "Linkchain"],
        correct: 1,
        funFact: "Blockchain is a distributed ledger that records all Bitcoin transactions in chronological 'blocks' that are cryptographically linked together. It's transparent, immutable, and decentralized! 🔗"
    },
    {
        question: "How long does it take to mine one Bitcoin block?",
        answers: ["1 minute", "10 minutes", "1 hour", "1 day"],
        correct: 1,
        funFact: "Bitcoin's algorithm adjusts difficulty so that a new block is mined approximately every 10 minutes, regardless of how much computing power is on the network. This consistency is crucial for security! ⏰"
    },
    {
        question: "What was Bitcoin's price when it first started trading?",
        answers: ["$1", "$10", "Less than $0.01", "$100"],
        correct: 2,
        funFact: "Bitcoin's first recorded price was less than $0.01 in 2009! Early adopters could buy thousands of Bitcoin for just a few dollars. Talk about a missed opportunity! 😱"
    },
    {
        question: "What does 'HODL' mean in Bitcoin culture?",
        answers: ["Hold On for Dear Life", "A typo of 'hold' that became a meme", "Heavily Optimized Digital Ledger", "High Order Decentralized Limit"],
        correct: 1,
        funFact: "HODL originated from a drunk forum post in 2013 where someone misspelled 'hold' during a crash. It became a legendary meme meaning to hold Bitcoin through volatility rather than panic selling! 💎🙌"
    },
    {
        question: "What year was Bitcoin created?",
        answers: ["2007", "2008", "2009", "2010"],
        correct: 2,
        funFact: "Bitcoin was created in 2009 by Satoshi Nakamoto. The Genesis Block was mined on January 3, 2009, containing the message: 'The Times 03/Jan/2009 Chancellor on brink of second bailout for banks.' 📰"
    },
    {
        question: "What is a Bitcoin wallet?",
        answers: ["A physical wallet for coins", "Software that stores private keys", "A bank account", "A mining device"],
        correct: 1,
        funFact: "A Bitcoin wallet doesn't actually store Bitcoin - it stores the private keys that prove ownership of Bitcoin on the blockchain! Your coins are always on the blockchain. 🔑"
    },
    {
        question: "How many confirmations are typically required for a Bitcoin transaction?",
        answers: ["1", "3", "6", "10"],
        correct: 2,
        funFact: "Most exchanges require 6 confirmations (about 60 minutes) to consider a transaction fully confirmed and irreversible. Each confirmation makes a double-spend attack exponentially harder! ✅"
    },
    {
        question: "What is Bitcoin's all-time high price (as of 2024)?",
        answers: ["$50,000", "$69,000", "$100,000", "$120,000"],
        correct: 1,
        funFact: "Bitcoin reached its all-time high of approximately $69,000 in November 2021. Many believe this is just the beginning though! 🚀"
    },
    {
        question: "What does 'proof of work' mean?",
        answers: ["Proving you did your homework", "Computational evidence miners solved puzzles", "Work certification", "Employment proof"],
        correct: 1,
        funFact: "Proof of Work is Bitcoin's consensus mechanism where miners compete to solve cryptographic puzzles. The first to solve it gets to add the next block and earn rewards! 💪"
    },
    {
        question: "How many Bitcoin are mined per block (as of 2024)?",
        answers: ["50 BTC", "25 BTC", "12.5 BTC", "6.25 BTC"],
        correct: 3,
        funFact: "After the 2020 halving, miners receive 6.25 BTC per block. The next halving in 2024 will reduce this to 3.125 BTC! 📊"
    },
    {
        question: "What is the Bitcoin whitepaper title?",
        answers: ["Bitcoin: Digital Gold", "Bitcoin: A Peer-to-Peer Electronic Cash System", "Cryptocurrency Revolution", "Digital Money for Everyone"],
        correct: 1,
        funFact: "The whitepaper is titled 'Bitcoin: A Peer-to-Peer Electronic Cash System' and is only 9 pages long! It laid the foundation for the entire crypto industry. 📄"
    },
    {
        question: "What is a 'node' in Bitcoin?",
        answers: ["A mining facility", "A computer running Bitcoin software", "A wallet", "An exchange"],
        correct: 1,
        funFact: "A node is any computer running Bitcoin software that validates and relays transactions. Running a full node helps decentralize and secure the network! 🖥️"
    },
    {
        question: "What does 'FUD' stand for?",
        answers: ["Fully Unified Data", "Fear, Uncertainty, and Doubt", "Future Utility Determination", "Financial Update Digest"],
        correct: 1,
        funFact: "FUD refers to spreading negative, misleading, or false information to create fear and drive down prices. Stay skeptical and do your own research! 🚫"
    },
    {
        question: "What is the Bitcoin Genesis Block?",
        answers: ["The largest block", "The first block ever mined", "A bug in the code", "The final block"],
        correct: 1,
        funFact: "The Genesis Block (Block 0) was mined by Satoshi on January 3, 2009. It contained a 50 BTC reward that can never be spent! 🌟"
    },
    {
        question: "What is '51% attack'?",
        answers: ["A bug affecting 51% of users", "When someone controls majority of mining power", "A 51% price drop", "A tax on transactions"],
        correct: 1,
        funFact: "A 51% attack occurs when a single entity controls more than 50% of the network's mining power, potentially allowing them to reverse transactions. Bitcoin's size makes this extremely expensive! ⚠️"
    },
    {
        question: "What does 'mempool' mean?",
        answers: ["Memory pool of unconfirmed transactions", "A mining pool", "A storage device", "A type of wallet"],
        correct: 0,
        funFact: "The mempool is where unconfirmed transactions wait to be included in a block. When the mempool is full, transaction fees rise as users compete for space! 📮"
    },
    {
        question: "What is 'hash rate'?",
        answers: ["Transaction speed", "Computing power securing the network", "Price volatility", "Number of users"],
        correct: 1,
        funFact: "Hash rate measures the total computational power mining Bitcoin. A higher hash rate means more security! As of 2024, it's measured in exahashes per second (EH/s). 💪"
    },
    {
        question: "What is a 'cold wallet'?",
        answers: ["A wallet in Antarctica", "Offline storage for cryptocurrency", "A frozen account", "A wallet with no funds"],
        correct: 1,
        funFact: "Cold wallets store private keys offline (like hardware wallets or paper wallets), making them much safer from hackers. Hot wallets are connected to the internet. 🧊"
    },
    {
        question: "What is 'difficulty adjustment' in Bitcoin?",
        answers: ["Making math problems harder", "Auto-adjusting mining difficulty every 2016 blocks", "Changing transaction fees", "Updating software"],
        correct: 1,
        funFact: "Every 2016 blocks (about 2 weeks), Bitcoin automatically adjusts mining difficulty to maintain the 10-minute block time, regardless of hash rate changes! 🎯"
    },
    {
        question: "What does 'whale' mean in crypto?",
        answers: ["A large marine animal", "Someone holding massive amounts of crypto", "A scam", "A trading bot"],
        correct: 1,
        funFact: "Whales are individuals or entities holding huge amounts of Bitcoin. Their transactions can significantly impact the market price! 🐋"
    },
    {
        question: "What is 'Bitcoin Pizza Day'?",
        answers: ["May 22", "January 3", "April 1", "December 31"],
        correct: 0,
        funFact: "May 22 is Bitcoin Pizza Day, commemorating the first real-world Bitcoin transaction where 10,000 BTC bought 2 pizzas. Now worth hundreds of millions! 🍕"
    },
    {
        question: "What is 'double spending'?",
        answers: ["Buying two items", "Spending the same Bitcoin twice", "Spending double your balance", "A budgeting method"],
        correct: 1,
        funFact: "Double spending means using the same Bitcoin in multiple transactions. Bitcoin's blockchain prevents this through consensus and confirmations! 🚫"
    },
    {
        question: "What is a 'seed phrase'?",
        answers: ["A farming term", "12-24 words to recover your wallet", "A password", "A transaction ID"],
        correct: 1,
        funFact: "Your seed phrase (recovery phrase) is typically 12-24 words that can recover your entire wallet. Never share it with anyone and store it securely! 🌱"
    },
    {
        question: "What is 'Lightning Network'?",
        answers: ["Fast internet", "A layer-2 scaling solution for Bitcoin", "A mining pool", "A new cryptocurrency"],
        correct: 1,
        funFact: "Lightning Network enables instant, low-cost Bitcoin transactions by creating payment channels off the main blockchain. Perfect for small everyday purchases! ⚡"
    },
    {
        question: "What does 'FOMO' mean?",
        answers: ["Fear Of Missing Out", "For Only Market Orders", "Financial Operations Management", "Future Outlook Monthly"],
        correct: 0,
        funFact: "FOMO is the anxiety that you're missing out on profits, often leading to impulsive buying at high prices. Don't let emotions drive your decisions! 😰"
    },
    {
        question: "What is 'hash'?",
        answers: ["A breakfast food", "A cryptographic output from an algorithm", "A type of wallet", "A trading strategy"],
        correct: 1,
        funFact: "A hash is the output of a cryptographic function. Bitcoin uses SHA-256 hashing - the same data always produces the same hash, but it's impossible to reverse! 🔐"
    },
    {
        question: "What is 'Segwit'?",
        answers: ["A new coin", "Segregated Witness - a protocol upgrade", "A wallet type", "A mining technique"],
        correct: 1,
        funFact: "Segregated Witness (SegWit) was activated in 2017 to increase transaction capacity and fix transaction malleability. It separates signature data from transaction data! 📝"
    },
    {
        question: "What does 'pump and dump' mean?",
        answers: ["Mining equipment", "Artificially inflating price then selling", "A trading bot", "A legitimate strategy"],
        correct: 1,
        funFact: "Pump and dump is an illegal scheme where scammers artificially inflate an asset's price, then sell at the peak, leaving others with losses. Always be cautious! ⚠️"
    },
    {
        question: "What is 'stacking sats'?",
        answers: ["A building game", "Regularly accumulating small amounts of Bitcoin", "A staking method", "A scam"],
        correct: 1,
        funFact: "Stacking sats means consistently buying small amounts of Bitcoin (satoshis) over time, similar to dollar-cost averaging. Every sat counts! 💰"
    },
    {
        question: "What is 'on-chain' analysis?",
        answers: ["Wearing jewelry", "Analyzing blockchain transaction data", "A type of wallet", "Mining analysis"],
        correct: 1,
        funFact: "On-chain analysis involves studying blockchain data to understand network activity, whale movements, and market trends. The blockchain is completely transparent! 📊"
    },
    {
        question: "What is a 'fork' in crypto?",
        answers: ["Eating utensil", "A split in the blockchain creating new rules", "A wallet feature", "A bug"],
        correct: 1,
        funFact: "A fork occurs when the blockchain splits into two paths. Hard forks create new cryptocurrencies (like Bitcoin Cash), while soft forks are backward-compatible upgrades! 🍴"
    },
    {
        question: "What is 'KYC'?",
        answers: ["Keep Your Coins", "Know Your Customer - identity verification", "Keyboard Your Code", "Kill Your Cash"],
        correct: 1,
        funFact: "KYC (Know Your Customer) requires exchanges to verify user identities to comply with regulations. Some argue it goes against Bitcoin's privacy ideals! 🆔"
    },
    {
        question: "What does 'rekt' mean?",
        answers: ["Wrecked - suffering heavy losses", "A reward token", "Retirement account", "Recording transactions"],
        correct: 0,
        funFact: "Rekt is slang for 'wrecked' - when someone suffers devastating trading losses. Don't get rekt - never invest more than you can afford to lose! 💥"
    },
    {
        question: "What is 'market cap'?",
        answers: ["A hat at the market", "Total value of all circulating coins", "Maximum price", "Trading limit"],
        correct: 1,
        funFact: "Market cap = current price × circulating supply. Bitcoin's market cap is over $500 billion, making it larger than many major companies! 📈"
    },
    {
        question: "What is 'DCA'?",
        answers: ["Digital Currency Algorithm", "Dollar Cost Averaging", "Decentralized Cash Account", "Daily Crypto Analysis"],
        correct: 1,
        funFact: "DCA means investing a fixed amount regularly (e.g., $100/week) regardless of price. This strategy reduces the impact of volatility and removes emotion! 💵"
    },
    {
        question: "What are 'gas fees'?",
        answers: ["Car fuel costs", "Transaction fees (mainly on Ethereum)", "Bitcoin fees", "Mining rewards"],
        correct: 1,
        funFact: "Gas fees are transaction costs, mainly used in Ethereum. Bitcoin uses 'transaction fees' or 'miner fees' instead. Both compensate network validators! ⛽"
    },
    {
        question: "What is 'private key'?",
        answers: ["A secret password for your wallet", "A public address", "A mining tool", "An exchange login"],
        correct: 0,
        funFact: "Your private key is like a password that proves ownership of your Bitcoin. If someone gets your private key, they can steal your funds! Never share it! 🔑"
    },
    {
        question: "What is 'public key'?",
        answers: ["A key for everyone", "Your wallet address that can be shared", "A mining device", "A password"],
        correct: 1,
        funFact: "Your public key (wallet address) is like your bank account number - safe to share for receiving Bitcoin. It's mathematically derived from your private key! 📫"
    },
    {
        question: "What does 'DYOR' mean?",
        answers: ["Do Your Own Research", "Don't You Own Resources", "Daily Yield On Returns", "Digital Year Of Returns"],
        correct: 0,
        funFact: "DYOR is crucial advice - always research projects yourself rather than blindly following others. Don't trust, verify! 🔍"
    },
    {
        question: "What is 'bear market'?",
        answers: ["Market full of bears", "Prolonged period of falling prices", "Strong market", "Sideways market"],
        correct: 1,
        funFact: "Bear markets are characterized by falling prices and pessimism. They're named because bears swipe downward! Markets are cyclical - bears eventually turn to bulls! 🐻"
    },
    {
        question: "What is 'bull market'?",
        answers: ["Market full of bulls", "Prolonged period of rising prices", "Weak market", "Flat market"],
        correct: 1,
        funFact: "Bull markets feature rising prices and optimism. They're named because bulls thrust upward! Bull markets often see extreme FOMO and euphoria! 🐂"
    },
    {
        question: "What is 'ATH'?",
        answers: ["A Trading Hub", "All-Time High - highest price ever", "Average Transaction Hour", "Automated Trade Handler"],
        correct: 1,
        funFact: "ATH means All-Time High - the highest price an asset has ever reached. Bitcoin has reached new ATHs multiple times throughout its history! 🎯"
    },
    {
        question: "What is 'ATL'?",
        answers: ["Atlanta", "All-Time Low - lowest price ever", "Automated Trading Limit", "Advanced Trading Level"],
        correct: 1,
        funFact: "ATL means All-Time Low - the lowest price an asset has ever reached. Bitcoin's ATL was essentially $0 when it first started! 📉"
    },
    {
        question: "What is 'market order'?",
        answers: ["Ordering from a market", "Buying/selling immediately at current price", "A pending order", "A limit order"],
        correct: 1,
        funFact: "Market orders execute immediately at the best available price. Great for quick trades but you might not get the exact price you saw! ⚡"
    },
    {
        question: "What is 'limit order'?",
        answers: ["Trading limit", "Order that executes at a specific price or better", "Maximum order size", "Restricted trading"],
        correct: 1,
        funFact: "Limit orders let you set the exact price you want to buy or sell at. They won't execute until the market reaches your price! 🎯"
    },
    {
        question: "What is 'liquidity'?",
        answers: ["Water content", "How easily an asset can be bought/sold", "Profit margin", "Price volatility"],
        correct: 1,
        funFact: "Liquidity measures how quickly you can buy or sell without significantly affecting the price. Bitcoin is one of the most liquid cryptocurrencies! 💧"
    },
    {
        question: "What is 'volatility'?",
        answers: ["Volume of trading", "Price fluctuation intensity", "Number of traders", "Market cap"],
        correct: 1,
        funFact: "Volatility measures how dramatically prices swing. Bitcoin is known for high volatility - it can move 10%+ in a single day! 🎢"
    },
    {
        question: "What is 'resistance level'?",
        answers: ["Price ceiling that's hard to break through", "Support level", "Trading volume", "Market cap"],
        correct: 0,
        funFact: "Resistance is a price level where selling pressure is strong enough to prevent the price from rising further. Breaking resistance often leads to rallies! 📊"
    },
    {
        question: "What is 'support level'?",
        answers: ["Customer service", "Price floor that's hard to break below", "Resistance level", "Profit target"],
        correct: 1,
        funFact: "Support is a price level where buying pressure is strong enough to prevent the price from falling further. Breaking support can trigger sell-offs! 📉"
    },
    {
        question: "What is 'candlestick chart'?",
        answers: ["A chart with candles", "Visual representation of price movement", "A trading strategy", "A type of analysis"],
        correct: 1,
        funFact: "Candlestick charts show open, close, high, and low prices for a time period. Green/white candles indicate price increases, red/black indicate decreases! 🕯️"
    },
    {
        question: "What is 'moving average'?",
        answers: ["Average moving speed", "Average price over a specific time period", "Trading volume", "Market sentiment"],
        correct: 1,
        funFact: "Moving averages smooth out price data to identify trends. Common ones are 50-day and 200-day MAs. When price crosses them, it can signal trend changes! 📈"
    },
    {
        question: "What is 'RSI'?",
        answers: ["Real Stock Index", "Relative Strength Index - momentum indicator", "Rapid Sell Indicator", "Return Strength Investment"],
        correct: 1,
        funFact: "RSI measures momentum on a scale of 0-100. Above 70 suggests overbought (might fall), below 30 suggests oversold (might rise). Use with caution! 📊"
    },
    {
        question: "What is 'MACD'?",
        answers: ["Moving Average Convergence Divergence", "Market Average Calculation Data", "Maximum Annual Crypto Dividend", "Monthly Asset Comparison Document"],
        correct: 0,
        funFact: "MACD is a trend-following momentum indicator that shows the relationship between two moving averages. Traders watch for signal line crossovers! 📉📈"
    },
    {
        question: "What is 'Fibonacci retracement'?",
        answers: ["A Italian trader", "Technical analysis tool using key percentages", "A chart pattern", "A trading bot"],
        correct: 1,
        funFact: "Fibonacci retracement uses key levels (23.6%, 38.2%, 50%, 61.8%) to predict potential support/resistance areas. Based on the Fibonacci sequence! 🔢"
    },
    {
        question: "What is 'paper hands'?",
        answers: ["Documents", "Selling too early out of fear", "Strong holder", "Day trader"],
        correct: 1,
        funFact: "Paper hands describes someone who sells at the first sign of volatility or minor losses. The opposite of diamond hands! 📄🙌"
    },
    {
        question: "What is 'diamond hands'?",
        answers: ["Expensive jewelry", "Holding through extreme volatility", "Weak hands", "Quick seller"],
        correct: 1,
        funFact: "Diamond hands means holding your investment through ups and downs without selling. Often associated with conviction in long-term value! 💎🙌"
    },
    {
        question: "What is 'rug pull'?",
        answers: ["Cleaning carpets", "Scam where creators abandon project with funds", "Legitimate exit", "Market correction"],
        correct: 1,
        funFact: "A rug pull is when developers abandon a project and run away with investors' money. Always research teams and projects before investing! 🚫"
    },
    {
        question: "What is 'shill'?",
        answers: ["A type of wallet", "Promoting a coin for personal gain", "A trading strategy", "A technical indicator"],
        correct: 1,
        funFact: "Shilling means aggressively promoting a cryptocurrency, often because you own it and want others to buy. Be wary of shameless shilling! 📢"
    },
    {
        question: "What is 'bag holder'?",
        answers: ["Shopping enthusiast", "Someone stuck holding a losing investment", "Successful investor", "Market maker"],
        correct: 1,
        funFact: "A bag holder is someone holding a cryptocurrency that has dropped significantly in value, often unable or unwilling to sell at a loss! 💼"
    },
    {
        question: "What is 'moon'?",
        answers: ["Earth's satellite", "Slang for massive price increase", "A new coin", "Market crash"],
        correct: 1,
        funFact: "When someone says 'to the moon!' they're expressing hope or belief that the price will skyrocket. Often accompanied by 🚀 emojis! 🌙"
    },
    {
        question: "What is 'dip'?",
        answers: ["A snack", "Temporary price decline", "All-time high", "Steady price"],
        correct: 1,
        funFact: "'Buy the dip' means purchasing during temporary price declines. The goal is to get in at a better price before the recovery! 📉"
    },
    {
        question: "What is 'correction'?",
        answers: ["Fixing mistakes", "Price decline of 10%+ after a rally", "Small price drop", "Market manipulation"],
        correct: 1,
        funFact: "A correction is a decline of 10% or more from recent highs, considered a normal and healthy part of market cycles! 📊"
    },
    {
        question: "What is 'dead cat bounce'?",
        answers: ["A sad event", "Temporary recovery after a major drop", "Strong recovery", "New trend"],
        correct: 1,
        funFact: "A dead cat bounce is a brief price recovery during a prolonged decline, giving false hope before continuing down. Stay cautious during bounces! 🐱"
    },
    {
        question: "What is 'bag'?",
        answers: ["Shopping bag", "Amount of a specific cryptocurrency you hold", "Trading strategy", "Wallet type"],
        correct: 1,
        funFact: "Your 'bag' refers to your holdings of a particular cryptocurrency. 'Heavy bags' means holding large amounts, often at a loss! 💰"
    },
    {
        question: "What is 'alt season'?",
        answers: ["Alternative music festival", "Period when altcoins outperform Bitcoin", "Winter", "Bear market"],
        correct: 1,
        funFact: "Alt season occurs when alternative cryptocurrencies (altcoins) see bigger gains than Bitcoin. Bitcoin usually leads the market first! 🎢"
    },
    {
        question: "What is 'stable coin'?",
        answers: ["A very stable investment", "Cryptocurrency pegged to stable asset like USD", "Bitcoin", "Any old coin"],
        correct: 1,
        funFact: "Stablecoins like USDT and USDC are designed to maintain a 1:1 peg with the US dollar, providing stability in the volatile crypto market! 💵"
    },
    {
        question: "What is 'DEX'?",
        answers: ["Dexterity stat", "Decentralized Exchange", "Digital Exchange X", "Default Exchange"],
        correct: 1,
        funFact: "DEXs like Uniswap let you trade cryptocurrencies peer-to-peer without a central authority. No KYC, but you're responsible for your own security! 🔄"
    },
    {
        question: "What is 'CEX'?",
        answers: ["Central Exchange", "Centralized Exchange", "Currency Exchange X", "Crypto Exchange"],
        correct: 1,
        funFact: "CEXs like Coinbase and Binance are traditional cryptocurrency exchanges run by companies. More user-friendly but require trusting the platform! 🏦"
    },
    {
        question: "What is 'yield farming'?",
        answers: ["Growing crops", "Earning rewards by providing liquidity", "Mining Bitcoin", "Trading strategy"],
        correct: 1,
        funFact: "Yield farming involves lending or staking crypto to earn interest or rewards. Can be highly profitable but carries risks! 🌾"
    },
    {
        question: "What is 'APY'?",
        answers: ["A Person's Yield", "Annual Percentage Yield", "Always Profit Yearly", "Average Price Yearly"],
        correct: 1,
        funFact: "APY shows the total return on an investment over a year, including compound interest. Be cautious of unrealistic APYs - they often come with high risk! 📊"
    },
    {
        question: "What is 'smart contract'?",
        answers: ["A clever agreement", "Self-executing contract coded on blockchain", "Legal document", "Trading bot"],
        correct: 1,
        funFact: "Smart contracts automatically execute when conditions are met, without intermediaries. Ethereum popularized them, but they're coming to Bitcoin too! 📝"
    },
    {
        question: "What is 'TVL'?",
        answers: ["Total Value Locked", "Trading Volume Level", "Typical Value Limit", "Transaction Validation Layer"],
        correct: 0,
        funFact: "TVL measures the total value of assets locked in a DeFi protocol. Higher TVL generally indicates more trust and usage! 🔒"
    },
    {
        question: "What is 'impermanent loss'?",
        answers: ["Temporary memory loss", "Potential loss from providing liquidity", "Permanent market crash", "Tax loss"],
        correct: 1,
        funFact: "Impermanent loss occurs when providing liquidity to a pool and the price ratio changes. It's 'impermanent' because it can reverse if prices revert! ⚠️"
    },
    {
        question: "What is 'wrapped Bitcoin' (WBTC)?",
        answers: ["Gift-wrapped BTC", "Bitcoin token on Ethereum blockchain", "Encrypted Bitcoin", "Cold storage"],
        correct: 1,
        funFact: "WBTC represents Bitcoin on the Ethereum blockchain, allowing BTC to be used in DeFi applications. Each WBTC is backed 1:1 by real Bitcoin! 🎁"
    },
    {
        question: "What is 'multisig wallet'?",
        answers: ["Multiple wallets", "Wallet requiring multiple signatures to authorize", "Very secure wallet", "Multi-currency wallet"],
        correct: 1,
        funFact: "Multisig (multi-signature) wallets require multiple private keys to authorize a transaction, great for organizations or added security! 🔐🔐"
    },
    {
        question: "What is 'nonce'?",
        answers: ["Nonsense", "Number used once in mining", "Node instance", "Network connection"],
        correct: 1,
        funFact: "Nonce (Number used ONCE) is a random number miners change repeatedly trying to find a valid hash. Finding the right nonce wins the block reward! 🔢"
    },
    {
        question: "What is 'block size'?",
        answers: ["Physical size of mining equipment", "Amount of data a block can contain", "Number of transactions", "Mining difficulty"],
        correct: 1,
        funFact: "Bitcoin blocks are limited to 1MB (or 4MB with SegWit), which limits transaction throughput. This limitation sparked the 'block size debate'! 📦"
    },
    {
        question: "What is 'orphan block'?",
        answers: ["Block without parents", "Block not included in main chain", "Empty block", "First block"],
        correct: 1,
        funFact: "Orphan blocks are valid blocks that aren't included in the main blockchain because another block was found at the same height first. Miners get no reward! 👻"
    },
    {
        question: "What is 'time lock'?",
        answers: ["Clock mechanism", "Feature making Bitcoin unspendable until certain time", "Slow transaction", "Mining timer"],
        correct: 1,
        funFact: "Time locks can make Bitcoin unspendable until a specific date/time or block height. Useful for escrow, inheritance, or preventing early spending! ⏰"
    },
    {
        question: "What is 'replace-by-fee' (RBF)?",
        answers: ["Refund policy", "Replacing unconfirmed transaction with higher fee", "Fee reduction", "Automatic fee adjustment"],
        correct: 1,
        funFact: "RBF lets you replace an unconfirmed transaction with a higher fee version to get it confirmed faster. Useful when you set fees too low! 🔄"
    },
    {
        question: "What is 'coin control'?",
        answers: ["Government regulation", "Manually selecting which UTXOs to spend", "Price manipulation", "Exchange feature"],
        correct: 1,
        funFact: "Coin control lets advanced users choose which specific UTXOs (unspent outputs) to use in a transaction, improving privacy and fee management! 🎮"
    },
    {
        question: "What is 'dust'?",
        answers: ["Dirt particles", "Very small amounts of Bitcoin", "Worthless coins", "Mining waste"],
        correct: 1,
        funFact: "Dust refers to tiny Bitcoin amounts that cost more in fees to send than they're worth. Some wallets have minimum amounts to prevent dust accumulation! ✨"
    },
    {
        question: "What is 'UTXO'?",
        answers: ["Universal Trading Exchange Option", "Unspent Transaction Output", "Ultimate Token Exchange Organization", "Unified Transfer X Operation"],
        correct: 1,
        funFact: "UTXOs are unspent transaction outputs that make up your balance. Think of them as bills in your wallet - spending combines them to create new outputs! 💵"
    },
    {
        question: "What is 'coin age'?",
        answers: ["How old a cryptocurrency is", "How long Bitcoin has been unspent", "Historical price data", "Blockchain age"],
        correct: 1,
        funFact: "Coin age is calculated by multiplying Bitcoin amount by days unspent. It's used in some metrics and was important for early PoS systems! 📅"
    },
    {
        question: "What is 'mixpay/ coinjoin'?",
        answers: ["Payment method", "Privacy technique combining multiple transactions", "Exchange service", "Mining pool"],
        correct: 1,
        funFact: "CoinJoin mixes multiple users' transactions together, making it harder to trace specific coins. It enhances privacy but is controversial with regulators! 🎭"
    },
    {
        question: "What year did Bitcoin reach $1?",
        answers: ["2009", "2010", "2011", "2012"],
        correct: 2,
        funFact: "Bitcoin reached $1 in February 2011, nearly 2 years after its creation! Early holders who paid $1 have seen incredible gains! 🎉"
    },
    {
        question: "What is the Bitcoin Pizza transaction worth today (if those BTC were held)?",
        answers: ["$1 million", "$10 million", "$100 million", "$500+ million"],
        correct: 3,
        funFact: "The 10,000 BTC spent on pizza is now worth over $500 million! It's both the most expensive meal ever and the most important transaction for adoption! 🍕💰"
    },
    {
        question: "How many Bitcoin addresses are there?",
        answers: ["Thousands", "Millions", "Billions", "More than atoms in the universe"],
        correct: 3,
        funFact: "There are 2^160 possible Bitcoin addresses - more than atoms in the observable universe! You'll never randomly generate someone else's address! ♾️"
    },
    {
        question: "What happens when all 21 million Bitcoin are mined?",
        answers: ["Bitcoin ends", "Miners only earn transaction fees", "New Bitcoin are created", "Network shuts down"],
        correct: 1,
        funFact: "After all Bitcoin are mined (around 2140), miners will only earn transaction fees. This is designed to sustain network security indefinitely! ⏰"
    },
    {
        question: "What is 'Satoshi's Vision'?",
        answers: ["A cryptocurrency", "The original intent of Bitcoin's creator", "A trading strategy", "A wallet"],
        correct: 1,
        funFact: "'Satoshi's Vision' refers to the original goals outlined in the Bitcoin whitepaper. Different groups interpret this differently, leading to debates and forks! 👁️"
    },
    {
        question: "What is the 'Byzantine Generals Problem'?",
        answers: ["Historical battle", "Achieving consensus in unreliable system", "Military strategy", "Trading problem"],
        correct: 1,
        funFact: "The Byzantine Generals Problem is about achieving consensus when some participants might be untrustworthy. Bitcoin's blockchain solves this brilliantly! 🛡️"
    },
    {
        question: "What is 'Taproot'?",
        answers: ["Tree root", "Bitcoin upgrade improving privacy and smart contracts", "Mining algorithm", "Wallet type"],
        correct: 1,
        funFact: "Taproot, activated in 2021, is Bitcoin's biggest upgrade in years! It improves privacy, reduces fees, and enables more complex smart contracts! 🌳"
    },
    {
        question: "What is 'Lightning Network' capacity?",
        answers: ["$10 million", "$100 million", "$500+ million", "$1 billion+"],
        correct: 2,
        funFact: "Lightning Network's capacity has grown to hundreds of millions of dollars, enabling instant Bitcoin transactions for everyday purchases! ⚡"
    },
    {
        question: "Can you reverse a Bitcoin transaction?",
        answers: ["Yes, within 24 hours", "Yes, with admin approval", "No, they're immutable", "Only with unanimous consent"],
        correct: 2,
        funFact: "Bitcoin transactions are irreversible once confirmed! This is a feature, not a bug - it prevents chargebacks but requires careful address checking! 🚫"
    },
    {
        question: "What is the fastest Bitcoin confirmation?",
        answers: ["Instant", "Approximately 10 minutes", "1 hour", "1 day"],
        correct: 1,
        funFact: "Bitcoin blocks are mined every ~10 minutes on average, so your first confirmation usually takes about 10 minutes! Lightning Network enables instant transactions. ⚡"
    }
];

// Meme Templates (Text/Emoji based for simplicity)
memeTemplates = {
    drake: {
        name: "Drake Meme",
        background: "#FFD700",
        emoji1: "🙅‍♂️",
        emoji2: "👉",
        layout: "split"
    },
    buttons: {
        name: "Two Buttons",
        background: "#FF6B6B",
        emoji1: "😰",
        emoji2: "🔴",
        emoji3: "🔴",
        layout: "buttons"
    },
    distracted: {
        name: "Distracted Boyfriend",
        background: "#4ECDC4",
        emoji1: "👨",
        emoji2: "👩",
        emoji3: "👩‍🦰",
        layout: "three"
    },
    brain: {
        name: "Expanding Brain",
        background: "#95E1D3",
        emoji1: "🧠",
        emoji2: "🧠✨",
        layout: "split"
    },
    stonks: {
        name: "Stonks",
        background: "#F38181",
        emoji1: "📈",
        emoji2: "🤵",
        layout: "center"
    }
};

// Whale Transaction Commentary
const whaleCommentary = {
    baby: [
        "A baby whale is testing the waters. Small moves, but every journey starts somewhere! 🐋",
        "Someone's taking a nibble! Not quite whale-sized yet, but we're watching. 👀",
        "Modest transaction alert! The little guys are moving too. Every sat counts! ⚡",
        "Baby whale spotted! They'll grow up to be legends one day. Maybe. 🌊"
    ],
    adult: [
        "Now THIS is a whale! Someone's making moves. Should we follow? 🐳",
        "Adult whale alert! This is the kind of transaction that makes retail investors nervous. 😰",
        "Significant movement detected! Is this accumulation or distribution? Only time will tell. ⏰",
        "A serious player just moved a serious amount. The market might feel this one! 💪"
    ],
    legendary: [
        "🚨 LEGENDARY WHALE SPOTTED! Someone just moved enough Bitcoin to buy a small country! This is HUGE!",
        "HOLY WHALE! This transaction is making headlines. Either someone's VERY bullish or VERY bearish. 🤯",
        "ALERT: Generational wealth just changed wallets. This is the kind of move that creates legends! 👑",
        "MASSIVE MOVEMENT! Some whale just flexed harder than a bodybuilder convention. Respect. 💎"
    ]
};

// Social Media Platforms Data
const socialPlatforms = [
    { name: 'Twitter/X', icon: '𝕏', id: 'twitter' },
    { name: 'Reddit', icon: '🤖', id: 'reddit' },
    { name: 'Telegram', icon: '✈️', id: 'telegram' },
    { name: 'Discord', icon: '💬', id: 'discord' },
    { name: 'News Sites', icon: '📰', id: 'news' },
    { name: 'YouTube', icon: '📺', id: 'youtube' }
];

// Trending Topics Pool
const trendingTopicsPool = {
    bullish: [
        '#Bitcoin', '#BTC', '#HODL', '#ToTheMoon', '#StackSats',
        '#BitcoinToTheMoon', '#BuyTheDip', '#BTCto100K', '#DiamondHands',
        '#OrangeCoined', '#LaserEyes', '#BitcoinStandard'
    ],
    bearish: [
        '#BitcoinCrash', '#Bearish', '#Selloff', '#CryptoWinter',
        '#BTCDown', '#MarketCorrection', '#PanicSelling'
    ],
    neutral: [
        '#Crypto', '#Blockchain', '#Web3', '#Satoshi', '#Halving',
        '#LightningNetwork', '#DeFi', '#CryptoNews', '#BTCAnalysis',
        '#BitcoinEducation', '#ProofOfWork', '#SelfCustody'
    ]
};

// Force scroll to top on page load (before DOM is ready)
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// PWA Install Prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install banner
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.style.display = 'block';
    }
    console.log('📱 Install prompt available');
});

// Handle install button click
document.addEventListener('DOMContentLoaded', () => {
    const installBtn = document.getElementById('installBtn');
    const dismissBtn = document.getElementById('dismissInstall');
    const installBanner = document.getElementById('installBanner');

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) {
                return;
            }
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`👤 User response to the install prompt: ${outcome}`);
            // Clear the deferredPrompt
            deferredPrompt = null;
            // Hide the banner
            if (installBanner) {
                installBanner.style.display = 'none';
            }
        });
    }

    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            if (installBanner) {
                installBanner.style.display = 'none';
            }
        });
    }
});

// Detect if app is installed
window.addEventListener('appinstalled', () => {
    console.log('✅ Bitcoin Tracker PWA installed successfully!');
    // Hide the banner
    const installBanner = document.getElementById('installBanner');
    if (installBanner) {
        installBanner.style.display = 'none';
    }
    deferredPrompt = null;
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Bitcoin App...');

    // Scroll to top immediately on DOM ready
    window.scrollTo(0, 0);

    // Wait for Chart.js to be available
    if (typeof Chart === 'undefined') {
        console.error('❌ Chart.js not loaded yet, waiting...');
        setTimeout(() => {
            initApp();
        }, 500);
    } else {
        initApp();
    }
});

// Additional safeguard for page show event (handles back/forward navigation)
window.addEventListener('pageshow', (event) => {
    window.scrollTo(0, 0);
});

function initApp() {
    try {
        console.log('✅ Chart.js loaded, initializing app...');

        // Scroll to top on initial page load
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });

        initTabs();
        initChart();
        initTimeframeButtons();
        loadSoundPreference(); // Load saved sound preference
        fetchBitcoinPrice();

        // Delay chart data fetch slightly to avoid rate limiting
        setTimeout(() => {
            fetchChartData(currentTimeframe);
        }, 1000);

        // Auto-refresh price and chart every 60 seconds (1 minute)
        setInterval(() => {
            console.log('⏰ Auto-refresh: Updating price and chart data...');
            fetchBitcoinPrice();
            fetchChartData(currentTimeframe);
        }, 60000);

        // Manual refresh button with throttling
        document.getElementById('refreshBtn').addEventListener('click', handleRefreshClick);

        // Sound toggle button
        document.getElementById('soundToggle').addEventListener('click', toggleSound);

        // Panic button
        document.getElementById('panicBtn').addEventListener('click', activatePanicMode);
        document.getElementById('exitPanicBtn').addEventListener('click', exitPanicMode);

        // What If Calculator
        document.getElementById('calculateBtn').addEventListener('click', calculateWhatIf);

        // Preset buttons for What If Calculator
        document.querySelectorAll('.preset-btn:not(.dca-preset)').forEach(btn => {
            btn.addEventListener('click', () => {
                const price = parseFloat(btn.getAttribute('data-price'));
                document.getElementById('buyPrice').value = price;
                calculateWhatIf();
            });
        });

        // Initialize DCA Calculator
        initDcaCalculator();

        // Initialize Bitcoin Unit Converter
        initUnitConverter();

        // Initialize Profit/Loss Calculator
        initPLCalculator();

        // Initialize Trivia Quiz
        initTriviaQuiz();

        // Initialize Meme Generator
        initMemeGenerator();

        // Initialize Whale Watching
        initWhaleWatching();

        // Initialize Social Sentiment Tracker
        initSentimentTracker();

        // Initialize Price Alerts
        initPriceAlerts();

        // Initialize Emoji Rain
        initEmojiRain();

        // Initialize Theme System
        initThemeSystem();

        // Initialize Cope Generator
        initCopeGenerator();

        // Initialize Community Chat
        initCommunityChat();

        console.log('✅ App initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
    }
}

// Handle Refresh Button Click with throttling
function handleRefreshClick() {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime;
    const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum

    if (isRefreshing) {
        console.log('⏳ Already refreshing, please wait...');
        showTemporaryMessage('Already refreshing! Please wait...');
        return;
    }

    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        const secondsLeft = Math.ceil((MIN_REFRESH_INTERVAL - timeSinceLastRefresh) / 1000);
        console.log(`⏰ Please wait ${secondsLeft} more seconds before refreshing`);
        showTemporaryMessage(`Wait ${secondsLeft}s before refreshing again`);
        return;
    }

    // Refresh allowed
    lastRefreshTime = now;
    fetchBitcoinPrice();
    fetchChartData(currentTimeframe);
}

// Show temporary message
function showTemporaryMessage(message) {
    const refreshBtn = document.getElementById('refreshBtn');
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = message;
    refreshBtn.disabled = true;

    setTimeout(() => {
        refreshBtn.textContent = originalText;
        refreshBtn.disabled = false;
    }, 2000);
}

// ========== SOUND FUNCTIONS ==========

// Initialize Audio Context
function getAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
}

// Toggle Sound
function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundToggle');

    if (soundEnabled) {
        btn.textContent = '🔊 Sound';
        btn.classList.remove('muted');
        console.log('🔊 Sound effects enabled');
    } else {
        btn.textContent = '🔇 Muted';
        btn.classList.add('muted');
        console.log('🔇 Sound effects muted');
    }

    // Save preference to localStorage
    localStorage.setItem('soundEnabled', soundEnabled);
}

// Load sound preference on startup
function loadSoundPreference() {
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) {
        soundEnabled = saved === 'true';
        const btn = document.getElementById('soundToggle');
        if (!soundEnabled) {
            btn.textContent = '🔇 Muted';
            btn.classList.add('muted');
        }
    }
}

// Play Pump Sound (price going up)
function playPumpSound() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Create ascending tone sequence
        for (let i = 0; i < 3; i++) {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Ascending frequencies: 440Hz -> 554Hz -> 659Hz (A4 -> C#5 -> E5)
            oscillator.frequency.value = 440 * Math.pow(2, i * 3 / 12);
            oscillator.type = 'sine';

            // Quick fade in/out
            gainNode.gain.setValueAtTime(0, now + i * 0.1);
            gainNode.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02);
            gainNode.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.08);

            oscillator.start(now + i * 0.1);
            oscillator.stop(now + i * 0.1 + 0.1);
        }

        console.log('🚀 Playing pump sound!');
    } catch (error) {
        console.error('❌ Error playing pump sound:', error);
    }
}

// Play Dump Sound (price going down)
function playDumpSound() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Create descending tone
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Descending frequency: 659Hz -> 440Hz (E5 -> A4)
        oscillator.frequency.setValueAtTime(659, now);
        oscillator.frequency.linearRampToValueAtTime(440, now + 0.3);
        oscillator.type = 'sawtooth';

        // Fade out
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

        oscillator.start(now);
        oscillator.stop(now + 0.3);

        console.log('📉 Playing dump sound!');
    } catch (error) {
        console.error('❌ Error playing dump sound:', error);
    }
}

// Play Milestone Bell (for round numbers like $50K, $100K)
function playMilestoneBell() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Create bell-like sound (major chord)
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

        frequencies.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            // Bell envelope: quick attack, long decay
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            oscillator.start(now + i * 0.05);
            oscillator.stop(now + 0.8);
        });

        console.log('🔔 Playing milestone bell!');
    } catch (error) {
        console.error('❌ Error playing milestone sound:', error);
    }
}

// Check if price crossed a milestone
function checkPriceMilestone(oldPrice, newPrice) {
    // Define milestones (every $5,000)
    const milestoneInterval = 5000;

    const oldMilestone = Math.floor(oldPrice / milestoneInterval);
    const newMilestone = Math.floor(newPrice / milestoneInterval);

    if (oldMilestone !== newMilestone && oldPrice > 0) {
        const crossed = newMilestone * milestoneInterval;
        console.log(`🎯 Price crossed $${crossed.toLocaleString()}!`);
        playMilestoneBell();
        return true;
    }

    return false;
}

// ========== PANIC MODE FUNCTIONS ==========

// Activate Panic Mode
function activatePanicMode() {
    console.log('🚨 PANIC MODE ACTIVATED!');

    panicModeActive = true;
    panicTimeRemaining = 30;

    // Show overlay
    const overlay = document.getElementById('panicOverlay');
    overlay.classList.add('active');

    // Set random calming message
    const randomMessage = calmingMessages[Math.floor(Math.random() * calmingMessages.length)];
    document.getElementById('panicMessage').textContent = randomMessage;

    // Reset and disable exit button
    const exitBtn = document.getElementById('exitPanicBtn');
    exitBtn.disabled = true;
    exitBtn.textContent = 'I\'m Calm Now';

    // Start countdown timer
    updatePanicTimer();
    panicTimer = setInterval(updatePanicTimer, 1000);

    // Play calming sound effect (if enabled)
    if (soundEnabled) {
        playCalmingSound();
    }
}

// Update Panic Timer
function updatePanicTimer() {
    const timerDisplay = document.getElementById('panicTimer');
    const exitBtn = document.getElementById('exitPanicBtn');

    timerDisplay.textContent = panicTimeRemaining;

    if (panicTimeRemaining <= 0) {
        // Timer finished - enable exit button
        clearInterval(panicTimer);
        exitBtn.disabled = false;
        exitBtn.textContent = '✅ I\'m Calm Now';
        timerDisplay.textContent = '0';
        console.log('✅ Cooldown complete!');
    } else {
        panicTimeRemaining--;
    }
}

// Exit Panic Mode
function exitPanicMode() {
    console.log('😌 Exiting panic mode...');

    panicModeActive = false;

    // Hide overlay
    const overlay = document.getElementById('panicOverlay');
    overlay.classList.remove('active');

    // Clear timer
    if (panicTimer) {
        clearInterval(panicTimer);
        panicTimer = null;
    }

    console.log('✅ Welcome back! Remember to invest responsibly.');
}

// Play Calming Sound
function playCalmingSound() {
    if (!soundEnabled) return;

    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        // Create a calming sound (soft descending tones)
        const frequencies = [523.25, 493.88, 440]; // C5, B4, A4

        frequencies.forEach((freq, i) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            // Soft, gentle envelope
            gainNode.gain.setValueAtTime(0, now + i * 0.3);
            gainNode.gain.linearRampToValueAtTime(0.08, now + i * 0.3 + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.6);

            oscillator.start(now + i * 0.3);
            oscillator.stop(now + i * 0.3 + 0.6);
        });

        console.log('🎵 Playing calming sound...');
    } catch (error) {
        console.error('❌ Error playing calming sound:', error);
    }
}

// ========== WHAT IF CALCULATOR FUNCTIONS ==========

// Calculate What If Scenario
function calculateWhatIf() {
    console.log('💰 Calculating what if scenario...');

    // Get inputs
    const investAmount = parseFloat(document.getElementById('investAmount').value);
    const buyPrice = parseFloat(document.getElementById('buyPrice').value);

    // Validate inputs
    if (isNaN(investAmount) || isNaN(buyPrice) || investAmount <= 0 || buyPrice <= 0) {
        alert('Please enter valid positive numbers for both fields!');
        return;
    }

    // Check if current price is available
    if (currentPrice <= 0) {
        alert('Bitcoin price not loaded yet. Please wait a moment and try again!');
        return;
    }

    // Calculate results
    const btcAmount = investAmount / buyPrice;
    const currentValue = btcAmount * currentPrice;
    const profitLoss = currentValue - investAmount;
    const roi = ((profitLoss / investAmount) * 100);

    // Update results display
    document.getElementById('btcAmount').textContent = btcAmount.toFixed(8) + ' BTC';

    const currentValueEl = document.getElementById('currentValue');
    currentValueEl.textContent = '$' + currentValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const profitLossEl = document.getElementById('profitLoss');
    profitLossEl.textContent = (profitLoss >= 0 ? '+' : '') + '$' + profitLoss.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    profitLossEl.className = 'result-value';
    profitLossEl.classList.add(profitLoss >= 0 ? 'positive' : 'negative');

    const roiEl = document.getElementById('roi');
    roiEl.textContent = (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%';
    roiEl.className = 'result-value';
    roiEl.classList.add(roi >= 0 ? 'positive' : 'negative');

    // Generate commentary
    const commentary = generateWhatIfCommentary(roi, buyPrice, profitLoss);
    document.getElementById('whatifCommentary').textContent = commentary;

    // Show results
    document.getElementById('whatifResults').style.display = 'block';

    // Scroll to results
    document.getElementById('whatifResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log(`✅ Calculated: $${investAmount} at $${buyPrice} = ${btcAmount.toFixed(8)} BTC = $${currentValue.toFixed(2)} (${roi.toFixed(2)}% ROI)`);
}

// Generate Commentary for What If Results
function generateWhatIfCommentary(roi, buyPrice, profitLoss) {
    let commentary = '';

    // Insane gains (>10000%)
    if (roi > 10000) {
        const messages = [
            `🚀 You would be UNBELIEVABLY rich! That's a ${roi.toFixed(0)}% return! But remember: you would have needed diamond hands through multiple 80%+ crashes. Could you have HODLed through all of that? Hindsight is 20/20, my friend.`,
            `💎 A ${roi.toFixed(0)}% gain?! You'd be a Bitcoin legend! But let's be real: you would have sold at +100% and felt like a genius. Nobody has perfect timing. Still, fun to dream!`,
            `🤑 ${roi.toFixed(0)}%?! You'd own a private island by now! But here's the thing: you would have needed nerves of steel to hold through Mt. Gox, China bans, and the crypto winters. Very few actually did.`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Massive gains (1000-10000%)
    else if (roi > 1000) {
        const messages = [
            `🎉 ${roi.toFixed(0)}% gains! You'd be living the dream! But be honest: would you have held through all those crashes? Most people sold way earlier. But hey, it's nice to daydream!`,
            `💰 That's life-changing money - ${roi.toFixed(0)}% return! The hardest part isn't buying, it's HOLDING. Every pundit would have told you to sell. Could you have resisted?`,
            `🏆 ${roi.toFixed(0)}%! Incredible! But remember: hindsight is 20/20. At the time, everyone said Bitcoin was a scam. You would've needed conviction most people don't have.`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Great gains (100-1000%)
    else if (roi > 100) {
        const messages = [
            `📈 ${roi.toFixed(1)}% is amazing! That would've been a ${(profitLoss / 1000).toFixed(1)}K profit! Not quite "retire early" money, but definitely "nice vacation" money. Still counts as a win!`,
            `😎 ${roi.toFixed(1)}% ROI! You'd be feeling pretty smart right now. This is the kind of gain that makes you a legend at parties. "Yeah, I bought Bitcoin at $${buyPrice}..." *adjusts sunglasses*`,
            `💚 ${roi.toFixed(1)}% gain - that's what we call a "solid investment!" Not moonshot territory, but way better than the stock market. You'd be eating well, friend!`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Good gains (10-100%)
    else if (roi > 10) {
        const messages = [
            `🙂 ${roi.toFixed(1)}% is a respectable gain! Better than most traditional investments. Nothing to sneeze at - this is how wealth builds over time.`,
            `💪 ${roi.toFixed(1)}% profit! This is actually what successful investing looks like - consistent gains, not moonshots. The boring middle is where real investors thrive.`,
            `✅ ${roi.toFixed(1)}%! Hey, that's a win! Not every trade needs to be a 1000x. Slow and steady can definitely win the race.`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Small gains (0-10%)
    else if (roi > 0) {
        const messages = [
            `🤷 ${roi.toFixed(1)}% gain. Better than losing money! But also... you could've just kept it in a savings account. Still, green is green, and at least you're learning!`,
            `😐 ${roi.toFixed(1)}%... That's basically breaking even after fees and taxes. Not great, not terrible. Sometimes the market just needs more time.`,
            `📊 ${roi.toFixed(1)}% profit. Hey, you're up! It might not be lambo money, but you didn't lose. That puts you ahead of many Bitcoin investors!`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Small loss (0 to -50%)
    else if (roi > -50) {
        const messages = [
            `😬 Down ${Math.abs(roi).toFixed(1)}%... Ouch. But hey, it's not a loss until you sell! Bitcoin is volatile - this could easily reverse. Diamond hands, remember?`,
            `💎 ${roi.toFixed(1)}%? This is just a dip before the rip! (Please be a dip before the rip...) Welcome to crypto - volatility is the price of admission!`,
            `📉 Down ${Math.abs(roi).toFixed(1)}%. This is where most people panic sell and lock in losses. The smart move? Zoom out, breathe, and remember why you invested.`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Big loss (-50% to -80%)
    else if (roi > -80) {
        const messages = [
            `😱 Down ${Math.abs(roi).toFixed(1)}%! This is rough, not gonna lie. But Bitcoin has recovered from worse. The question is: can you hold through the pain?`,
            `💀 ${roi.toFixed(1)}%... This is what we call "character building." Many Bitcoin OGs went through multiple 80% drops and came out millionaires. Will you be one of them?`,
            `🎢 Down ${Math.abs(roi).toFixed(1)}%. Welcome to crypto! This is the volatility everyone warned you about. Only invest what you can afford to lose, folks!`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }
    // Devastating loss (< -80%)
    else {
        const messages = [
            `🔥 Down ${Math.abs(roi).toFixed(1)}%... This is brutal. If this happened to you, please know: you only lose if you sell. Bitcoin has survived worse. Take care of your mental health first.`,
            `⚰️ ${Math.abs(roi).toFixed(1)}% loss... This is why we say "only invest what you can afford to lose." If you're going through this, step away from the charts and remember: it's just money.`,
            `😭 Down ${Math.abs(roi).toFixed(1)}%. This is nightmare territory. But historically, Bitcoin always came back. The question is can you wait? No judgment if the answer is no - protect yourself first.`
        ];
        commentary = messages[Math.floor(Math.random() * messages.length)];
    }

    return commentary;
}

// ========== DCA CALCULATOR FUNCTIONS ==========

// Initialize DCA Calculator
function initDcaCalculator() {
    console.log('📊 Initializing DCA Calculator...');

    // Set default start date to 1 year ago
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    document.getElementById('dcaStartDate').value = oneYearAgo.toISOString().split('T')[0];

    // Calculate button
    document.getElementById('calculateDcaBtn').addEventListener('click', calculateDCA);

    // DCA Preset buttons
    document.querySelectorAll('.dca-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.getAttribute('data-amount'));
            const freq = btn.getAttribute('data-freq');
            const months = parseInt(btn.getAttribute('data-months'));

            document.getElementById('dcaAmount').value = amount;
            document.getElementById('dcaFrequency').value = freq;

            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);
            document.getElementById('dcaStartDate').value = startDate.toISOString().split('T')[0];
            document.getElementById('dcaEndDate').value = '';

            calculateDCA();
        });
    });
}

// Calculate DCA Returns (simplified - using average approximation)
function calculateDCA() {
    console.log('📊 Calculating DCA returns...');

    const amount = parseFloat(document.getElementById('dcaAmount').value);
    const frequency = document.getElementById('dcaFrequency').value;
    const startDateStr = document.getElementById('dcaStartDate').value;
    const endDateStr = document.getElementById('dcaEndDate').value;

    if (!amount || amount <= 0 || !startDateStr) {
        alert('Please enter a valid amount and start date!');
        return;
    }

    if (currentPrice <= 0) {
        alert('Bitcoin price not loaded yet. Please wait a moment and try again!');
        return;
    }

    const startDate = new Date(startDateStr);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) {
        alert('End date must be after start date!');
        return;
    }

    // Calculate number of purchases based on frequency
    let purchaseCount = 0;
    let daysBetweenPurchases = 0;

    switch(frequency) {
        case 'daily':
            daysBetweenPurchases = 1;
            break;
        case 'weekly':
            daysBetweenPurchases = 7;
            break;
        case 'biweekly':
            daysBetweenPurchases = 14;
            break;
        case 'monthly':
            daysBetweenPurchases = 30;
            break;
    }

    purchaseCount = Math.floor(daysDiff / daysBetweenPurchases) + 1;

    // Total invested
    const totalInvested = amount * purchaseCount;

    // Simplified calculation: assume average BTC price over period was 70% of current price
    // (This is a rough approximation - real DCA would need historical price data)
    const estimatedAvgPrice = currentPrice * 0.75; // Assuming 25% average appreciation
    const btcAccumulated = totalInvested / estimatedAvgPrice;
    const currentValue = btcAccumulated * currentPrice;
    const totalReturn = currentValue - totalInvested;
    const roi = (totalReturn / totalInvested) * 100;

    // Update results display
    document.getElementById('dcaTotalInvested').textContent = '$' + totalInvested.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('dcaBtcAmount').textContent = btcAccumulated.toFixed(8) + ' BTC';

    document.getElementById('dcaCurrentValue').textContent = '$' + currentValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const returnEl = document.getElementById('dcaReturn');
    returnEl.textContent = (totalReturn >= 0 ? '+' : '') + '$' + totalReturn.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' (' + (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%)';
    returnEl.className = 'result-value';
    returnEl.classList.add(totalReturn >= 0 ? 'positive' : 'negative');

    document.getElementById('dcaAvgPrice').textContent = '$' + estimatedAvgPrice.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('dcaPurchases').textContent = purchaseCount;

    // Generate commentary
    const freqText = {
        'daily': 'every day',
        'weekly': 'every week',
        'biweekly': 'every 2 weeks',
        'monthly': 'every month'
    }[frequency];

    let commentary = '';
    if (roi > 50) {
        commentary = `💰 Great results! By investing $${amount} ${freqText}, you would have accumulated ${btcAccumulated.toFixed(4)} BTC worth $${currentValue.toLocaleString()} today. DCA helps you buy the dips automatically! This strategy reduces the stress of timing the market and builds wealth systematically.`;
    } else if (roi > 0) {
        commentary = `📈 Positive returns! Investing $${amount} ${freqText} gave you a ${roi.toFixed(1)}% gain. DCA isn't about getting rich quick - it's about consistent, disciplined investing that reduces volatility risk and builds long-term wealth.`;
    } else {
        commentary = `⏳ Currently down ${Math.abs(roi).toFixed(1)}%, but don't panic! DCA is a long-term strategy. You're buying at various prices, which means you're still accumulating during dips. Stay consistent - historically, DCA into Bitcoin has rewarded patience.`;
    }

    document.getElementById('dcaCommentary').textContent = commentary;

    // Show results
    document.getElementById('dcaResults').style.display = 'block';

    // Scroll to results
    document.getElementById('dcaResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log(`✅ DCA Calculated: $${amount} ${frequency} = ${btcAccumulated.toFixed(8)} BTC = $${currentValue.toFixed(2)} (${roi.toFixed(2)}% ROI)`);
}

// ========== BITCOIN UNIT CONVERTER FUNCTIONS ==========

// Initialize Bitcoin Unit Converter
function initUnitConverter() {
    console.log('🔄 Initializing Bitcoin Unit Converter...');

    // Update converter price display
    updateConverterPrice();

    // Add event listeners for all inputs
    document.getElementById('btcInput').addEventListener('input', (e) => convertFromBTC(e.target.value));
    document.getElementById('mbtcInput').addEventListener('input', (e) => convertFromMBTC(e.target.value));
    document.getElementById('satInput').addEventListener('input', (e) => convertFromSats(e.target.value));
    document.getElementById('usdInput').addEventListener('input', (e) => convertFromUSD(e.target.value));
}

// Update converter price display
function updateConverterPrice() {
    const priceEl = document.getElementById('converterPrice');
    if (currentPrice > 0) {
        priceEl.textContent = '$' + currentPrice.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    } else {
        priceEl.textContent = 'Loading...';
    }
}

// Converter functions
function convertFromBTC(btc) {
    if (!btc || isNaN(btc)) return;
    const btcVal = parseFloat(btc);

    document.getElementById('mbtcInput').value = (btcVal * 1000).toFixed(3);
    document.getElementById('satInput').value = Math.floor(btcVal * 100000000);
    document.getElementById('usdInput').value = (btcVal * currentPrice).toFixed(2);
}

function convertFromMBTC(mbtc) {
    if (!mbtc || isNaN(mbtc)) return;
    const mbtcVal = parseFloat(mbtc);

    document.getElementById('btcInput').value = (mbtcVal / 1000).toFixed(8);
    document.getElementById('satInput').value = Math.floor(mbtcVal * 100000);
    document.getElementById('usdInput').value = ((mbtcVal / 1000) * currentPrice).toFixed(2);
}

function convertFromSats(sats) {
    if (!sats || isNaN(sats)) return;
    const satsVal = parseFloat(sats);

    document.getElementById('btcInput').value = (satsVal / 100000000).toFixed(8);
    document.getElementById('mbtcInput').value = (satsVal / 100000).toFixed(3);
    document.getElementById('usdInput').value = ((satsVal / 100000000) * currentPrice).toFixed(2);
}

function convertFromUSD(usd) {
    if (!usd || isNaN(usd) || currentPrice <= 0) return;
    const usdVal = parseFloat(usd);

    const btcVal = usdVal / currentPrice;
    document.getElementById('btcInput').value = btcVal.toFixed(8);
    document.getElementById('mbtcInput').value = (btcVal * 1000).toFixed(3);
    document.getElementById('satInput').value = Math.floor(btcVal * 100000000);
}

// ========== PROFIT/LOSS CALCULATOR FUNCTIONS ==========

// Initialize P/L Calculator
function initPLCalculator() {
    console.log('💹 Initializing Profit/Loss Calculator...');

    document.getElementById('calculatePlBtn').addEventListener('click', calculatePL);

    // Fix the ID - there was a space in the HTML
    const useCurrentBtn = document.getElementById('useCurrentPlBtn');
    if (useCurrentBtn) {
        useCurrentBtn.addEventListener('click', () => {
            if (currentPrice > 0) {
                document.getElementById('plSellPrice').value = currentPrice.toFixed(2);
            }
        });
    }
}

// Calculate Profit/Loss
function calculatePL() {
    console.log('💹 Calculating P/L...');

    const buyPrice = parseFloat(document.getElementById('plBuyPrice').value);
    const sellPrice = parseFloat(document.getElementById('plSellPrice').value);
    const amount = parseFloat(document.getElementById('plAmount').value);
    const feesPercent = parseFloat(document.getElementById('plFees').value);

    if (isNaN(buyPrice) || isNaN(sellPrice) || isNaN(amount) || buyPrice <= 0 || sellPrice <= 0 || amount <= 0) {
        alert('Please enter valid values for all fields!');
        return;
    }

    // Calculate costs and revenues
    const purchaseCost = amount * buyPrice;
    const saleRevenue = amount * sellPrice;
    const buyFees = (purchaseCost * feesPercent) / 100;
    const sellFees = (saleRevenue * feesPercent) / 100;
    const totalFees = buyFees + sellFees;
    const netProfit = saleRevenue - purchaseCost - totalFees;
    const roi = (netProfit / purchaseCost) * 100;
    const priceChange = ((sellPrice - buyPrice) / buyPrice) * 100;

    // Update results display
    document.getElementById('plPurchaseCost').textContent = '$' + purchaseCost.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('plSaleRevenue').textContent = '$' + saleRevenue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('plTotalFees').textContent = '$' + totalFees.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const profitEl = document.getElementById('plNetProfit');
    profitEl.textContent = (netProfit >= 0 ? '+' : '') + '$' + netProfit.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    profitEl.className = 'result-value';
    profitEl.classList.add(netProfit >= 0 ? 'positive' : 'negative');

    const roiEl = document.getElementById('plRoi');
    roiEl.textContent = (roi >= 0 ? '+' : '') + roi.toFixed(2) + '%';
    roiEl.className = 'result-value';
    roiEl.classList.add(roi >= 0 ? 'positive' : 'negative');

    const priceChangeEl = document.getElementById('plPriceChange');
    priceChangeEl.textContent = (priceChange >= 0 ? '+' : '') + priceChange.toFixed(2) + '%';
    priceChangeEl.className = 'result-value';
    priceChangeEl.classList.add(priceChange >= 0 ? 'positive' : 'negative');

    // Show results
    document.getElementById('plResults').style.display = 'block';

    // Scroll to results
    document.getElementById('plResults').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    console.log(`✅ P/L Calculated: Buy $${buyPrice} Sell $${sellPrice} = ${netProfit >= 0 ? 'Profit' : 'Loss'} $${Math.abs(netProfit).toFixed(2)}`);
}

// ========== TRIVIA QUIZ FUNCTIONS ==========

// Initialize Trivia Quiz
function initTriviaQuiz() {
    console.log('🎯 Initializing trivia quiz...');

    // Start quiz immediately
    startTrivia();

    // Wire up event listeners
    document.getElementById('nextQuestionBtn').addEventListener('click', nextQuestion);
    document.getElementById('restartQuizBtn').addEventListener('click', startTrivia);
}

// Start/Restart Trivia Quiz
function startTrivia() {
    console.log('🎯 Starting trivia quiz...');

    // Randomly select 10 questions from the bank
    const shuffled = [...triviaQuestionsBank].sort(() => Math.random() - 0.5);
    triviaQuestions = shuffled.slice(0, 10);

    // Reset state
    currentQuestionIndex = 0;
    triviaScore = 0;
    answeredCurrentQuestion = false;

    // Update UI
    document.getElementById('triviaScore').textContent = triviaScore;
    document.getElementById('totalQuestions').textContent = triviaQuestions.length;

    // Hide results, show question
    document.getElementById('resultsContainer').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'block';
    document.getElementById('feedbackContainer').style.display = 'none';

    // Display first question
    displayQuestion();
}

// Display Current Question
function displayQuestion() {
    if (currentQuestionIndex >= triviaQuestions.length) {
        showResults();
        return;
    }

    answeredCurrentQuestion = false;
    const question = triviaQuestions[currentQuestionIndex];

    // Update question number
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;

    // Display question text
    document.getElementById('questionText').textContent = question.question;

    // Display answers
    const answersContainer = document.getElementById('answersContainer');
    answersContainer.innerHTML = '';

    question.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'answer-btn';
        button.textContent = answer;
        button.addEventListener('click', () => checkAnswer(index));
        answersContainer.appendChild(button);
    });

    // Hide feedback
    document.getElementById('feedbackContainer').style.display = 'none';

    console.log(`📝 Question ${currentQuestionIndex + 1}: ${question.question}`);
}

// Check Answer
function checkAnswer(selectedIndex) {
    if (answeredCurrentQuestion) return; // Prevent multiple answers

    answeredCurrentQuestion = true;
    const question = triviaQuestions[currentQuestionIndex];
    const isCorrect = selectedIndex === question.correct;

    // Update score
    if (isCorrect) {
        triviaScore++;
        document.getElementById('triviaScore').textContent = triviaScore;
    }

    // Disable all buttons and show correct/incorrect styling
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, index) => {
        btn.disabled = true;
        if (index === question.correct) {
            btn.classList.add('correct');
        } else if (index === selectedIndex && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Show feedback
    showFeedback(isCorrect, question);

    console.log(`${isCorrect ? '✅ Correct!' : '❌ Wrong!'} Answer: ${question.answers[question.correct]}`);
}

// Show Feedback
function showFeedback(isCorrect, question) {
    const feedbackContainer = document.getElementById('feedbackContainer');
    const feedbackIcon = document.getElementById('feedbackIcon');
    const feedbackText = document.getElementById('feedbackText');
    const funFact = document.getElementById('funFact');

    // Set feedback icon and text
    if (isCorrect) {
        feedbackIcon.textContent = '🎉';
        feedbackText.textContent = 'Correct!';
        feedbackText.style.color = '#28a745';
    } else {
        feedbackIcon.textContent = '😅';
        feedbackText.textContent = 'Not quite!';
        feedbackText.style.color = '#dc3545';
    }

    // Show fun fact
    funFact.textContent = '💡 ' + question.funFact;

    // Show feedback container
    feedbackContainer.style.display = 'block';

    // Scroll to feedback
    feedbackContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Next Question
function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex >= triviaQuestions.length) {
        showResults();
    } else {
        displayQuestion();
    }
}

// Show Results
function showResults() {
    console.log(`🏆 Quiz complete! Score: ${triviaScore}/${triviaQuestions.length}`);

    // Hide question and feedback
    document.getElementById('questionContainer').style.display = 'none';
    document.getElementById('feedbackContainer').style.display = 'none';

    // Show results
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.style.display = 'block';

    // Update final score
    document.getElementById('finalScore').textContent = triviaScore;
    document.getElementById('finalTotal').textContent = triviaQuestions.length;

    // Generate results message based on score
    const percentage = (triviaScore / triviaQuestions.length) * 100;
    let title, message, icon;

    if (percentage === 100) {
        icon = '🏆';
        title = 'PERFECT SCORE!';
        message = 'You\'re a Bitcoin genius! You know your stuff better than most hodlers. Are you secretly Satoshi? 🤯';
    } else if (percentage >= 80) {
        icon = '🎉';
        title = 'Excellent!';
        message = 'You really know your Bitcoin! You\'re well on your way to becoming a crypto expert. Keep learning! 💪';
    } else if (percentage >= 60) {
        icon = '😊';
        title = 'Pretty Good!';
        message = 'Solid knowledge! You understand the basics and then some. A few more years in the space and you\'ll be an OG! 📚';
    } else if (percentage >= 40) {
        icon = '🤔';
        title = 'Not Bad!';
        message = 'You\'ve got some Bitcoin knowledge, but there\'s room to learn more. Keep exploring - the rabbit hole goes deep! 🐰';
    } else {
        icon = '😅';
        title = 'Keep Learning!';
        message = 'Bitcoin is complex! Don\'t worry - everyone starts somewhere. Stick around, read more, and you\'ll be an expert in no time! 📖';
    }

    document.querySelector('.results-icon').textContent = icon;
    document.getElementById('resultsTitle').textContent = title;
    document.getElementById('resultsMessage').textContent = message;

    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ========== MEME GENERATOR FUNCTIONS ==========

// Initialize Meme Generator
function initMemeGenerator() {
    console.log('🎨 Initializing meme generator...');

    // Wire up event listeners
    document.getElementById('generateMemeBtn').addEventListener('click', generateMeme);
    document.getElementById('downloadMemeBtn').addEventListener('click', downloadMeme);

    // Quick fill buttons
    document.querySelectorAll('.quick-fill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const topText = btn.getAttribute('data-top');
            const bottomText = btn.getAttribute('data-bottom');
            document.getElementById('topText').value = topText;
            document.getElementById('bottomText').value = bottomText;
        });
    });
}

// Generate Meme
function generateMeme() {
    console.log('🎨 Generating meme...');

    const template = document.getElementById('memeTemplate').value;
    const topText = document.getElementById('topText').value.trim();
    const bottomText = document.getElementById('bottomText').value.trim();

    if (!topText && !bottomText) {
        alert('Please enter at least some text for your meme!');
        return;
    }

    const memeData = memeTemplates[template];

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = memeData.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw based on layout
    if (memeData.layout === 'split') {
        drawSplitMeme(ctx, memeData, topText, bottomText);
    } else if (memeData.layout === 'buttons') {
        drawButtonsMeme(ctx, memeData, topText, bottomText);
    } else if (memeData.layout === 'three') {
        drawThreeMeme(ctx, memeData, topText, bottomText);
    } else if (memeData.layout === 'center') {
        drawCenterMeme(ctx, memeData, topText, bottomText);
    }

    // Store canvas
    currentMeme = canvas;

    // Display in preview
    const container = document.getElementById('memeCanvas');
    container.innerHTML = '';
    container.appendChild(canvas);

    // Show download button
    document.getElementById('downloadMemeBtn').style.display = 'block';

    console.log('✅ Meme generated successfully!');
}

// Draw Split Layout (Drake-style)
function drawSplitMeme(ctx, memeData, topText, bottomText) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw dividing line
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Top section
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(memeData.emoji1, width / 4, height / 4 + 30);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 32px Arial';
    wrapText(ctx, topText, width * 0.625, height / 4 + 10, width * 0.4, 40);

    // Bottom section
    ctx.fillStyle = memeData.background;
    ctx.font = 'bold 80px Arial';
    ctx.fillText(memeData.emoji2, width / 4, height * 0.75 + 30);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 32px Arial';
    wrapText(ctx, bottomText, width * 0.625, height * 0.75 + 10, width * 0.4, 40);
}

// Draw Buttons Layout
function drawButtonsMeme(ctx, memeData, topText, bottomText) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw emoji at top
    ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(memeData.emoji1, width / 2, 150);

    // Draw buttons
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(width * 0.35, height / 2, 80, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(width * 0.65, height / 2, 80, 0, 2 * Math.PI);
    ctx.fill();

    // Draw text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 28px Arial';
    wrapText(ctx, topText, width * 0.35, height / 2 + 120, 200, 35);
    wrapText(ctx, bottomText, width * 0.65, height / 2 + 120, 200, 35);
}

// Draw Three Layout (Distracted)
function drawThreeMeme(ctx, memeData, topText, bottomText) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw three emojis
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(memeData.emoji1, width * 0.3, height / 2);
    ctx.fillText(memeData.emoji2, width * 0.5, height / 2);
    ctx.fillText(memeData.emoji3, width * 0.7, height / 2);

    // Draw text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 32px Arial';
    wrapText(ctx, topText, width * 0.5, 100, width * 0.8, 40);
    wrapText(ctx, bottomText, width * 0.5, height - 80, width * 0.8, 40);
}

// Draw Center Layout (Stonks)
function drawCenterMeme(ctx, memeData, topText, bottomText) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Draw emoji in center
    ctx.font = 'bold 150px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(memeData.emoji1, width / 2, height / 2 + 50);
    ctx.fillText(memeData.emoji2, width / 2, height / 2 - 50);

    // Draw text
    ctx.fillStyle = '#000';
    ctx.font = 'bold 40px Arial';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 8;

    // Top text with outline
    ctx.strokeText(topText.toUpperCase(), width / 2, 80);
    ctx.fillText(topText.toUpperCase(), width / 2, 80);

    // Bottom text with outline
    ctx.strokeText(bottomText.toUpperCase(), width / 2, height - 40);
    ctx.fillText(bottomText.toUpperCase(), width / 2, height - 40);
}

// Wrap text helper function
function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';
    let testLine = '';
    let lineArray = [];

    for (let n = 0; n < words.length; n++) {
        testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lineArray.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lineArray.push(line);

    // Draw lines centered
    const startY = y - ((lineArray.length - 1) * lineHeight) / 2;
    for (let k = 0; k < lineArray.length; k++) {
        ctx.fillText(lineArray[k], x, startY + (k * lineHeight));
    }
}

// Download Meme
function downloadMeme() {
    if (!currentMeme) {
        alert('Please generate a meme first!');
        return;
    }

    console.log('💾 Downloading meme...');

    // Convert canvas to blob and download
    currentMeme.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bitcoin-meme-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);

        console.log('✅ Meme downloaded!');
    });
}

// ========== WHALE WATCHING FUNCTIONS ==========

// Initialize Whale Watching
function initWhaleWatching() {
    console.log('🐋 Initializing whale watching...');

    // Generate initial whale transactions
    generateWhaleTransactions(5);

    // Wire up refresh button
    document.getElementById('refreshWhalesBtn').addEventListener('click', () => {
        console.log('🔄 Manual refresh triggered');
        generateWhaleTransactions(3);
    });

    // Auto-refresh: Add 1 new whale transaction every 60 seconds (1 minute)
    whaleRefreshInterval = setInterval(() => {
        console.log('⏰ Auto-refresh: generating new whale transaction');
        generateWhaleTransactions(1);
    }, 60000);

    console.log('✅ Whale watching initialized!');
}

// Generate Whale Transactions
function generateWhaleTransactions(count) {
    console.log(`🐋 Generating ${count} whale transaction(s)...`);

    // Check if Bitcoin price is loaded
    if (currentPrice <= 0) {
        console.log('⏳ Bitcoin price not loaded yet, waiting...');
        return;
    }

    for (let i = 0; i < count; i++) {
        // Generate random BTC amount in different whale categories
        // Baby whale: 10-100 BTC
        // Adult whale: 100-1000 BTC
        // Legendary whale: 1000-5000 BTC

        const random = Math.random();
        let btcAmount, category;

        if (random < 0.6) {
            // 60% chance: Baby whale
            btcAmount = 10 + Math.random() * 90; // 10-100 BTC
            category = 'baby';
        } else if (random < 0.9) {
            // 30% chance: Adult whale
            btcAmount = 100 + Math.random() * 900; // 100-1000 BTC
            category = 'adult';
        } else {
            // 10% chance: Legendary whale
            btcAmount = 1000 + Math.random() * 4000; // 1000-5000 BTC
            category = 'legendary';
        }

        // Calculate USD value
        const usdValue = btcAmount * currentPrice;

        // Generate random time (within last 30 minutes)
        const minutesAgo = Math.floor(Math.random() * 30);
        const timestamp = new Date(Date.now() - minutesAgo * 60000);

        // Select random commentary
        const commentary = whaleCommentary[category][Math.floor(Math.random() * whaleCommentary[category].length)];

        // Create transaction object
        const transaction = {
            btcAmount: btcAmount,
            usdValue: usdValue,
            category: category,
            timestamp: timestamp,
            commentary: commentary
        };

        // Add to array (keep only last 20 transactions)
        whaleTransactions.unshift(transaction); // Add to beginning
        if (whaleTransactions.length > 20) {
            whaleTransactions.pop(); // Remove oldest
        }

        // Display transaction
        displayWhaleTransaction(transaction);
    }

    console.log(`✅ Generated ${count} whale transaction(s). Total: ${whaleTransactions.length}`);
}

// Display Whale Transaction
function displayWhaleTransaction(transaction) {
    const feed = document.getElementById('whaleFeed');

    // Remove loading message if present
    const loadingMsg = feed.querySelector('.loading-whales');
    if (loadingMsg) {
        loadingMsg.remove();
    }

    // Create transaction card
    const card = document.createElement('div');
    card.className = `whale-transaction ${transaction.category}`;

    // Determine whale badge
    let badge, badgeIcon;
    if (transaction.category === 'baby') {
        badge = 'Baby Whale';
        badgeIcon = '🐋';
    } else if (transaction.category === 'adult') {
        badge = 'Adult Whale';
        badgeIcon = '🐳';
    } else {
        badge = 'LEGENDARY WHALE';
        badgeIcon = '🐳👑';
    }

    // Format time ago
    const now = Date.now();
    const diff = now - transaction.timestamp.getTime();
    const minutesAgo = Math.floor(diff / 60000);
    const timeAgo = minutesAgo === 0 ? 'Just now' :
                    minutesAgo === 1 ? '1 minute ago' :
                    `${minutesAgo} minutes ago`;

    // Build card HTML
    card.innerHTML = `
        <div class="whale-header-info">
            <span class="whale-badge ${transaction.category}">${badgeIcon} ${badge}</span>
            <span class="whale-time">${timeAgo}</span>
        </div>
        <div class="whale-amount">${transaction.btcAmount.toFixed(2)} BTC</div>
        <div class="whale-usd">$${transaction.usdValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}</div>
        <div class="whale-commentary">${transaction.commentary}</div>
    `;

    // Insert at the top of feed (after any existing transactions)
    if (feed.firstChild) {
        feed.insertBefore(card, feed.firstChild);
    } else {
        feed.appendChild(card);
    }

    // Remove oldest cards if more than 20
    while (feed.children.length > 20) {
        feed.lastChild.remove();
    }

    console.log(`📊 Displayed ${transaction.category} whale: ${transaction.btcAmount.toFixed(2)} BTC ($${transaction.usdValue.toLocaleString('en-US')})`);
}

// ========== SOCIAL SENTIMENT TRACKER FUNCTIONS ==========

// Initialize Sentiment Tracker
function initSentimentTracker() {
    console.log('💬 Initializing social sentiment tracker...');

    try {
        // Generate initial sentiment data
        generateSentimentData();

        // Wire up refresh button
        const refreshBtn = document.getElementById('refreshSentimentBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 Manual sentiment refresh triggered');
                try {
                    generateSentimentData();
                } catch (error) {
                    console.error('❌ Error refreshing sentiment:', error);
                }
            });
        } else {
            console.warn('⚠️ Refresh sentiment button not found');
        }

        // Auto-refresh: Update sentiment every 60 seconds (1 minute)
        sentimentRefreshInterval = setInterval(() => {
            console.log('⏰ Auto-refresh: updating sentiment data');
            try {
                generateSentimentData();
            } catch (error) {
                console.error('❌ Error in auto-refresh:', error);
            }
        }, 60000);

        console.log('✅ Sentiment tracker initialized!');
    } catch (error) {
        console.error('❌ Error initializing sentiment tracker:', error);
    }
}

// Generate Sentiment Data
function generateSentimentData() {
    console.log('💬 Generating sentiment data...');

    try {
        // Base sentiment influenced by price change
        let baseSentiment = 50; // Neutral baseline

        // Adjust based on current price change (if available)
        if (priceChange24h !== 0 && !isNaN(priceChange24h)) {
            // Map price change to sentiment: -20% = 0, 0% = 50, +20% = 100
            baseSentiment = Math.max(0, Math.min(100, 50 + (priceChange24h * 2.5)));
        }

    // Add some randomness (-15 to +15)
    const randomAdjustment = (Math.random() - 0.5) * 30;
    const overallScore = Math.max(0, Math.min(100, baseSentiment + randomAdjustment));

    // Calculate breakdown percentages
    let bullish, neutral, bearish;

    if (overallScore >= 65) {
        // Bullish overall
        bullish = 45 + Math.random() * 20; // 45-65%
        bearish = 10 + Math.random() * 15; // 10-25%
        neutral = 100 - bullish - bearish;
    } else if (overallScore >= 35) {
        // Neutral overall
        neutral = 35 + Math.random() * 15; // 35-50%
        bullish = 25 + Math.random() * 20; // 25-45%
        bearish = 100 - bullish - neutral;
    } else {
        // Bearish overall
        bearish = 40 + Math.random() * 20; // 40-60%
        bullish = 10 + Math.random() * 20; // 10-30%
        neutral = 100 - bullish - bearish;
    }

    // Generate platform-specific sentiments
    const platformSentiments = socialPlatforms.map(platform => {
        const platformScore = Math.max(0, Math.min(100, overallScore + (Math.random() - 0.5) * 30));
        return {
            ...platform,
            score: Math.round(platformScore)
        };
    });

    // Generate trending topics
    const topics = selectTrendingTopics(overallScore);

    // Store data
    sentimentData = {
        overall: Math.round(overallScore),
        breakdown: {
            bullish: Math.round(bullish),
            neutral: Math.round(neutral),
            bearish: Math.round(bearish)
        },
        platforms: platformSentiments,
        topics: topics
    };

        // Display everything
        displayOverallSentiment();
        displayPlatformSentiments();
        displayTrendingTopics();

        console.log(`✅ Sentiment data generated: Overall ${sentimentData.overall}/100`);
    } catch (error) {
        console.error('❌ Error generating sentiment data:', error);
    }
}

// Select Trending Topics based on sentiment
function selectTrendingTopics(overallScore) {
    const topics = [];

    if (overallScore >= 60) {
        // Bullish - mostly bullish topics
        topics.push(...getRandomItems(trendingTopicsPool.bullish, 5));
        topics.push(...getRandomItems(trendingTopicsPool.neutral, 3));
    } else if (overallScore >= 40) {
        // Neutral - mix of all
        topics.push(...getRandomItems(trendingTopicsPool.bullish, 3));
        topics.push(...getRandomItems(trendingTopicsPool.neutral, 4));
        topics.push(...getRandomItems(trendingTopicsPool.bearish, 1));
    } else {
        // Bearish - mostly bearish topics
        topics.push(...getRandomItems(trendingTopicsPool.bearish, 4));
        topics.push(...getRandomItems(trendingTopicsPool.neutral, 3));
        topics.push(...getRandomItems(trendingTopicsPool.bullish, 1));
    }

    return topics;
}

// Get random items from array
function getRandomItems(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Display Overall Sentiment
function displayOverallSentiment() {
    const score = sentimentData.overall;
    const breakdown = sentimentData.breakdown;

    // Update icon and label
    let icon, label;
    if (score >= 75) {
        icon = '🚀';
        label = 'Extremely Bullish';
    } else if (score >= 60) {
        icon = '😎';
        label = 'Bullish';
    } else if (score >= 45) {
        icon = '🙂';
        label = 'Slightly Bullish';
    } else if (score >= 40) {
        icon = '😐';
        label = 'Neutral';
    } else if (score >= 30) {
        icon = '😬';
        label = 'Slightly Bearish';
    } else if (score >= 20) {
        icon = '😰';
        label = 'Bearish';
    } else {
        icon = '😱';
        label = 'Extremely Bearish';
    }

    document.getElementById('overallSentimentIcon').textContent = icon;
    document.getElementById('overallSentimentScore').textContent = score;
    document.getElementById('overallSentimentLabel').textContent = label;

    // Update breakdown
    document.getElementById('bullishPercent').textContent = breakdown.bullish + '%';
    document.getElementById('neutralPercent').textContent = breakdown.neutral + '%';
    document.getElementById('bearishPercent').textContent = breakdown.bearish + '%';

    console.log(`📊 Overall sentiment displayed: ${score} (${label})`);
}

// Display Platform Sentiments
function displayPlatformSentiments() {
    const grid = document.getElementById('platformGrid');

    // Remove loading message
    const loading = grid.querySelector('.loading-sentiment');
    if (loading) {
        loading.remove();
    }

    // Clear existing cards
    grid.innerHTML = '';

    // Create card for each platform
    sentimentData.platforms.forEach(platform => {
        const card = document.createElement('div');
        card.className = 'platform-card';

        // Determine sentiment class
        let sentimentClass, meterWidth;
        if (platform.score >= 60) {
            sentimentClass = 'positive';
            meterWidth = ((platform.score - 50) / 50) * 100; // 60-100 maps to 20-100%
        } else if (platform.score >= 40) {
            sentimentClass = 'neutral';
            meterWidth = 50; // Neutral always 50%
        } else {
            sentimentClass = 'negative';
            meterWidth = (platform.score / 40) * 100; // 0-40 maps to 0-100%
        }

        card.innerHTML = `
            <div class="platform-header">
                <div class="platform-icon">${platform.icon}</div>
                <div class="platform-name">${platform.name}</div>
            </div>
            <div class="platform-score ${sentimentClass}">${platform.score}</div>
            <div class="platform-meter">
                <div class="platform-meter-fill ${sentimentClass}" style="width: ${meterWidth}%"></div>
            </div>
        `;

        grid.appendChild(card);
    });

    console.log(`✅ Platform sentiments displayed (${sentimentData.platforms.length} platforms)`);
}

// Display Trending Topics
function displayTrendingTopics() {
    const container = document.getElementById('trendingTopics');

    // Remove loading message
    const loading = container.querySelector('.loading-sentiment');
    if (loading) {
        loading.remove();
    }

    // Clear existing topics
    container.innerHTML = '';

    // Create tag for each topic
    sentimentData.topics.forEach(topic => {
        const tag = document.createElement('div');
        tag.className = 'topic-tag';

        // Classify topic
        if (trendingTopicsPool.bullish.includes(topic)) {
            tag.classList.add('bullish');
        } else if (trendingTopicsPool.bearish.includes(topic)) {
            tag.classList.add('bearish');
        } else {
            tag.classList.add('neutral');
        }

        tag.textContent = topic;
        container.appendChild(tag);
    });

    console.log(`✅ Trending topics displayed (${sentimentData.topics.length} topics)`);
}

// ========== PRICE ALERTS FUNCTIONS ==========

// Initialize Price Alerts
function initPriceAlerts() {
    console.log('🔔 Initializing price alerts...');

    try {
        // Load saved alerts from localStorage
        loadPriceAlerts();

        // Check notification permission
        checkNotificationPermission();

        // Wire up create alert button
        const createBtn = document.getElementById('createAlertBtn');
        if (createBtn) {
            createBtn.addEventListener('click', createPriceAlert);
        }

        // Display current alerts
        displayPriceAlerts();

        console.log('✅ Price alerts initialized!');
    } catch (error) {
        console.error('❌ Error initializing price alerts:', error);
    }
}

// Check Notification Permission
function checkNotificationPermission() {
    if (!('Notification' in window)) {
        console.warn('⚠️ This browser does not support notifications');
        updateNotificationStatus('unsupported', '❌ Notifications not supported in this browser');
        return;
    }

    notificationPermission = Notification.permission;

    if (notificationPermission === 'granted') {
        updateNotificationStatus('enabled', '✅ Notifications enabled');
    } else if (notificationPermission === 'denied') {
        updateNotificationStatus('denied', '❌ Notifications blocked. Enable them in browser settings.');
    } else {
        updateNotificationStatus('default', '🔔 Click "Create Alert" to enable notifications');
    }
}

// Update Notification Status Display
function updateNotificationStatus(status, message) {
    const statusEl = document.getElementById('notificationStatus');
    const iconEl = document.getElementById('notificationIcon');
    const textEl = document.getElementById('notificationText');

    // Remove all status classes
    statusEl.className = 'notification-status';

    if (status === 'enabled') {
        statusEl.classList.add('enabled');
        iconEl.textContent = '✅';
    } else if (status === 'denied') {
        statusEl.classList.add('denied');
        iconEl.textContent = '❌';
    } else {
        iconEl.textContent = '🔔';
    }

    textEl.textContent = message;
}

// Request Notification Permission
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        alert('This browser does not support desktop notifications');
        return false;
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;

        if (permission === 'granted') {
            updateNotificationStatus('enabled', '✅ Notifications enabled');
            return true;
        } else {
            updateNotificationStatus('denied', '❌ Notifications blocked');
            return false;
        }
    }

    return false;
}

// Create Price Alert
async function createPriceAlert() {
    console.log('🔔 Creating price alert...');

    try {
        // Get input values
        const priceInput = document.getElementById('alertPrice');
        const typeSelect = document.getElementById('alertType');

        const targetPrice = parseFloat(priceInput.value);
        const alertType = typeSelect.value;

        // Validate
        if (isNaN(targetPrice) || targetPrice <= 0) {
            alert('Please enter a valid price!');
            return;
        }

        // Request notification permission if needed
        const hasPermission = await requestNotificationPermission();
        if (!hasPermission) {
            alert('Please enable notifications to create price alerts!');
            return;
        }

        // Create alert object
        const alert = {
            id: alertIdCounter++,
            targetPrice: targetPrice,
            type: alertType, // 'above' or 'below'
            triggered: false,
            createdAt: new Date()
        };

        // Add to alerts array
        priceAlerts.push(alert);

        // Save to localStorage
        savePriceAlerts();

        // Update display
        displayPriceAlerts();

        // Clear input
        priceInput.value = '';

        console.log(`✅ Alert created: ${alertType} $${targetPrice}`);
    } catch (error) {
        console.error('❌ Error creating alert:', error);
        alert('Error creating alert. Please try again.');
    }
}

// Check Price Alerts
function checkPriceAlerts(currentPrice) {
    if (priceAlerts.length === 0 || currentPrice <= 0) return;

    priceAlerts.forEach(alert => {
        if (alert.triggered) return; // Skip already triggered alerts

        let shouldTrigger = false;

        if (alert.type === 'above' && currentPrice >= alert.targetPrice) {
            shouldTrigger = true;
        } else if (alert.type === 'below' && currentPrice <= alert.targetPrice) {
            shouldTrigger = true;
        }

        if (shouldTrigger) {
            triggerAlert(alert, currentPrice);
        }
    });
}

// Trigger Alert
function triggerAlert(alert, currentPrice) {
    console.log(`🔔 Alert triggered! ${alert.type} $${alert.targetPrice}`);

    // Mark as triggered
    alert.triggered = true;

    // Send browser notification
    sendNotification(alert, currentPrice);

    // Update display
    displayPriceAlerts();

    // Save to localStorage
    savePriceAlerts();
}

// Send Browser Notification
function sendNotification(alert, currentPrice) {
    if (Notification.permission !== 'granted') return;

    const title = alert.type === 'above'
        ? `🚀 Bitcoin Above $${alert.targetPrice.toLocaleString()}!`
        : `📉 Bitcoin Below $${alert.targetPrice.toLocaleString()}!`;

    const body = `Current price: $${currentPrice.toLocaleString()}\nYour price alert has been triggered!`;

    const notification = new Notification(title, {
        body: body,
        icon: '🔔',
        requireInteraction: true
    });

    // Play sound
    if (soundEnabled) {
        playMilestoneBell();
    }

    console.log('📬 Notification sent:', title);
}

// Display Price Alerts
function displayPriceAlerts() {
    const container = document.getElementById('alertsList');
    const countEl = document.getElementById('alertCount');

    // Update count
    countEl.textContent = priceAlerts.length;

    // Clear container
    container.innerHTML = '';

    if (priceAlerts.length === 0) {
        container.innerHTML = '<p class="no-alerts">No active alerts. Create one above!</p>';
        return;
    }

    // Sort: triggered last
    const sortedAlerts = [...priceAlerts].sort((a, b) => {
        if (a.triggered === b.triggered) return b.id - a.id;
        return a.triggered ? 1 : -1;
    });

    // Display each alert
    sortedAlerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item${alert.triggered ? ' triggered' : ''}`;
        alertDiv.setAttribute('data-alert-id', alert.id);

        const typeText = alert.type === 'above' ? 'Above' : 'Below';
        const icon = alert.type === 'above' ? '🚀' : '📉';

        alertDiv.innerHTML = `
            <div class="alert-info">
                <div class="alert-price ${alert.type}">
                    ${icon} $${alert.targetPrice.toLocaleString()}
                </div>
                <div class="alert-type">Alert when price goes ${typeText.toUpperCase()}</div>
            </div>
            <div class="alert-status ${alert.triggered ? 'triggered' : 'waiting'}">
                ${alert.triggered ? '✅ Triggered' : '⏳ Waiting'}
            </div>
            <button class="delete-alert-btn" onclick="deletePriceAlert(${alert.id})">🗑️ Delete</button>
        `;

        container.appendChild(alertDiv);
    });

    console.log(`✅ Displayed ${priceAlerts.length} alerts`);
}

// Delete Price Alert
window.deletePriceAlert = function(alertId) {
    console.log(`🗑️ Deleting alert ${alertId}`);

    // Remove from array
    priceAlerts = priceAlerts.filter(alert => alert.id !== alertId);

    // Save to localStorage
    savePriceAlerts();

    // Update display
    displayPriceAlerts();

    console.log('✅ Alert deleted');
};

// Save Alerts to localStorage
function savePriceAlerts() {
    try {
        localStorage.setItem('priceAlerts', JSON.stringify(priceAlerts));
        localStorage.setItem('alertIdCounter', alertIdCounter.toString());
    } catch (error) {
        console.error('❌ Error saving alerts:', error);
    }
}

// Load Alerts from localStorage
function loadPriceAlerts() {
    try {
        const saved = localStorage.getItem('priceAlerts');
        const savedCounter = localStorage.getItem('alertIdCounter');

        if (saved) {
            priceAlerts = JSON.parse(saved);
            console.log(`✅ Loaded ${priceAlerts.length} saved alerts`);
        }

        if (savedCounter) {
            alertIdCounter = parseInt(savedCounter);
        }
    } catch (error) {
        console.error('❌ Error loading alerts:', error);
        priceAlerts = [];
    }
}

// ========== EMOJI RAIN FUNCTIONS ==========

// Initialize Emoji Rain
function initEmojiRain() {
    console.log('🌧️ Emoji rain system ready!');
}

// ========== ANIMATED PRICE MOVEMENTS FUNCTIONS ==========

// Animate Price Change
function animatePriceChange(priceElement, change, previousPrice, currentPrice) {
    // Only animate if there's an actual price change
    if (previousPrice <= 0 || previousPrice === currentPrice) {
        return;
    }

    // Remove any existing animation classes
    priceElement.classList.remove('price-update-animate', 'price-increase-animate', 'price-decrease-animate');

    // Determine animation based on change
    if (Math.abs(change) < 0.5) {
        // Small change - just pulse
        priceElement.classList.add('price-update-animate');
    } else if (change > 0) {
        // Price increase - animate up
        priceElement.classList.add('price-increase-animate');
        addPriceArrow(priceElement, 'up');
    } else {
        // Price decrease - animate down
        priceElement.classList.add('price-decrease-animate');
        addPriceArrow(priceElement, 'down');
    }

    // Add ripple effect to price card
    const priceCard = priceElement.closest('.price-card');
    if (priceCard && Math.abs(change) >= 1) {
        priceCard.classList.remove('ripple-green', 'ripple-red');
        const rippleClass = change > 0 ? 'ripple-green' : 'ripple-red';
        priceCard.classList.add(rippleClass);

        // Remove ripple class after animation
        setTimeout(() => {
            priceCard.classList.remove(rippleClass);
        }, 600);
    }

    // Remove animation class after animation completes
    setTimeout(() => {
        priceElement.classList.remove('price-update-animate', 'price-increase-animate', 'price-decrease-animate');
    }, 600);
}

// Add Price Arrow Indicator
function addPriceArrow(priceElement, direction) {
    // Remove any existing arrows
    const existingArrow = priceElement.querySelector('.price-arrow');
    if (existingArrow) {
        existingArrow.remove();
    }

    // Create new arrow
    const arrow = document.createElement('span');
    arrow.className = 'price-arrow';
    arrow.textContent = direction === 'up' ? '↑' : '↓';
    arrow.style.color = direction === 'up' ? '#28a745' : '#dc3545';

    // Add to price element's parent (current-price)
    const container = priceElement.closest('.current-price');
    if (container) {
        container.style.position = 'relative';
        container.appendChild(arrow);

        // Remove arrow after animation
        setTimeout(() => {
            arrow.remove();
        }, 1500);
    }
}

// Animate Stats Update
function animateStatsUpdate() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        stat.classList.add('update');
        setTimeout(() => {
            stat.classList.remove('update');
        }, 400);
    });
}

// ========== THEME SYSTEM FUNCTIONS ==========

// Initialize Theme System
function initThemeSystem() {
    console.log('🎨 Initializing theme system...');

    try {
        // Load saved theme
        loadTheme();

        // Wire up theme button
        const themeBtn = document.getElementById('themeBtn');
        if (themeBtn) {
            themeBtn.addEventListener('click', openThemeSelector);
        }

        // Wire up close button
        const closeBtn = document.getElementById('closeThemeSelector');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeThemeSelector);
        }

        // Wire up theme options
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-theme');
                applyTheme(theme);
            });
        });

        // Close selector when clicking outside
        const themeSelector = document.getElementById('themeSelector');
        if (themeSelector) {
            themeSelector.addEventListener('click', (e) => {
                if (e.target === themeSelector) {
                    closeThemeSelector();
                }
            });
        }

        console.log('✅ Theme system initialized!');
    } catch (error) {
        console.error('❌ Error initializing theme system:', error);
    }
}

// Open Theme Selector
function openThemeSelector() {
    const selector = document.getElementById('themeSelector');
    if (selector) {
        selector.classList.add('active');
        updateActiveThemeOption();
    }
}

// Close Theme Selector
function closeThemeSelector() {
    const selector = document.getElementById('themeSelector');
    if (selector) {
        selector.classList.remove('active');
    }
}

// Apply Theme
function applyTheme(theme) {
    console.log(`🎨 Applying theme: ${theme}`);

    // Remove all theme classes
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-bitcoin', 'theme-matrix', 'theme-lions', 'theme-chicago', 'theme-msu', 'theme-umich');

    // Add new theme class
    if (theme !== 'light') {
        document.body.classList.add(`theme-${theme}`);
    }

    // Update current theme
    currentTheme = theme;

    // Save to localStorage
    try {
        localStorage.setItem('bitcoinAppTheme', theme);
    } catch (error) {
        console.error('❌ Error saving theme:', error);
    }

    // Update active theme option
    updateActiveThemeOption();

    // Close selector
    closeThemeSelector();

    console.log(`✅ Theme applied: ${theme}`);
}

// Update Active Theme Option
function updateActiveThemeOption() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
        const theme = option.getAttribute('data-theme');
        if (theme === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Load Theme from localStorage
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('bitcoinAppTheme');
        if (savedTheme) {
            currentTheme = savedTheme;
            applyTheme(savedTheme);
            console.log(`✅ Loaded saved theme: ${savedTheme}`);
        } else {
            console.log('ℹ️ No saved theme, using default (light)');
        }
    } catch (error) {
        console.error('❌ Error loading theme:', error);
    }
}

// ========== COPE GENERATOR FUNCTIONS ==========

// Cope Messages Database
const copeMessages = {
    denial: [
        { emoji: '🙈', message: "It's not a loss if you don't sell! Your portfolio is just temporarily embarrassed.", category: 'Denial' },
        { emoji: '😤', message: "This is just a healthy correction. Nothing to worry about. Everything is fine. EVERYTHING IS FINE.", category: 'Denial' },
        { emoji: '🤡', message: "Losses? I don't see any losses. This chart is just upside down, that's all.", category: 'Denial' }
    ],
    rationalization: [
        { emoji: '🧠', message: "You're not losing money, you're paying tuition at the University of Crypto.", category: 'Rationalization' },
        { emoji: '📚', message: "Think of it as dollar-cost averaging... into the ground. It's all part of the plan!", category: 'Rationalization' },
        { emoji: '💡', message: "Your portfolio isn't down, it's just practicing social distancing from your initial investment.", category: 'Rationalization' }
    ],
    hope: [
        { emoji: '🌅', message: "Remember: Bitcoin went from $0 to $69k. Your $50k entry is basically early adoption!", category: 'Hope' },
        { emoji: '🚀', message: "The dip before the rip! We're just refueling for the moon mission!", category: 'Hope' },
        { emoji: '💎', message: "Diamond hands are forged in the fires of red candles. You're becoming stronger!", category: 'Hope' },
        { emoji: '🔮', message: "In 10 years, you'll look back and laugh at worrying about a 50% drop.", category: 'Hope' }
    ],
    humor: [
        { emoji: '😂', message: "Your portfolio is doing the limbo: How low can you go?", category: 'Humor' },
        { emoji: '🎢', message: "Investing in crypto is like a rollercoaster, except the safety bars are optional and the tracks are made of hopes and dreams.", category: 'Humor' },
        { emoji: '🍜', message: "Ramen never tasted so good! Think of all the culinary adventures ahead!", category: 'Humor' },
        { emoji: '🎪', message: "Welcome to the circus! You're not a clown, you're the entire entertainment.", category: 'Humor' }
    ],
    technical: [
        { emoji: '📊', message: "We're clearly in a textbook Wyckoff accumulation phase. This is bullish AF!", category: 'Technical Copium' },
        { emoji: '📈', message: "The RSI is oversold! The MACD is about to cross! The tea leaves say moon! Trust the TA!", category: 'Technical Copium' },
        { emoji: '🔍', message: "According to Fibonacci retracement, we're exactly where we should be. Probably.", category: 'Technical Copium' }
    ],
    philosophical: [
        { emoji: '🧘', message: "Money is just a social construct anyway. You're spiritually rich!", category: 'Philosophy' },
        { emoji: '🌟', message: "The real treasure is the financial literacy we gained along the way.", category: 'Philosophy' },
        { emoji: '⚡', message: "You're not poor, you're just pre-wealthy. It's a state of mind!", category: 'Philosophy' }
    ],
    comparison: [
        { emoji: '💪', message: "At least you didn't buy $LUNA at $119. Count your blessings!", category: 'Perspective' },
        { emoji: '🙏', message: "Be grateful - you could have been that pizza guy who spent 10,000 BTC on two pizzas.", category: 'Perspective' },
        { emoji: '🎯', message: "You're down 60%? That's rookie numbers. Some people lost everything in FTX!", category: 'Perspective' }
    ],
    delusion: [
        { emoji: '🤑', message: "This is actually good for Bitcoin! Everything is good for Bitcoin!", category: 'Delusion' },
        { emoji: '🎰', message: "You haven't lost money, you've just exchanged it for valuable life lessons!", category: 'Delusion' },
        { emoji: '🔥', message: "Your portfolio isn't crashing, it's speed running to the bottom so it can bounce back faster!", category: 'Delusion' }
    ]
};

// Initialize Cope Generator
function initCopeGenerator() {
    console.log('💎 Initializing Cope Generator...');

    try {
        // Load saved cope counter
        loadCopeCounter();

        // Wire up generate button
        const generateBtn = document.getElementById('generateCopeBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generateCope);
        }

        console.log('✅ Cope Generator initialized!');
    } catch (error) {
        console.error('❌ Error initializing Cope Generator:', error);
    }
}

// Generate Cope Message
function generateCope() {
    console.log('💎 Generating cope...');

    try {
        // Get all categories
        const categories = Object.keys(copeMessages);

        // Pick random category
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        // Get messages from that category
        const categoryMessages = copeMessages[randomCategory];

        // Pick random message
        const randomMessage = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];

        // Update UI
        document.getElementById('copeEmoji').textContent = randomMessage.emoji;
        document.getElementById('copeMessage').textContent = randomMessage.message;
        document.getElementById('copeCategory').textContent = randomMessage.category;

        // Increment and save counter
        copeCounter++;
        document.getElementById('copeCounter').textContent = copeCounter;
        saveCopeCounter();

        // Trigger animations (re-add classes)
        const copeOutput = document.querySelector('.cope-output');
        copeOutput.style.animation = 'none';
        setTimeout(() => {
            copeOutput.style.animation = '';
        }, 10);

        console.log(`✅ Cope generated: ${randomMessage.category}`);
    } catch (error) {
        console.error('❌ Error generating cope:', error);
    }
}

// Save Cope Counter
function saveCopeCounter() {
    try {
        localStorage.setItem('copeCounter', copeCounter.toString());
    } catch (error) {
        console.error('❌ Error saving cope counter:', error);
    }
}

// Load Cope Counter
function loadCopeCounter() {
    try {
        const saved = localStorage.getItem('copeCounter');
        if (saved) {
            copeCounter = parseInt(saved);
            document.getElementById('copeCounter').textContent = copeCounter;
            console.log(`✅ Loaded cope counter: ${copeCounter}`);
        }
    } catch (error) {
        console.error('❌ Error loading cope counter:', error);
    }
}

// ========== COMMUNITY CHAT FUNCTIONS ==========

// Chat Users Database
const chatUsers = [
    { name: 'SatoshiDreamer', avatar: '🚀' },
    { name: 'HODL_King', avatar: '💎' },
    { name: 'CryptoWhale47', avatar: '🐋' },
    { name: 'MoonBoi2024', avatar: '🌕' },
    { name: 'DiamondHands', avatar: '💪' },
    { name: 'BTCMaximalist', avatar: '₿' },
    { name: 'StackingSats', avatar: '⚡' },
    { name: 'NoCoiner4Ever', avatar: '🤡' },
    { name: 'RektInvestor', avatar: '😭' },
    { name: 'LamboWhen', avatar: '🏎️' },
    { name: 'ChartWizard', avatar: '📊' },
    { name: 'TechAnalyst42', avatar: '📈' },
    { name: 'FUDResistant', avatar: '🛡️' },
    { name: 'PanicSeller', avatar: '😱' },
    { name: 'RamenDietPro', avatar: '🍜' }
];

// Chat Messages Templates
const chatMessageTemplates = {
    bullish: [
        "We're definitely breaking $100k this year!",
        "This is the dip before the rip 🚀",
        "Just bought more! Diamond hands baby!",
        "Altcoins are cool but BTC is king",
        "The bullrun is just getting started",
        "Institutional adoption is real now",
        "Historical data shows we're in accumulation phase",
        "Can't wait to tell my grandkids I bought at these prices",
        "HODL strong everyone! We got this!",
        "This time it's different, trust me bro"
    ],
    bearish: [
        "I think we might see $20k again...",
        "Should've sold at the top 😭",
        "Zoom out, we're still in a bear market",
        "Taking profits here, good luck everyone",
        "The chart looks terrible right now",
        "When will the bleeding stop?",
        "My portfolio is down 60%, anyone else?",
        "Ramen for dinner again tonight",
        "I'm officially a long-term investor now 🤡",
        "At least I can write off capital losses"
    ],
    neutral: [
        "What are your thoughts on the current price?",
        "Still DCA'ing every week regardless",
        "Long term, none of this matters",
        "Remind me again why I didn't buy gold?",
        "Coffee and charts, my morning routine ☕",
        "Anyone else just numb to the volatility now?",
        "The sideways action is killing me",
        "Healthy consolidation period imo",
        "Taking a break from checking prices every 5 minutes",
        "Price doesn't matter, accumulation matters"
    ],
    questions: [
        "What's everyone's average buy price?",
        "Should I take profits or wait?",
        "Anyone know why we're pumping/dumping?",
        "Is this a good entry point?",
        "Cold wallet or exchange?",
        "When is the next halving?",
        "What's your price target for EOY?",
        "Hardware wallet recommendations?",
        "DCA or lump sum?",
        "Anyone watching the stock market correlation?"
    ],
    memes: [
        "In this house we HODL 💎🙌",
        "Buy high, sell low - that's my strategy",
        "Not your keys, not your coins!",
        "Few understand",
        "Have fun staying poor! 😂",
        "It's okay to take profits. Said no one ever.",
        "I'm not addicted to charts, I can stop anytime",
        "My therapist: The dip can't hurt you. The dip:",
        "Wife: We need to talk. Me: Can it wait? BTC is moving",
        "Instructions unclear, bought more BTC"
    ]
};

// Initialize Community Chat
function initCommunityChat() {
    console.log('💬 Initializing Community Chat...');

    try {
        // Clear welcome message and add initial messages
        setTimeout(() => {
            const chatContainer = document.getElementById('chatMessages');
            if (chatContainer) {
                chatContainer.innerHTML = '';

                // Add 3 initial messages
                for (let i = 0; i < 3; i++) {
                    addChatMessage();
                }
            }
        }, 2000);

        // Generate new message every 8-15 seconds
        chatInterval = setInterval(() => {
            addChatMessage();
        }, Math.random() * 7000 + 8000); // 8-15 seconds

        // Update online count every 10 seconds
        setInterval(updateOnlineCount, 10000);

        console.log('✅ Community Chat initialized!');
    } catch (error) {
        console.error('❌ Error initializing Community Chat:', error);
    }
}

// Add Chat Message
function addChatMessage() {
    try {
        const chatContainer = document.getElementById('chatMessages');
        if (!chatContainer) return;

        // Determine message sentiment based on price change
        let sentiment = 'neutral';
        if (priceChange24h > 2) {
            sentiment = 'bullish';
        } else if (priceChange24h < -2) {
            sentiment = 'bearish';
        }

        // Pick message category based on sentiment and randomness
        const random = Math.random();
        let category;

        if (random < 0.4) {
            category = sentiment;
        } else if (random < 0.6) {
            category = 'questions';
        } else if (random < 0.8) {
            category = 'memes';
        } else {
            category = 'neutral';
        }

        // Get random message from category
        const messages = chatMessageTemplates[category];
        const message = messages[Math.floor(Math.random() * messages.length)];

        // Get random user
        const user = chatUsers[Math.floor(Math.random() * chatUsers.length)];

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message message-${sentiment}`;

        const now = new Date();
        const timestamp = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-avatar">${user.avatar}</span>
                <span class="message-username">${user.name}</span>
                <span class="message-timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${message}</div>
        `;

        // Add to container
        chatContainer.appendChild(messageDiv);

        // Keep only last 50 messages
        const allMessages = chatContainer.querySelectorAll('.chat-message');
        if (allMessages.length > 50) {
            allMessages[0].remove();
        }

        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        console.log(`💬 Chat message added: ${user.name}`);
    } catch (error) {
        console.error('❌ Error adding chat message:', error);
    }
}

// Update Online Count
function updateOnlineCount() {
    try {
        // Randomly adjust online count by ±1-10
        const change = Math.floor(Math.random() * 20) - 10;
        onlineCount = Math.max(100, Math.min(500, onlineCount + change));

        const countElement = document.getElementById('onlineCount');
        if (countElement) {
            countElement.textContent = onlineCount;
        }
    } catch (error) {
        console.error('❌ Error updating online count:', error);
    }
}

// Trigger Emoji Rain
function triggerEmojiRain(type, intensity = 30) {
    // Prevent spam - minimum 10 seconds between rains
    const now = Date.now();
    if (emojiRainActive || (now - lastEmojiRainTime) < 10000) {
        console.log('⏳ Emoji rain cooldown active');
        return;
    }

    console.log(`🌧️ Triggering ${type} emoji rain with intensity ${intensity}`);

    emojiRainActive = true;
    lastEmojiRainTime = now;

    // Choose emojis based on type
    const emojis = type === 'bullish'
        ? ['🚀', '💎', '💰', '🤑', '📈', '🔥', '💪', '🌕', '⭐', '✨']
        : ['📉', '💀', '😱', '😭', '🔥', '💔', '😢', '⚠️', '🆘', '💸'];

    const container = document.getElementById('emojiRainContainer');

    // Create emoji rain
    for (let i = 0; i < intensity; i++) {
        setTimeout(() => {
            createFallingEmoji(container, emojis);
        }, i * 100); // Stagger creation by 100ms
    }

    // Mark rain as inactive after animation completes
    setTimeout(() => {
        emojiRainActive = false;
        console.log('✅ Emoji rain complete');
    }, (intensity * 100) + 4000); // Total animation time
}

// Create Falling Emoji
function createFallingEmoji(container, emojiArray) {
    const emoji = document.createElement('div');
    emoji.className = 'emoji-rain-item';

    // Random emoji from array
    emoji.textContent = emojiArray[Math.floor(Math.random() * emojiArray.length)];

    // Random horizontal position
    emoji.style.left = Math.random() * 100 + '%';

    // Random speed class
    const speeds = ['slow', 'medium', 'fast'];
    const randomSpeed = speeds[Math.floor(Math.random() * speeds.length)];
    emoji.classList.add(randomSpeed);

    // Add to container
    container.appendChild(emoji);

    // Remove after animation completes
    const duration = randomSpeed === 'slow' ? 4000 : randomSpeed === 'medium' ? 3000 : 2000;
    setTimeout(() => {
        if (emoji.parentNode) {
            emoji.parentNode.removeChild(emoji);
        }
    }, duration);
}

// Tab Navigation
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');

            // Scroll to top of page smoothly when switching tabs
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    });
}

// Use demo data when API fails (realistic, consistent data)
function useDemoData() {
    console.log('📊 Loading demo data (realistic simulation)...');

    // Use realistic Bitcoin price data (approximate current market values)
    // This matches approximately what Google shows
    const demoPrice = 96850.00; // Current realistic BTC price
    const demoChange = 1.23; // Current realistic 24h change (positive)

    previousPrice = currentPrice || demoPrice;
    currentPrice = demoPrice;
    priceChange24h = demoChange;

    // Log demo data for debugging
    console.log('📊 Demo Data (Realistic):', {
        price: demoPrice,
        change24h: demoChange,
        isPositive: demoChange > 0,
        shouldBeGreen: demoChange > 0 ? 'Yes' : 'No',
        note: 'Using realistic market values'
    });

    const demoHigh24h = 97920.00; // Realistic 24h high
    const demoLow24h = 95650.00; // Realistic 24h low
    const demoMarketCap = demoPrice * 19500000; // Approx circulating supply

    // Update UI with demo data
    updatePriceDisplay(currentPrice, priceChange24h);
    updateStats(demoHigh24h, demoLow24h, demoMarketCap);
    updateHumorSection(priceChange24h);
    updateSentiment(priceChange24h);
    updateLastUpdate();

    // Show demo mode banner
    const demoBanner = document.getElementById('demoBanner');
    if (demoBanner) {
        demoBanner.style.display = 'flex';
    }

    console.log('✅ Demo data loaded successfully');
}

// Try fetching from local proxy (bypasses CORS)
async function fetchFromLocalProxy() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(API_SOURCES.localProxy.price, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Proxy API error: ${response.status}`);

        const data = await response.json();
        console.log('✅ Successfully fetched from Local Proxy (Source: ' + data.source + ')');

        return {
            price: data.price,
            change24h: data.change24h,
            high24h: data.high24h,
            low24h: data.low24h,
            volume: data.volume,
            marketCap: data.marketCap
        };
    } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ Local Proxy failed:', error.message);
        throw error;
    }
}

// Try fetching from Binance API
async function fetchFromBinance() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(API_SOURCES.binance.price, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`Binance API error: ${response.status}`);

        const data = await response.json();
        console.log('✅ Successfully fetched from Binance API');

        return {
            price: parseFloat(data.lastPrice),
            change24h: parseFloat(data.priceChangePercent),
            high24h: parseFloat(data.highPrice),
            low24h: parseFloat(data.lowPrice),
            volume: parseFloat(data.volume),
            marketCap: parseFloat(data.lastPrice) * 19500000 // Approximate
        };
    } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ Binance API failed:', error.message);
        throw error;
    }
}

// Try fetching from CoinCap API
async function fetchFromCoinCap() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(API_SOURCES.coincap.price, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`CoinCap API error: ${response.status}`);

        const json = await response.json();
        const data = json.data;
        console.log('✅ Successfully fetched from CoinCap API');

        return {
            price: parseFloat(data.priceUsd),
            change24h: parseFloat(data.changePercent24Hr),
            high24h: parseFloat(data.priceUsd) * 1.02, // Approximate
            low24h: parseFloat(data.priceUsd) * 0.98, // Approximate
            volume: parseFloat(data.volumeUsd24Hr),
            marketCap: parseFloat(data.marketCapUsd)
        };
    } catch (error) {
        clearTimeout(timeoutId);
        console.log('❌ CoinCap API failed:', error.message);
        throw error;
    }
}

// Fetch Bitcoin Price
async function fetchBitcoinPrice() {
    if (isRefreshing) {
        console.log('⏳ Already fetching price...');
        return;
    }

    isRefreshing = true;

    // Animate refresh indicator
    const indicator = document.getElementById('autoRefreshIndicator');
    if (indicator) {
        indicator.classList.add('refreshing');
    }

    try {
        console.log('📡 Fetching Bitcoin price...');
        // Show loading state
        document.getElementById('btcPrice').innerHTML = '<span class="loading"></span>';

        let priceData = null;

        // Try local proxy first (bypasses CORS)
        try {
            priceData = await fetchFromLocalProxy();
        } catch (proxyError) {
            console.log('🔄 Trying Binance as fallback...');
            // Try Binance if proxy fails
            try {
                priceData = await fetchFromBinance();
            } catch (binanceError) {
                console.log('🔄 Trying CoinCap as fallback...');
                try {
                    priceData = await fetchFromCoinCap();
                } catch (coincapError) {
                console.log('🔄 Trying CoinGecko as last resort...');
                // Try CoinGecko as last resort
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(COINGECKO_API, {
                    signal: controller.signal,
                    headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`All APIs failed`);
                }

                const data = await response.json();

                const controller2 = new AbortController();
                const timeoutId2 = setTimeout(() => controller2.abort(), 10000);

                const detailedResponse = await fetch(DETAILED_API, {
                    signal: controller2.signal,
                    headers: { 'Accept': 'application/json' }
                });
                clearTimeout(timeoutId2);

                if (!detailedResponse.ok) {
                    throw new Error(`CoinGecko detailed API error`);
                }

                const detailedData = await detailedResponse.json();

                priceData = {
                    price: data.bitcoin.usd,
                    change24h: data.bitcoin.usd_24h_change,
                    high24h: detailedData.market_data.high_24h.usd,
                    low24h: detailedData.market_data.low_24h.usd,
                    marketCap: data.bitcoin.usd_market_cap
                };
                console.log('✅ Successfully fetched from CoinGecko API');
                }
            }
        }

        // Extract data
        previousPrice = currentPrice || priceData.price;
        currentPrice = priceData.price;
        priceChange24h = priceData.change24h;

        // Update UI
        updatePriceDisplay(currentPrice, priceChange24h);
        updateStats(priceData.high24h, priceData.low24h, priceData.marketCap);
        updateHumorSection(priceChange24h);
        updateSentiment(priceChange24h);
        updateLastUpdate();

        // Update converter price if initialized
        if (typeof updateConverterPrice === 'function') {
            updateConverterPrice();
        }

        // Hide demo banner if showing
        const demoBanner = document.getElementById('demoBanner');
        if (demoBanner) {
            demoBanner.style.display = 'none';
        }

    } catch (error) {
        console.error('❌ Error fetching Bitcoin price:', error);
        document.getElementById('btcPrice').textContent = 'Error';

        // Show detailed error message
        let errorType = 'Connection Error';
        let errorMsg = 'Failed to fetch Bitcoin price. ';

        if (error.name === 'AbortError') {
            errorType = 'Timeout Error';
            errorMsg = 'Request timed out. The API is taking too long to respond. ';
        } else if (error.message.includes('429')) {
            errorType = 'Rate Limit Exceeded';
            errorMsg = 'Too many requests to CoinGecko API. Please wait a moment. ';
        } else if (error.message.includes('Failed to fetch')) {
            errorType = 'Network Error';
            errorMsg = 'Cannot reach CoinGecko API. Check your internet connection or the API might be blocked. ';
        } else if (error.message.includes('status:')) {
            errorType = 'API Error';
            errorMsg = error.message + '. ';
        }

        errorMsg += 'Try refreshing or wait a minute for auto-refresh.';

        showErrorMessage(errorType, errorMsg);

        // Use demo data as fallback
        console.log('⚠️ Using demo data as fallback...');
        useDemoData();
    } finally {
        isRefreshing = false;

        // Remove refresh animation from indicator
        const indicator = document.getElementById('autoRefreshIndicator');
        if (indicator) {
            indicator.classList.remove('refreshing');
        }

        console.log('✅ Price fetch complete');
    }
}

// Update Price Display
function updatePriceDisplay(price, change) {
    const priceElement = document.getElementById('btcPrice');
    const changeElement = document.getElementById('priceChange');
    const changePercent = document.getElementById('changePercent');
    const changeAmount = document.getElementById('changeAmount');

    // Format price
    priceElement.textContent = price.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // Animate price change
    animatePriceChange(priceElement, change, previousPrice, price);

    // Format change
    const changeValue = (price * change / 100);
    changePercent.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeAmount.textContent = `(${changeValue >= 0 ? '+' : ''}$${Math.abs(changeValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;

    // Style based on change
    changeElement.className = 'price-change';
    const explanationElement = document.getElementById('changeExplanation');

    console.log('🔍 Debug: explanationElement found?', !!explanationElement);

    if (change > 0) {
        changeElement.classList.add('positive');
        if (explanationElement) {
            const explanationText = `${Math.abs(change).toFixed(2)}% increase today`;
            explanationElement.textContent = explanationText;
            console.log('📝 Set explanation:', explanationText);
        } else {
            console.warn('⚠️ Explanation element not found!');
        }
        console.log('✅ Price is UP (24h change: +' + change.toFixed(2) + '%) - Color: GREEN');
    } else if (change < 0) {
        changeElement.classList.add('negative');
        if (explanationElement) {
            const explanationText = `${Math.abs(change).toFixed(2)}% decrease today`;
            explanationElement.textContent = explanationText;
            console.log('📝 Set explanation:', explanationText);
        } else {
            console.warn('⚠️ Explanation element not found!');
        }
        console.log('📉 Price is DOWN (24h change: ' + change.toFixed(2) + '%) - Color: RED');
    } else {
        changeElement.classList.add('neutral');
        if (explanationElement) {
            explanationElement.textContent = 'No change today';
            console.log('📝 Set explanation: No change today');
        } else {
            console.warn('⚠️ Explanation element not found!');
        }
        console.log('➡️ Price is FLAT (24h change: 0%) - Color: GRAY');
    }

    // Play sounds based on price movement (only if previousPrice exists)
    if (previousPrice > 0 && previousPrice !== price) {
        // Check for milestone crossing first
        const crossedMilestone = checkPriceMilestone(previousPrice, price);

        // Only play pump/dump sounds if no milestone was crossed
        if (!crossedMilestone) {
            // Significant price change threshold: 1% for 24h change
            if (Math.abs(change) >= 1) {
                if (change > 0) {
                    playPumpSound();
                } else {
                    playDumpSound();
                }
            }
        }
    }

    // Trigger emoji rain on big price movements (5%+ change)
    if (Math.abs(change) >= 5) {
        const rainType = change > 0 ? 'bullish' : 'bearish';
        // Intensity based on magnitude: more emojis for bigger moves
        const intensity = Math.abs(change) >= 10 ? 50 : 30;
        triggerEmojiRain(rainType, intensity);
    }

    // Check price alerts
    checkPriceAlerts(price);
}

// Update Stats
function updateStats(high, low, marketCap) {
    document.getElementById('high24h').textContent = '$' + high.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    document.getElementById('low24h').textContent = '$' + low.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const marketCapBillions = (marketCap / 1e9).toFixed(2);
    document.getElementById('marketCap').textContent = '$' + marketCapBillions + 'B';

    // Animate stats update
    animateStatsUpdate();
}

// Update Humor Section - This is where the magic happens!
function updateHumorSection(change) {
    let category;

    // Determine reaction category based on price change
    if (change >= 15) {
        category = 'moonShot';
    } else if (change >= 5) {
        category = 'bigGain';
    } else if (change > 0.5) {
        category = 'smallGain';
    } else if (change >= -0.5 && change <= 0.5) {
        category = 'flat';
    } else if (change > -5) {
        category = 'smallLoss';
    } else if (change >= -15) {
        category = 'bigLoss';
    } else {
        category = 'crash';
    }

    // Get random reaction from category
    const reactions = humorReactions[category];
    const reaction = reactions[Math.floor(Math.random() * reactions.length)];

    // Update UI
    document.getElementById('moodEmoji').textContent = reaction.emoji;
    document.getElementById('humorTitle').textContent = reaction.title;
    document.getElementById('humorMessage').textContent = reaction.message;
    document.getElementById('memeContainer').textContent = reaction.meme;

    // Add animation
    const humorCard = document.querySelector('.mood-card');
    if (humorCard) {
        humorCard.style.animation = 'none';
        setTimeout(() => {
            humorCard.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
}

// Update Sentiment Meter
function updateSentiment(change) {
    const sentimentBar = document.getElementById('sentimentBar');
    const sentimentLabel = document.getElementById('sentimentLabel');

    let width, color, label;

    if (change >= 10) {
        width = '100%';
        color = 'linear-gradient(90deg, #28a745, #20c997)';
        label = 'EXTREME GREED 🤑';
    } else if (change >= 5) {
        width = '80%';
        color = 'linear-gradient(90deg, #28a745, #7dc97f)';
        label = 'GREED 😎';
    } else if (change > 0) {
        width = '60%';
        color = 'linear-gradient(90deg, #7dc97f, #b8e994)';
        label = 'Optimistic 😊';
    } else if (change >= -0.5 && change <= 0.5) {
        width = '50%';
        color = 'linear-gradient(90deg, #ffc107, #ffdb58)';
        label = 'Neutral 😐';
    } else if (change > -5) {
        width = '40%';
        color = 'linear-gradient(90deg, #ff9800, #ffa726)';
        label = 'Mild Fear 😬';
    } else if (change > -10) {
        width = '20%';
        color = 'linear-gradient(90deg, #f44336, #ff6b6b)';
        label = 'FEAR 😰';
    } else {
        width = '10%';
        color = 'linear-gradient(90deg, #d32f2f, #c62828)';
        label = 'EXTREME FEAR 😱💀';
    }

    sentimentBar.style.width = width;
    sentimentBar.style.background = color;
    sentimentLabel.textContent = label;
    sentimentLabel.style.color = change >= 0 ? '#28a745' : '#dc3545';
}

// Update Last Update Time
function updateLastUpdate() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}

// Show Error Message
function showErrorMessage(errorType = 'Connection Error', errorMsg = 'Failed to fetch Bitcoin price. Check your internet connection or the API might be down. Try refreshing!') {
    document.getElementById('moodEmoji').textContent = '⚠️';
    document.getElementById('humorTitle').textContent = errorType;
    document.getElementById('humorMessage').textContent = errorMsg;
    document.getElementById('memeContainer').textContent = '🔌❌';

    // Log to console for debugging
    console.log('📋 Error Details:', {
        type: errorType,
        message: errorMsg,
        timestamp: new Date().toISOString()
    });
}

// Format large numbers
function formatLargeNumber(num) {
    if (num >= 1e9) {
        return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
        return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
        return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

// ========== CHART FUNCTIONS ==========

// Initialize Chart
function initChart() {
    try {
        console.log('📊 Initializing chart...');
        const canvas = document.getElementById('priceChart');

        if (!canvas) {
            console.error('❌ Chart canvas not found!');
            return;
        }

        const ctx = canvas.getContext('2d');

        priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Bitcoin Price (USD)',
                data: [],
                borderColor: '#f7971e',
                backgroundColor: 'rgba(247, 151, 30, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointHoverBackgroundColor: '#f7971e',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#f7971e',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '$' + context.parsed.y.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        maxTicksLimit: 8,
                        color: '#666'
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString('en-US', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            });
                        },
                        color: '#666'
                    }
                }
            }
        }
    });

        console.log('✅ Chart initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing chart:', error);
        document.getElementById('chartAnnotation').textContent = '❌ Failed to initialize chart. Please refresh the page.';
    }
}

// Initialize Timeframe Buttons
function initTimeframeButtons() {
    const timeframeBtns = document.querySelectorAll('.timeframe-btn');

    timeframeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            timeframeBtns.forEach(b => b.classList.remove('active'));

            // Add active to clicked button
            btn.classList.add('active');

            // Get days value
            const days = btn.getAttribute('data-days');
            currentTimeframe = days;

            // Fetch new data
            fetchChartData(days);
        });
    });
}

// Fetch Chart Data
async function fetchChartData(days) {
    try {
        console.log(`📈 Fetching chart data for ${days} days...`);
        document.getElementById('chartAnnotation').textContent = 'Loading chart data...';

        if (!priceChart) {
            console.error('❌ Chart not initialized!');
            document.getElementById('chartAnnotation').textContent = '❌ Chart not ready. Please refresh the page.';
            return;
        }

        const url = `${CHART_API}?days=${days}`;
        console.log(`🌐 API URL: ${url}`);

        // Add timeout for fetch (30 seconds for "max", 10 seconds for others)
        const timeout = days === 'max' ? 30000 : 10000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error(`Rate limited! Please wait a minute before trying again.`);
                }
                throw new Error(`API returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data || !data.prices || data.prices.length === 0) {
                throw new Error('No price data received from API');
            }

            console.log(`✅ Received ${data.prices.length} price points`);

            // For very large datasets (max), sample the data to avoid performance issues
            let prices = data.prices;
            if (prices.length > 500) {
                console.log(`📊 Sampling ${prices.length} data points to 500 for performance`);
                const sampleRate = Math.ceil(prices.length / 500);
                prices = prices.filter((_, index) => index % sampleRate === 0);
            }

            // Prepare data for chart
            const labels = [];
            const chartData = [];

            prices.forEach(([timestamp, price]) => {
                const date = new Date(timestamp);
                labels.push(formatChartDate(date, days));
                chartData.push(price);
            });

            // Update chart
            priceChart.data.labels = labels;
            priceChart.data.datasets[0].data = chartData;
            priceChart.update();

            // Add funny annotation based on price movement
            addChartAnnotation(prices, days);

            console.log(`✅ Chart updated successfully for ${days} days`);
        } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
        }

    } catch (error) {
        console.error('❌ Error fetching chart data:', error);
        const errorMsg = error.message || 'Unknown error';
        document.getElementById('chartAnnotation').textContent = `❌ Failed to load chart data: ${errorMsg}. Try a different timeframe or refresh!`;
    }
}

// Format date for chart labels based on timeframe
function formatChartDate(date, days) {
    if (days === 1 || days === '1') {
        // 24h: Show hours
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 7 || days === '7') {
        // 7d: Show day name
        return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else if (days === 30 || days === '30' || days === 90 || days === '90') {
        // 30d/90d: Show month/day
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (days === 365 || days === '365' || days === 1825 || days === '1825') {
        // 1y/5y: Show month/year
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } else {
        // Other: Show year
        return date.toLocaleDateString('en-US', { year: 'numeric' });
    }
}

// Add funny annotation based on chart
function addChartAnnotation(prices, days) {
    if (prices.length === 0) return;

    const firstPrice = prices[0][1];
    const lastPrice = prices[prices.length - 1][1];
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    // Find highest and lowest prices
    const pricesOnly = prices.map(p => p[1]);
    const highestPrice = Math.max(...pricesOnly);
    const lowestPrice = Math.min(...pricesOnly);
    const volatility = ((highestPrice - lowestPrice) / lowestPrice) * 100;

    let annotation = '';
    let timeLabel = days === 1 || days === '1' ? '24 hours' :
                    days === 7 || days === '7' ? '7 days' :
                    days === 30 || days === '30' ? '30 days' :
                    days === 90 || days === '90' ? '90 days' :
                    days === 365 || days === '365' ? '1 year' : 'all time';

    // Generate funny annotations
    if (change > 50) {
        annotation = `🚀 ABSOLUTE MOON MISSION over ${timeLabel}! Up ${change.toFixed(1)}%! Everyone's a genius in a bull market! Time to screenshot this chart!`;
    } else if (change > 20) {
        annotation = `📈 Massive gains over ${timeLabel}! Up ${change.toFixed(1)}%! Your friends who said Bitcoin was dead are awfully quiet now...`;
    } else if (change > 10) {
        annotation = `💚 Solid gains over ${timeLabel}: +${change.toFixed(1)}%. This is what we call "healthy growth" (translation: we're up and coping well).`;
    } else if (change > 0) {
        annotation = `🙂 Modest gains over ${timeLabel}: +${change.toFixed(1)}%. Not lambos yet, but we'll take it! Slow and steady wins the race... right?`;
    } else if (change > -10) {
        annotation = `😬 Down ${Math.abs(change).toFixed(1)}% over ${timeLabel}. "It's just a healthy correction!" (Please be just a correction...)`;
    } else if (change > -20) {
        annotation = `📉 Ouch! Down ${Math.abs(change).toFixed(1)}% over ${timeLabel}. Remember: you only lose if you sell! (But also it hurts to watch...)`;
    } else if (change > -30) {
        annotation = `💀 Down ${Math.abs(change).toFixed(1)}% over ${timeLabel}. This is fine. Everything is fine. Diamond hands, right? RIGHT?! Someone please hold me.`;
    } else {
        annotation = `🔥 BRUTAL: Down ${Math.abs(change).toFixed(1)}% over ${timeLabel}. If you zoom out far enough, you can pretend this never happened. Bears are temporary, but trauma is forever!`;
    }

    // Add volatility comment
    if (volatility > 30) {
        annotation += ` 🎢 Volatility of ${volatility.toFixed(1)}% - what a wild ride!`;
    }

    document.getElementById('chartAnnotation').textContent = annotation;
}

// Console Easter Egg
console.log('%c🚀 Welcome to Bitcoin Central! 🚀', 'font-size: 20px; font-weight: bold; color: #f7971e;');
console.log('%cRemember: This is not financial advice!', 'font-size: 14px; color: #dc3545;');
console.log('%cHODL responsibly! 💎🙌', 'font-size: 14px; color: #28a745;');
