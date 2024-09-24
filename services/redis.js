import { createClient } from "redis";

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = process.env.REDIS_PORT || 6379;

const client = createClient({
    url: `rediss://${redisHost}:${redisPort}`,
    socket: {
        tls: true,
        connectTimeout: 5000
    }
});

client.on("error", (err) => console.log("Redis Client Error", err));

client.on("connect", () => console.log("Connected to Redis successfully"));

export async function scanKeys(pattern) {
    let cursor = '0';
    const keys = [];
    do {
        const reply = await redisClient.scan(cursor, {
            MATCH: pattern,
            COUNT: 100
        });
        cursor = reply.cursor;
        keys.push(...reply.keys);
    } while (cursor !== '0');
    
    return keys;
}

export default client;
