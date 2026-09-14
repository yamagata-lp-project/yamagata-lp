// @ts-check
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	integrations: [icon()],
	// The site stays statically prerendered; only routes that opt out with
	// `export const prerender = false` (e.g. src/pages/api/estimate.ts) run
	// on-demand as Vercel functions.
	adapter: vercel(),
});
