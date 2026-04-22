/// <reference types="astro/client" />
/// <reference types="@astrojs/cloudflare" />

// Secrets not captured by wrangler types (set via wrangler secret put)
interface Env extends Cloudflare.Env {
  CF_ENV?: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  R2_PUBLIC_BASE_URL: string;
}

declare namespace App {
  interface Locals {
    env: Env;
    session?: { username: string };
    // Provided by @astrojs/cloudflare — gives access to waitUntil()
    cfContext: ExecutionContext;
  }
}