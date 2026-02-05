import { Redis } from "@upstash/redis";
import { getRequiredEnv } from "@/lib/env";

// Singleton Redis client
// Prevents multiple connections in serverless environment

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      url: getRequiredEnv("UPSTASH_REDIS_REST_URL"),
      token: getRequiredEnv("UPSTASH_REDIS_REST_TOKEN"),
    });
  }
  return redisInstance;
}

// Export for direct use
export const redis = getRedis();
