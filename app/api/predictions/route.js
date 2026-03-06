import { NextResponse } from 'next/server';
import { getAllPredictions, savePrediction, deletePrediction } from '../../../lib/db';

export async function GET() {
  const predictions = await getAllPredictions();
  return NextResponse.json(predictions);
}

export async function POST(request) {
  const { name, picks } = await request.json();

  if (!name || !picks) {
    return NextResponse.json({ error: 'Name and picks are required' }, { status: 400 });
  }

  await savePrediction(name.trim(), picks);
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const { name } = await request.json();
  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  await deletePrediction(name);
  return NextResponse.json({ success: true });
}
