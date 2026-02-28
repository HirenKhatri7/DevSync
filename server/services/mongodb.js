const mongoose = require('mongoose');
const { MONGODB_URI } = require('../config/env');

async function connectMongo() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = { connectMongo };
