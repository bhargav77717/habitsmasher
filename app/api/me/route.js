import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUser } from '@/lib/store';

export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });

  if (session.role === 'admin') {
    const { searchParams } = new URL(req.url);
    const viewingId = searchParams.get('userId');
    if (viewingId) {
      const user = await getUser(viewingId);
      if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });
      return NextResponse.json({ role: 'admin', viewing: { id: user.id, name: user.name } });
    }
    return NextResponse.json({ role: 'admin', viewing: null });
  }

  return NextResponse.json({ role: 'user', id: session.id, name: session.name });
}
