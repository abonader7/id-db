// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://ID-Brains.github.io',
	base: '/id-db',
	vite: {
		plugins: [tailwindcss()],
		globs: ['src/**/*.js'],
		exclude: ['node_modules'],
	},
	integrations: [
		starlight({
			title: 'College Knowledge Base',
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

			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
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
