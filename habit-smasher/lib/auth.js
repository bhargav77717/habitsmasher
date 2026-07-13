import { cookies } from 'next/headers';
import { verifySessionToken, SESSION_COOKIE } from './session';

export async function getSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}
