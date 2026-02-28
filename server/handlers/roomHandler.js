const { RedisSubscriber } = require('../services/Redis');
const handleCursorEvents = require('./cursorHandler');

// In-memory presence map: roomId -> { username: { socketId, color } }
const roomPresence = {};

// Simple deterministic color picker for a username
function pickColorForName(name) {
  const palette = [
    '#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe',
    '#008080','#e6beff','#9a6324','#fffac8','#800000','#aaffc3','#808000','#ffd8b1','#000075','#808080',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

function participantsArray(roomId) {
  const room = roomPresence[roomId] || {};
  return Object.keys(room).map((username) => ({ username, color: room[username].color }));
}

function handleRoomEvents(socket, io) {
  socket.on('joinRoom', (roomId) => {
    socket.roomId = roomId;
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Register cursor handler (still uses Redis pub/sub for broadcast)
    handleCursorEvents(socket, io);

    // Subscribe to Redis cursor channel for this room
    RedisSubscriber.subscribe(`cursor-update:${roomId}`);

    // Send current participants list to this socket
    socket.emit('presence:update', { participants: participantsArray(roomId) });
  });

  socket.on('registerUsername', ({ roomId, username }) => {
    try {
      socket.username = username;

      if (!roomPresence[roomId]) {
        roomPresence[roomId] = {};
      }

      const color = pickColorForName(username);
      roomPresence[roomId][username] = { socketId: socket.id, color };

      console.log(`Socket ${socket.id} registered as ${username} in room ${roomId}`);

      // Broadcast updated participants list to everyone in the room
      io.to(roomId).emit('presence:update', { participants: participantsArray(roomId) });
    } catch (err) {
      console.error('Error registering username:', err);
    }
  });

  socket.on('disconnect', () => {
    try {
      if (socket.username && socket.roomId) {
        const roomId = socket.roomId;
        const username = socket.username;
        if (roomPresence[roomId] && roomPresence[roomId][username]) {
          delete roomPresence[roomId][username];
          console.log(`User ${username} removed from room ${roomId}`);
          io.to(roomId).emit('presence:update', { participants: participantsArray(roomId) });
        }
      }
    } catch (err) {
      console.error('Error during disconnect cleanup:', err);
    }
  });
}

module.exports = handleRoomEvents;