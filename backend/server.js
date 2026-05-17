require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const peraturanRoutes = require('./routes/peraturanRoutes');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads folder
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection logic
io.on('connection', (socket) => {
  console.log('⚡ Client connected to Socket.io:', socket.id);
  
  socket.on('disconnect', (reason) => {
    console.log(`🔥 Client disconnected (${socket.id}). Reason: ${reason}`);
  });

  socket.on('error', (error) => {
    console.error(`❌ Socket error (${socket.id}):`, error);
  });
});

// Pass io to request object for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

const dashboardRoutes = require('./routes/dashboardRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/peraturan', peraturanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/simpan-pinjam', require('./routes/simpanPinjamRoutes'));
app.use('/api/keuangan', require('./routes/keuanganRoutes'));

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
    // Sinkronisasi tabel (Membuat tabel jika belum ada)
    return db.sequelize.sync();
  })
  .then(() => {
    console.log('✅ Sinkronisasi tabel berhasil!');
    server.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Terjadi kesalahan pada database/server:', err);
  });

module.exports = app;
