import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string().default("<Untitled>"),
		description: z.string().optional(),
		// Transform string to Date object
		pubDate: z.coerce.date().default(new Date("1970-01-01")),
		tags: z.array(z.string()).optional(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
	}),
});

export const collections = { blog };
