/// <reference types="astro/client" />

// Secrets not captured by wrangler types (set via wrangler secret put)
interface Env extends Cloudflare.Env {
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD_HASH: string;
  R2_PUBLIC_BASE_URL: string;
}

declare namespace App {
  interface Locals {
    env: Env;
    session?: { username: string };
  }
}