import { setSession, deleteSession, getSession } from './kv';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(
  env: App.Locals['env'],
  username: string,
  password: string
): Promise<string | null> {
  if (username !== env.ADMIN_USERNAME) return null;
  const hash = await hashPassword(password);
  if (hash !== env.ADMIN_PASSWORD_HASH) return null;
  const token = crypto.randomUUID();
  await setSession(env, token, { username });
  return token;
}

export async function logout(
  env: App.Locals['env'],
  token: string
): Promise<void> {
  await deleteSession(env, token);
}

export { getSession };