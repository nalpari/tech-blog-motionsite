// @ts-check
import { defineConfig } from 'astro/config';
import s3Upload from './integrations/s3-upload.mjs';

// https://astro.build/config
export default defineConfig({
	integrations: [s3Upload()],
	markdown: {
		// 이중 테마: 색은 --shiki-light/--shiki-dark 변수로만 내보내고 global.css 에서 data-theme 에 따라 고른다
		shikiConfig: { themes: { light: 'github-light', dark: 'vesper' }, defaultColor: false },
	},
});
