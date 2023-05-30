import redis from "redis";

const ROOM_DISTANCES_PREFIX = "rooms";
const SPO_PREFIX = "spo";

const JSON_DATA_SUFFIX = "jsondata"

export const ROOM_DISTANCES_KEY = `${ROOM_DISTANCES_PREFIX}:${JSON_DATA_SUFFIX}`;
export const SPO_KEY = `${SPO_PREFIX}:${JSON_DATA_SUFFIX}`


const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT)
});

await redisClient.connect();

export async function getDocument(key) {
    return await redisClient.json.get(key);
}

export async function setDocument(key, document) {
    return await redisClient.json.set(key, '$', document);
}

