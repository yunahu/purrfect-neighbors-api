import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const client = createClient({
    url: `redis://${redisHost}:${redisPort}`
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.on("connect", () => console.log("Connected to Redis successfully"));

export default client;
