require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processExcelAsync } = require('./services/excelProcessor');
const Job = require('./models/Job');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ip-abuse-finder')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/dist')));

// File upload setup
const upload = multer({ dest: 'uploads/' });

// 1. Upload & Create Job
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }

    try {
        const job = await Job.create({
            originalFilename: req.file.originalname,
            status: 'pending'
        });

        // Start processing asynchronously
        processExcelAsync(job._id, req.file.path);

        res.json({ jobId: job._id });
    } catch (error) {
        console.error('Job creation error:', error);
        res.status(500).json({ error: '创建任务失败' });
    }
});

// 2. Poll Job Status
app.get('/api/job/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return res.status(404).json({ error: '任务不存在' });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: '查询失败' });
    }
});

// 3. Download Result
app.get('/api/download/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job || job.status !== 'completed' || !job.resultPath) {
            return res.status(404).json({ error: '文件未就绪或任务失败' });
        }

        const filename = `processed_${job.originalFilename}`;
        res.download(job.resultPath, filename);
    } catch (error) {
        res.status(500).json({ error: '下载失败' });
    }
});

// Fallback route
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
