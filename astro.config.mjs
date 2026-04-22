import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
    },
  }),
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      // phosphor-svelte/lib/* exports only have "svelte" condition (no "import"/"default")
      // Add "svelte" to Vite's SSR resolve conditions so direct path imports work
      conditions: ['svelte', 'browser', 'import', 'module', 'default'],
    },
  },
});