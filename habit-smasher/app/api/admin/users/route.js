import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUsersIndex, getHabits, createUser } from '@/lib/store';
import { computeStreak, dateKey, todayDate } from '@/lib/habitUtils';

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  try {
    const index = await getUsersIndex();
    const today = dateKey(todayDate());

    const users = await Promise.all(
      index.map(async (u) => {
        const habits = await getHabits(u.id);
        const doneToday = habits.filter((h) => h.completions[today]).length;
        const bestStreak = habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0);
        return {
          id: u.id,
          name: u.name,
          createdAt: u.createdAt,
          total: habits.length,
          doneToday,
          bestStreak,
        };
      })
    );

    return NextResponse.json({ users });
  } catch (e) {
    console.error('GET /api/admin/users failed:', e);
    return NextResponse.json(
      { error: 'Could not load users. Is Vercel KV connected? ' + (e?.message || '') },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = (body.name || '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required.' }, { status: 400 });

  const created = await createUser(name);
  return NextResponse.json({ user: created });
}
