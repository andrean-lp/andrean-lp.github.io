import { getCollection } from 'astro:content';

export async function GET() {
	const allPosts = await getCollection('blog');
	const tagsSet = new Set<string>();

	for (const post of allPosts) {
		for (const tag of post.data?.tags || []) {
			if (tag && typeof tag === 'string' && tag.trim().length > 0) {
				tagsSet.add(tag.trim());
			}
		}
	}

	const tags = Array.from(tagsSet).sort((a, b) => a.localeCompare(b));

	return new Response(JSON.stringify(tags), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=0, must-revalidate',
		},
	});
}
