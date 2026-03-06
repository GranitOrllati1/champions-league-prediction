import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const RESULTS_KEY = 'cl_results';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'champions2026';

export async function GET() {
  const results = await redis.get(RESULTS_KEY);
  return NextResponse.json(results || {});
}

export async function POST(request) {
  const { password, results } = await request.json();

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  await redis.set(RESULTS_KEY, results);
  return NextResponse.json({ success: true });
}
