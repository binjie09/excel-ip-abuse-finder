require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { processExcel } = require('./services/excelProcessor');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ip-abuse-finder')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

// Serve static files from React app (for production docker)
app.use(express.static(path.join(__dirname, '../client/dist')));

// File upload setup
const upload = multer({ dest: 'uploads/' });

app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: '请上传文件' });
    }

    try {
        const enrichedBuffer = await processExcel(req.file.path);

        res.setHeader('Content-Disposition', `attachment; filename="processed_${req.file.originalname}"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(enrichedBuffer);
    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: '文件处理失败: ' + error.message });
    }
});

// Fallback to React index.html for any other route
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
