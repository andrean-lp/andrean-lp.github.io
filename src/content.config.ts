import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // Not available with legacy API

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) => z.object({
		title: z.string(),
    seoTitle: z.string().optional(),
    coverAlt: z.string().optional(),
    slug: z.string().optional(),
		description: z.string().optional(),
		// Transform string to Date object with safe fallback for empty/invalid CMS inputs
		pubDate: z.preprocess((val) => {
			if (!val || val === '' || (typeof val === 'string' && val.trim() === '')) {
				return new Date();
			}
			if (typeof val === 'string') {
				const trimmed = val.trim();
				const match = trimmed.match(/\b(\d{4}-\d{2}-\d{2})\b/);
				if (match) {
					const d = new Date(match[1]);
					if (!isNaN(d.getTime())) return d;
				}
			}
			const d = new Date(val as any);
			return isNaN(d.getTime()) ? new Date() : d;
		}, z.date()),
		updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).optional(),
		coverImage: z.union([image(), z.string()]).optional()
	})
});

export const collections = { blog };