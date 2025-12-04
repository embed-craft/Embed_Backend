require('dotenv').config(); // Trigger restart
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const nudgeRoutes = require('./src/routes/nudgeRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const campaignRoutes = require('./src/routes/campaignRoutes');
const metadataRoutes = require('./src/routes/metadataRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Security headers with cross-origin allowed for images
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/v1/admin/campaigns', campaignRoutes); // Dashboard Campaign API
app.use('/v1/admin/metadata', metadataRoutes); // Dashboard Metadata API (Events & Properties)
app.use('/v1/admin/analytics', require('./src/routes/analyticsRoutes')); // Dashboard Analytics API
app.use('/v1/admin/assets', require('./src/routes/assetRoutes')); // Dashboard Assets API
app.use('/v1/admin/team', require('./src/routes/teamRoutes')); // Dashboard Team API
app.use('/', require('./src/routes/segmentRoutes')); // Segments API
app.use('/', require('./src/routes/flowRoutes')); // Flows API
app.use('/', require('./src/routes/templateRoutes')); // Templates API
app.use('/', nudgeRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nudge_db';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Nudge Backend running on port ${PORT}`);
});
