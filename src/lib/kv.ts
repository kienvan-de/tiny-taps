const SESSION_TTL = 60 * 60 * 24; // 24 hours in seconds

export async function setSession(
  env: App.Locals['env'],
  token: string,
  data: object
): Promise<void> {
  await env.KV.put(`session:${token}`, JSON.stringify(data), {
    expirationTtl: SESSION_TTL,
  });
}

export async function getSession(
  env: App.Locals['env'],
  token: string
): Promise<{ username: string } | null> {
  const val = await env.KV.get(`session:${token}`);
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

export async function deleteSession(
  env: App.Locals['env'],
  token: string
): Promise<void> {
  await env.KV.delete(`session:${token}`);
}