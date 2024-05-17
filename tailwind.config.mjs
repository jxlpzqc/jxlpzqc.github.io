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
		},
	},
	plugins: [
		require('@tailwindcss/typography')
	],
}
