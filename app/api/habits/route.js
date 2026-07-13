import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getHabits, saveHabits, getUser } from '@/lib/store';

async function resolveTargetId(req, session) {
  if (session.role === 'user') return session.id;
  if (session.role === 'admin') {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) return null;
    const user = await getUser(userId);
    return user ? userId : null;
  }
  return null;
}

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const targetId = await resolveTargetId(req, session);
  if (!targetId) return NextResponse.json({ error: 'No user specified.' }, { status: 400 });

  const habits = await getHabits(targetId);
  return NextResponse.json({ habits });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const targetId = await resolveTargetId(req, session);
  if (!targetId) return NextResponse.json({ error: 'No user specified.' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.habits)) {
    return NextResponse.json({ error: 'habits must be an array.' }, { status: 400 });
  }

  await saveHabits(targetId, body.habits);
  return NextResponse.json({ ok: true });
}
