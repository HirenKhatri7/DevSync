const { RedisPublisher } = require('../services/Redis');

function handleCursorEvents(socket, io) {
  socket.on('cursor:move', (data) => {
    try {
      const roomId = data.roomId;
      const username = socket.username || data.userId || socket.id;

      const payload = {
        userId: username,
        windowId: data.windowId,
        x: data.x,
        y: data.y,
        senderId: socket.id,
        roomId,
      };

      RedisPublisher.publish(`cursor-update:${roomId}`, JSON.stringify(payload));
    } catch (err) {
      console.error('Error handling cursor move:', err);
    }
  });
}

module.exports = handleCursorEvents;