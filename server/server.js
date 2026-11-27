const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const setupSignaling = require('./signaling/socketHandler');
const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve static frontend assets from public directory
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TeamUp AI Real-Time War-Room Server',
    timestamp: new Date().toISOString()
  });
});

// Setup WebRTC Multi-Peer Mesh Signaling & Room Management
setupSignaling(io);

// Explicit Room Endpoint
app.get('/room', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/room.html'));
});

// Catch-all route to serve landing page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start Server
server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 TeamUp AI - Production Server is RUNNING`);
  console.log(`📡 Local URL: http://localhost:${PORT}`);
  console.log(`👥 WebRTC Signaling: Socket.io Enabled`);
  console.log(`🤖 AI Engine: Google Gemini 3.1 Flash-Lite Ready`);
  console.log(`====================================================`);
});
