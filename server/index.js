require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { connectMongo } = require('./services/mongodb');
const { initializeSocket } = require('./Socket');
const { setupConnection } = require('./websocket/yjsServer');
const apiRoutes = require('./routes/api');
const { PORT, CLIENT_ORIGIN } = require('./config/env');

// --- Basic Setup ---
const app = express();
const server = http.createServer(app);

// --- Middleware ---
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

// --- API Routes ---
app.use('/api', apiRoutes);

// --- Health Check ---
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// --- Serve React build in production ---
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '..', 'build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// --- Initialize Socket.IO (presence + cursors) ---
initializeSocket(server);

// --- Yjs WebSocket Server (document collaboration) ---
// Runs on the same HTTP server, distinguished by URL path /yjs
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  // Socket.IO handles its own upgrades; only intercept /yjs paths
  if (request.url && request.url.startsWith('/yjs/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
  // Otherwise, let Socket.IO handle the upgrade
});

wss.on('connection', (ws, request) => {
  // Extract docName from URL: /yjs/<roomId>
  const docName = request.url.replace('/yjs/', '');
  if (!docName) {
    ws.close();
    return;
  }
  console.log(`[Yjs] WebSocket connected for doc "${docName}"`);
  setupConnection(ws, docName);
});

// --- Start Server ---
async function start() {
  await connectMongo();
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Yjs WebSocket available at ws://localhost:${PORT}/yjs/<roomId>`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
