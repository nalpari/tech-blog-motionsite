// @ts-check
import { defineConfig } from 'astro/config';
import s3Upload from './integrations/s3-upload.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [s3Upload()],
	markdown: {
		shikiConfig: { theme: 'vesper' },
	},
});
