import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const KEY = 'cl_predictions';

export async function getAllPredictions() {
  const data = await redis.get(KEY);
  return data || [];
}

export async function savePrediction(name, picks) {
  const data = await getAllPredictions();
  const idx = data.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
  const entry = { name, picks, created_at: new Date().toISOString() };

  if (idx >= 0) {
    data[idx] = entry;
  } else {
    data.push(entry);
  }
  await redis.set(KEY, data);
}

export async function deletePrediction(name) {
  const data = (await getAllPredictions()).filter(p => p.name.toLowerCase() !== name.toLowerCase());
  await redis.set(KEY, data);
}
