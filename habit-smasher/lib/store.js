import kv from './kv';
import bcrypt from 'bcryptjs';
import { slugify, genPassword } from './habitUtils';

const USERS_INDEX_KEY = 'users:index';

export async function getUsersIndex() {
  const list = await kv.get(USERS_INDEX_KEY);
  return Array.isArray(list) ? list : [];
}

async function saveUsersIndex(list) {
  await kv.set(USERS_INDEX_KEY, list);
}

export async function getUser(id) {
  return await kv.get(`user:${id}`);
}

export async function getHabits(id) {
  const h = await kv.get(`habits:${id}`);
  return Array.isArray(h) ? h : [];
}

export async function saveHabits(id, habits) {
  await kv.set(`habits:${id}`, habits);
}

async function genUniqueId(name) {
  const base = slugify(name);
  const index = await getUsersIndex();
  let id, tries = 0;
  do {
    const suffix = Math.floor(100 + Math.random() * 900);
    id = `${base}-${suffix}`;
    tries++;
  } while (index.some((u) => u.id === id) && tries < 50);
  return id;
}

export async function createUser(name) {
  const id = await genUniqueId(name);
  const password = genPassword();
  const passwordHash = await bcrypt.hash(password, 10);
  const record = { id, name, createdAt: Date.now() };

  await kv.set(`user:${id}`, { ...record, passwordHash });
  await kv.set(`habits:${id}`, []);

  const index = await getUsersIndex();
  index.push(record);
  await saveUsersIndex(index);

  return { id, name, password }; // plaintext password returned once, for the admin to copy
}

export async function deleteUser(id) {
  const index = (await getUsersIndex()).filter((u) => u.id !== id);
  await saveUsersIndex(index);
  await kv.del(`user:${id}`);
  await kv.del(`habits:${id}`);
}

export async function verifyUserLogin(id, password) {
  const user = await getUser(id);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, name: user.name };
}
