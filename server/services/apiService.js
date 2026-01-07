const axios = require('axios');
const IpCache = require('../models/IpCache');

const API_KEY = process.env.IPAPI_KEY;

async function getIpInfo(ip) {
    // Check cache first
    const cached = await IpCache.findOne({ ip });
    if (cached) {
        console.log(`Cache hit for ${ip}`);
        return cached.data;
    }

    // Fetch from API
    console.log(`Fetching ${ip} from ipapi.is...`);
    try {
        const url = `https://api.ipapi.is?q=${ip}&key=${API_KEY}`;
        const response = await axios.get(url);
        const data = response.data;

        // Save to cache
        await IpCache.create({ ip, data });
        return data;
    } catch (error) {
        console.error(`Error fetching IP ${ip}:`, error.message);
        // Return partial error object or null, to not break the whole excel process
        return { error: 'Failed to fetch' };
    }
}

module.exports = { getIpInfo };
