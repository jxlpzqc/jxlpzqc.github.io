import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			colors: {
				term: {
					"bg": "var(--color-term-bg)",
					"blue": "var(--color-term-blue)",
					"green": "var(--color-term-green)",
					"normal": "var(--color-term-normal)",
				}
			},
			fontFamily: {
				"mono": [
					"'Cascadia Code'",
					"'Fira Code'",
					"'SF Mono'",
					"'JetBrains Mono'",
					"'Hack'",
					"'Ubuntu Mono'",
					"'Consolas'",
					"'Microsoft YaHei'",
					"'PingFang SC'",
					"'微软雅黑'",
					"monospace"
				],
			},
		},
	},
	plugins: [
		require('@tailwindcss/typography')
	],
}
