import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '@config';

export async function GET(_context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE.title,
		description: SITE.desc,
		site: SITE.website,
		items: posts.map((post) => ({
			title: post.data.title,
			pubDate: post.data.pubDate,
			categories: post.data.tags,
			link: `/posts/${post.slug}/`,
			description: post.data.description || post.body.substring(0, 200),
			author: post.data.author || SITE.author,
		})),
	});
}
