import type { APIContext } from 'astro';
import { login } from '../../../lib/auth';


export async function POST(context: APIContext) {
  const env = context.locals.env;

  let body: { username: string; password: string };
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.username || !body.password) {
    return new Response(JSON.stringify({ error: 'username and password required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = await login(env, body.username, body.password);

  if (!token) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`,
    },
  });
}