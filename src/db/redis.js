// import { createClient } from "redis";
const createClient = require("redis").createClient;

let redisClient;

async function startRedis() {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
}

async function getRedis() {
  if (!redisClient) {
    startRedis();
  }

  if (!redisClient?.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
}

module.exports.startRedis = startRedis;
module.exports.getRedis = getRedis;
