const Redis = require('ioredis');
const { REDIS_URL } = require('../config/env');

const RedisPublisher = new Redis(REDIS_URL);
const RedisSubscriber = new Redis(REDIS_URL);

RedisPublisher.on('error', (err) => console.error('Redis Publisher Error:', err));
RedisSubscriber.on('error', (err) => console.error('Redis Subscriber Error:', err));

console.log('Redis Clients initialized');

module.exports = {
  RedisPublisher,
  RedisSubscriber,
};