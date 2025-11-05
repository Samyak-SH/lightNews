// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middleware/authMiddleware');

const newsRoutes = require('./routes/newsRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();


// Middleware
app.use(cors());
app.use(express.urlencoded({extended : true}))
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Connect to DB
connectDB();

app.use('/api', authRoutes);
app.use('/api', authMiddleware, newsRoutes);
app.use('/api', authMiddleware, userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
