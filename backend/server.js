const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initDatabase } = require('./config/db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Routes
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/coops', require('./routes/coops'));
app.use('/api/eggs', require('./routes/eggs'));
app.use('/api/feed', require('./routes/feed'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', require('./routes/settings'));

// Root Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Sistem Analisis & Pengelolaan Kandang Bebek API',
    database: 'MySQL',
    timestamp: new Date().toISOString()
  });
});

// Initialize database & start server
async function startServer() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Kandang Bebek API berjalan di:`);
    console.log(`   - Local   : http://localhost:${PORT}`);
  });
}

// Jalankan server lokal (bukan Vercel)
if (require.main === module) {
  startServer();
}

// Export app untuk Vercel serverless
module.exports = app;
