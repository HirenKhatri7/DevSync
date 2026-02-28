const { Server } = require('socket.io');
const { RedisSubscriber } = require('./services/Redis');
const handleRoomEvents = require('./handlers/roomHandler');
const { CLIENT_ORIGIN } = require('./config/env');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });

  // Central Redis listener for cursor broadcasting
  RedisSubscriber.on('message', (channel, message) => {
    try {
      if (channel.startsWith('cursor-update:')) {
        const roomId = channel.split(':')[1];
        const data = JSON.parse(message);
        io.to(roomId).except(data.senderId).emit('cursor:update', data);
      }
    } catch (err) {
      console.error('Error processing Redis message:', err);
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Room + cursor handlers (window sync is now handled by Yjs WebSocket)
    handleRoomEvents(socket, io);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initializeSocket };