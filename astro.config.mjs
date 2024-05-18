import { defineConfig, passthroughImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import rehypeAutoLinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkEmoji from 'remark-emoji';


// https://astro.build/config
export default defineConfig({
  site: 'https://example.com',
  integrations: [mdx(), sitemap(), tailwind(), react()],
  image: {
    service: passthroughImageService(),
  },
  markdown: {
    remarkPlugins: [
      [remarkEmoji, { accessible: true }]
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutoLinkHeadings, { behavior: 'append' }]
    ],
  }
});