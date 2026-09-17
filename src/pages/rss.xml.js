import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { extractDescription } from '../utils';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
	);

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: extractDescription(post.body, post.data.description),
			pubDate: post.data.pubDate,
			link: `/${post.id}/`,
			categories: post.data.tags || [],
		})),
		customData: `<language>id</language>`,
	});
}
