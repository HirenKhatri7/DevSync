const Y = require('yjs');
const YjsDocument = require('../models/YjsDocument');

/**
 * MongoDB-backed persistence for Yjs documents.
 * Implements the persistence interface expected by y-websocket:
 *   - bindState(docName, ydoc)  — load saved state into the doc
 *   - writeState(docName, ydoc) — save current state to DB
 */
const mongoPersistence = {
  /**
   * Called when a new Yjs document is created on the server.
   * Loads the previously persisted binary state (if any) into the Y.Doc.
   */
  async bindState(docName, ydoc) {
    try {
      const existing = await YjsDocument.findOne({ docName });
      if (existing && existing.state && existing.state.length > 0) {
        const update = new Uint8Array(existing.state);
        Y.applyUpdate(ydoc, update);
        console.log(`[Yjs] Loaded persisted state for "${docName}" (${existing.state.length} bytes)`);
      } else {
        console.log(`[Yjs] No persisted state for "${docName}", starting fresh`);
      }
    } catch (err) {
      console.error(`[Yjs] Error loading state for "${docName}":`, err);
    }
  },

  /**
   * Called when all clients have disconnected from a document.
   * Persists the full Yjs state as a binary snapshot.
   */
  async writeState(docName, ydoc) {
    try {
      const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
      await YjsDocument.findOneAndUpdate(
        { docName },
        { state, updatedAt: new Date() },
        { upsert: true }
      );
      console.log(`[Yjs] Persisted state for "${docName}" (${state.length} bytes)`);
    } catch (err) {
      console.error(`[Yjs] Error persisting state for "${docName}":`, err);
    }
  },
};

module.exports = { mongoPersistence };
