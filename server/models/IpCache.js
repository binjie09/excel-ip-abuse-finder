const mongoose = require('mongoose');

const IpCacheSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true }, // Store the full JSON response
    updatedAt: { type: Date, default: Date.now, expires: '30d' } // Optional TTL: expire after 30 days
});

module.exports = mongoose.model('IpCache', IpCacheSchema);
