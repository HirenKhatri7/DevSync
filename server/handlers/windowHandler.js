const { db } = require('../services/firebase');

function handleWindowEvents(socket, io) {
  const { roomId } = socket; // We'll attach roomId to the socket later
  

  if (!roomId) return;

  const windowsRef = db.ref(`rooms/${roomId}/windows`);

  // 1. Send initial data when a user connects

  windowsRef.once('value', (snapshot) => {
    socket.emit('windows:load', snapshot.val() || {});
  });

  // 2. Listen for real-time changes and broadcast them
  const listener = windowsRef.on('value', (snapshot) => {
    io.to(roomId).emit('windows:update', snapshot.val() || {});
  });

  // 3. Handle create, update, and delete events from the client
  socket.on('window:create', (data) => {
    const newWindowRef = windowsRef.push();
    newWindowRef.set({ ...data, id: newWindowRef.key });
  });

  socket.on('window:update', ({ windowId, content }) => {
    windowsRef.child(windowId).update(content);
  });

  socket.on('window:delete', ({ windowId }) => {
    windowsRef.child(windowId).remove();
  });

  // 4. Clean up the listener when the user disconnects
  socket.on('disconnect', () => {
    windowsRef.off('value', listener);
  });
}

module.exports = handleWindowEvents;