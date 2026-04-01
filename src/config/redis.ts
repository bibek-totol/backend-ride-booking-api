import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (!client) {
    const redisUrl = process.env.REDIS_URL?.replace(/\s/g, ''); // Removes all internal spaces and newlines

    if (redisUrl) {
      console.log('📡 Attempting Redis connection via URL...');
      client = createClient({ url: redisUrl });
    } else {
      const host = (process.env.REDIS_HOST || '127.0.0.1').trim();
      const port = Number(process.env.REDIS_PORT) || 6379;
      console.log(`📡 Attempting Redis connection via Socket: ${host}:${port}`);
      client = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host,
          port,
        },
      });
    }

    client.on('error', (err: Error) => {
      console.error('❌ Redis Client Error:', err);
    });

    await client.connect();
    console.log('✅ Redis connected successfully');
  }

  return client;
}


export function getRedis(): RedisClientType {
  if (!client) {
    throw new Error('Redis not initialized! Call initRedis() first.');
  }
  return client;
}
