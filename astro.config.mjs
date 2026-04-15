// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';
import starlightGiscus from 'starlight-giscus';
import { starlightKatex } from 'starlight-katex';

// https://astro.build/config
export default defineConfig({
	site: 'https://ID-Brains.github.io/',
	base: '/id-db',
	vite: {
		plugins: [tailwindcss()],
		globs: ['src/**/*.js'],
		exclude: ['node_modules'],
	},
	integrations: [
		starlight({
			title: 'project-hikma',
			favicon: '/favicon.svg',
			disable404Route: true,
			customCss: ['./src/styles/global.css'],
			tableOfContents: false,
			components: {
				Head: './src/components/starlight/Head.astro',
				Header: './src/components/starlight/CustomHeader.astro',
				MobileMenuFooter: './src/components/starlight/MobileMenuFooter.astro',
				Footer: './src/components/starlight/Footer.astro',
			},
			plugins: [
				starlightKatex(),
				starlightGiscus({
					repo: 'ID-Brains/id-db',
					repoId: 'R_kgDOR9twsg',
					category: 'Q&A',
					categoryId: 'DIC_kwDOR9twss4C6rJv',
					mapping: 'pathname',
					reactionsEnabled: true,
					inputPosition: 'top',
					theme: 'preferred_color_scheme',
					lang: 'en',
					lazy: true,
				}),
			],

			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/ID-Brains/id-db' }],
			sidebar: [
				{
					label: 'Level 1',
					collapsed: true,
					autogenerate: { directory: 'level-1' },
				},
				{
					label: 'Level 2',
					collapsed: true,
					autogenerate: { directory: 'level-2' },
				},
				{
					label: 'Level 3',
					collapsed: true,
					autogenerate: { directory: 'level-3' },
				},
				{
					label: 'Level 4',
					collapsed: true,
					autogenerate: { directory: 'level-4' },
				},
			],
		}),
	],
});
