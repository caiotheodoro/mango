import { Redis } from "@upstash/redis";

// Singleton Redis client
// Prevents multiple connections in serverless environment

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redisInstance;
}

// Export for direct use
export const redis = getRedis();
