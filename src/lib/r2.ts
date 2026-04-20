export function getR2(env: App.Locals['env']) {
  return env.R2;
}

export function getPublicUrl(env: App.Locals['env'], key: string): string {
  const base = (env.R2_PUBLIC_BASE_URL ?? '').replace(/\/$/, '');
  return `${base}/${key}`;
}

export async function putObject(
  env: App.Locals['env'],
  key: string,
  body: ArrayBuffer | ReadableStream | Blob | string,
  contentType: string
): Promise<void> {
  await env.R2.put(key, body, {
    httpMetadata: { contentType },
  });
}

export async function headObject(
  env: App.Locals['env'],
  key: string
) {
  return env.R2.head(key);
}

export async function deleteObject(
  env: App.Locals['env'],
  key: string
): Promise<void> {
  await env.R2.delete(key);
}