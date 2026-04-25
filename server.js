require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const docsRoutes = require('./routes/docs');
const repoRoutes = require('./routes/repo');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again after 15 minutes.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please try again later.' }
});

app.use('/auth', authLimiter, authRoutes);
app.use('/generate-docs', apiLimiter, docsRoutes);
app.use('/fetch-repo', apiLimiter, repoRoutes);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER || 'groq',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Smart Docs Server running on http://localhost:${PORT}`);
  console.log(`   AI Provider: ${process.env.AI_PROVIDER || 'groq'}`);
  console.log(`   GitHub Token: ${process.env.GITHUB_TOKEN ? '✅ Set' : '⚠️  Not set'}\n`);
});