import Redis from 'ioredis';

let client;

function getClient() {
  if (!client) {
    const url = process.env.KV_REDIS_URL || process.env.REDIS_URL;
    if (!url) {
      throw new Error('KV_REDIS_URL env var is not set (attach a Redis database in Vercel > Storage)');
    }
    client = new Redis(url);
  }
  return client;
}

// Thin wrapper that mimics the @vercel/kv get/set/del API (auto JSON
// serialize/deserialize) so the rest of the app doesn't need to change.
const kv = {
  async get(key) {
    const raw = await getClient().get(key);
    if (raw == null) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  },
  async set(key, value) {
    return getClient().set(key, JSON.stringify(value));
  },
  async del(key) {
    return getClient().del(key);
  },
};

export default kv;
