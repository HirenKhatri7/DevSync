const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const { mongoPersistence } = require('../services/yjsPersistence');

const messageSync = 0;
const messageAwareness = 1;

// Map of docName -> { doc: Y.Doc, awareness: Awareness, conns: Map<ws, Set<number>> }
const docs = new Map();

/**
 * Get or create a Yjs document for a given room/docName.
 * Loads persisted state from MongoDB on first access.
 */
async function getYDoc(docName) {
  if (docs.has(docName)) {
    return docs.get(docName);
  }

  const doc = new Y.Doc();
  const awareness = new awarenessProtocol.Awareness(doc);

  // When any awareness change happens, broadcast to all connected clients
  awareness.on('update', ({ added, updated, removed }, conn) => {
    const changedClients = added.concat(updated, removed);
    const entry = docs.get(docName);
    if (!entry) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
    );
    const message = encoding.toUint8Array(encoder);

    entry.conns.forEach((_, ws) => {
      if (ws.readyState === 1) { // WebSocket.OPEN
        ws.send(message);
      }
    });
  });

  // When the doc updates, broadcast to all connected clients
  doc.on('update', (update, origin) => {
    const entry = docs.get(docName);
    if (!entry) return;

    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    entry.conns.forEach((_, ws) => {
      if (ws !== origin && ws.readyState === 1) {
        ws.send(message);
      }
    });
  });

  const entry = { doc, awareness, conns: new Map() };
  docs.set(docName, entry);

  // Load persisted state from MongoDB
  await mongoPersistence.bindState(docName, doc);

  return entry;
}

/**
 * Handle an incoming WebSocket message for a Yjs document.
 */
function handleMessage(ws, docName, message) {
  const entry = docs.get(docName);
  if (!entry) return;

  try {
    const decoder = decoding.createDecoder(new Uint8Array(message));
    const messageType = decoding.readVarUint(decoder);

    switch (messageType) {
      case messageSync: {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.readSyncMessage(decoder, encoder, entry.doc, ws);
        const reply = encoding.toUint8Array(encoder);
        // Only send if encoder has content beyond the message type
        if (encoding.length(encoder) > 1) {
          ws.send(reply);
        }
        break;
      }
      case messageAwareness: {
        awarenessProtocol.applyAwarenessUpdate(
          entry.awareness,
          decoding.readVarUint8Array(decoder),
          ws
        );
        break;
      }
    }
  } catch (err) {
    console.error(`[Yjs] Error handling message for "${docName}":`, err);
  }
}

/**
 * Send the initial sync step 1 + awareness states to a newly connected client.
 */
function sendInitialState(ws, docName) {
  const entry = docs.get(docName);
  if (!entry) return;

  // Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, entry.doc);
  ws.send(encoding.toUint8Array(encoder));

  // Send current awareness states
  const awarenessStates = entry.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(
        entry.awareness,
        Array.from(awarenessStates.keys())
      )
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }
}

/**
 * Register a WebSocket connection for a Yjs doc.
 */
async function setupConnection(ws, docName) {
  const entry = await getYDoc(docName);
  entry.conns.set(ws, new Set());

  // Send initial state to the new client
  sendInitialState(ws, docName);

  ws.on('message', (data) => {
    handleMessage(ws, docName, data);
  });

  ws.on('close', async () => {
    // Remove awareness states for this connection
    const controlledIds = entry.conns.get(ws);
    entry.conns.delete(ws);

    if (controlledIds) {
      awarenessProtocol.removeAwarenessStates(
        entry.awareness,
        Array.from(controlledIds),
        null
      );
    }

    // If no more connections, persist and clean up
    if (entry.conns.size === 0) {
      await mongoPersistence.writeState(docName, entry.doc);
      entry.doc.destroy();
      docs.delete(docName);
      console.log(`[Yjs] Document "${docName}" unloaded (no connections)`);
    }
  });
}

module.exports = { setupConnection, getYDoc, docs };
