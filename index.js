require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');


const authRoutes = require('./routes/authRoutes');
const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');
const authMiddleware = require('./middleware/authMiddleware');


const app = express();


// Core middleware (must be BEFORE routes)
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));


// DB
connectDB();


// Public routes
app.use('/api', authRoutes); // /api/auth/register, /api/auth/login


// Protected routes
app.use('/api', authMiddleware, newsRoutes); // /api/init, /api/swipe, /api/feed, /api/categories
app.use('/api', authMiddleware, userRoutes); // /api/user/:id/preferences, /filters


// Health
app.get('/api/health', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));