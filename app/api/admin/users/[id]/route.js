import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteUser } from '@/lib/store';

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 401 });
  }
  await deleteUser(params.id);
  return NextResponse.json({ ok: true });
}
