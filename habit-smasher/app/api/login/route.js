import { NextResponse } from 'next/server';
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/session';
import { verifyUserLogin } from '@/lib/store';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const { role, id, password } = body || {};

  if (!id || !password) {
    return NextResponse.json({ error: 'Enter both ID and password.' }, { status: 400 });
  }

  if (role === 'admin') {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: 'Server is missing ADMIN_PASSWORD env var.' }, { status: 500 });
    }
    if (id !== 'admin' || password !== adminPassword) {
      return NextResponse.json({ error: 'Wrong admin ID or password.' }, { status: 401 });
    }
    const token = await createSessionToken({ role: 'admin' });
    const res = NextResponse.json({ ok: true, role: 'admin' });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });
    return res;
  }

  const user = await verifyUserLogin(id, password);
  if (!user) {
    return NextResponse.json({ error: 'Wrong ID or password. Check with your admin.' }, { status: 401 });
  }
  const token = await createSessionToken({ role: 'user', id: user.id, name: user.name });
  const res = NextResponse.json({ ok: true, role: 'user', name: user.name });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
