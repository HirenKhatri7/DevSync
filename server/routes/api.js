const express = require('express');
const bcrypt = require('bcrypt');
const { generateUsername } = require('../utils/usernameGenerator');
const Room = require('../models/Room');

const router = express.Router();

// In-memory set per room to avoid duplicate usernames in active session
const activeUsernames = {};

router.post('/username', (req, res) => {
  const { roomId } = req.body;

  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required' });
  }

  if (!activeUsernames[roomId]) {
    activeUsernames[roomId] = new Set();
  }

  let username;
  do {
    username = generateUsername();
  } while (activeUsernames[roomId].has(username));

  activeUsernames[roomId].add(username);
  res.json({ username });
});

router.post('/rooms/create', async (req, res) => {
  const { roomId, password } = req.body;
  if (!roomId || !password) {
    return res.status(400).json({ error: 'Room ID and password are required' });
  }

  try {
    const existing = await Room.findOne({ roomId });
    if (existing) {
      return res.status(409).json({ error: 'Room ID already exists. Please choose another.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await Room.create({ roomId, passwordHash });

    res.status(201).json({ message: 'Room created successfully', roomId });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room on the server' });
  }
});

router.post('/rooms/join', async (req, res) => {
  const { roomId, password } = req.body;
  if (!roomId || !password) {
    return res.status(400).json({ error: 'Room ID and password are required' });
  }

  try {
    const room = await Room.findOne({ roomId });
    if (!room) {
      return res.status(401).json({ error: 'Invalid room ID or password' });
    }

    const match = await bcrypt.compare(password, room.passwordHash);
    if (match) {
      res.status(200).json({ message: 'Room join successful' });
    } else {
      res.status(401).json({ error: 'Invalid room ID or password' });
    }
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ error: 'Failed to join room on the server' });
  }
});

module.exports = router;
