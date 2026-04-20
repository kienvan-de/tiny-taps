import { defineMiddleware } from 'astro:middleware';
import { env as cfEnv } from 'cloudflare:workers';

function parseCookie(cookieStr: string, name: string): string | null {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = new URL(context.request.url);

  // Expose Cloudflare env to locals (Astro v6 / CF Workers)
  context.locals.env = cfEnv as App.Locals['env'];

  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isLoginPage = pathname === '/admin' || pathname === '/admin/';
  const isLoginApi = pathname === '/api/admin/login';

  if (isAdminRoute && !isLoginPage && !isLoginApi) {
    const cookie = context.request.headers.get('cookie') ?? '';
    const sessionToken = parseCookie(cookie, 'session');

    if (!sessionToken) {
      if (pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return context.redirect('/admin');
    }

    const env = context.locals.env;
    if (env?.KV) {
      const sessionData = await env.KV.get(`session:${sessionToken}`);
      if (!sessionData) {
        if (pathname.startsWith('/api/')) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return context.redirect('/admin');
      }
      try {
        context.locals.session = JSON.parse(sessionData);
      } catch {
        return context.redirect('/admin');
      }
    }
  }

  return next();
});