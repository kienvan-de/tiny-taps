import type { APIContext } from 'astro';
import { logout } from '../../../lib/auth';

export const prerender = false;

export async function POST(context: APIContext) {
  const env = context.locals.env;
  const cookie = context.request.headers.get('cookie') ?? '';
  const match = cookie.match(/(?:^|;\s*)session=([^;]*)/);
  const token = match ? decodeURIComponent(match[1]) : null;

  if (token && env?.KV) {
    await logout(env, token);
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/admin',
      'Set-Cookie': 'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0',
    },
  });
}