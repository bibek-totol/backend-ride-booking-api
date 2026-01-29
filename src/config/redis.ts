import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (!client) {
    const redisUrl = process.env.REDIS_URL;

    if (redisUrl) {
      client = createClient({ url: redisUrl });
    } else {
      client = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: (process.env.REDIS_HOST || '127.0.0.1').trim(),
          port: Number(process.env.REDIS_PORT) || 6379,
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
