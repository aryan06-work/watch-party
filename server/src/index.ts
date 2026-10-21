import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { registerSocketHandlers } from './socket.js';
import { store } from './store.js';
import { parseAndValidateVideoUrl } from './utils.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow YouTube embeds and external media
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost and specified CLIENT_URL, plus preview deployments
      if (!origin || origin === CLIENT_URL || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive in free-tier setup, protected via room tokens
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Initialize Socket.IO with WebSocket and polling transports
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
});

registerSocketHandlers(io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Check room info before joining
app.get('/api/rooms/:code', (req, res) => {
  const code = req.params.code?.toLowerCase();
  const room = store.getRoom(code);

  if (!room) {
    return res.status(404).json({
      exists: false,
      error: 'Room not found or has expired.',
    });
  }

  const isFull = room.participants.size >= room.maxParticipants;

  return res.json({
    exists: true,
    code: room.code,
    hostName: room.hostName,
    participantCount: room.participants.size,
    maxParticipants: room.maxParticipants,
    isFull,
    hasVideo: !!room.video,
    videoTitle: room.video?.title || null,
  });
});

// Video link validation endpoint
app.post('/api/rooms/validate-video', (req, res) => {
  const { url } = req.body || {};
  const validation = parseAndValidateVideoUrl(url);

  if (!validation.valid) {
    return res.status(400).json(validation);
  }

  return res.json(validation);
});

server.listen(PORT, () => {
  console.log(`[Together Server] Running on http://localhost:${PORT}`);
  console.log(`[Together Server] Accepting connections from ${CLIENT_URL}`);
});
