const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    progress: { type: Number, default: 0 },
    resultPath: { type: String },
    error: { type: String },
    originalFilename: { type: String },
    createdAt: { type: Date, default: Date.now } // TTL could be added here to auto-cleanup old jobs
});

module.exports = mongoose.model('Job', JobSchema);
