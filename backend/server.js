require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({
    message: 'Koperasi Nichias API is running!',
    status: 'OK',
  });
});

// Test koneksi database lalu jalankan server
db.sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Koneksi database berhasil!');
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Gagal koneksi ke database:', err);
  });

module.exports = app;
