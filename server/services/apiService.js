const axios = require('axios');
const IpCache = require('../models/IpCache');

const API_KEY = process.env.IP2LOCATION_KEY;

async function getIpInfo(ip) {
    // Check cache first
    const cached = await IpCache.findOne({ ip });
    if (cached) {
        console.log(`Cache hit for ${ip}`);
        return cached.data;
    }

    // Fetch from API
    console.log(`Fetching ${ip} from ip2location.io...`);
    try {
        const url = `https://api.ip2location.io/?key=${API_KEY}&ip=${ip}`;
        const response = await axios.get(url);
        const data = response.data;

        // Save to cache
        await IpCache.create({ ip, data });
        return data;
    } catch (error) {
        console.error(`Error fetching IP ${ip}:`, error.message);
        return { error: 'Failed to fetch' };
    }
}

module.exports = { getIpInfo };
