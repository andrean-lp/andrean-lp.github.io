import { loadEnv } from 'vite';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';

const { GITHUB_PERSONAL_ACCESS_TOKEN } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');

export const slugify = (input: string) => {
	if (!input) return '';

	// make lower case and trim
	var slug = input.toLowerCase().trim();

	// remove accents from charaters
	slug = slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

	// replace invalid chars with spaces
	slug = slug.replace(/[^a-z0-9\s-]/g, ' ').trim();

	// replace multiple spaces or hyphens with a single hyphen
	slug = slug.replace(/[\s-]+/g, '-');

	return slug;
};

export const unslugify = (slug: string) =>
	slug.replace(/\-/g, ' ').replace(/\w\S*/g, (text) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase());

export const kFormatter = (num: number) => {
	return Math.abs(num) > 999 ? (Math.sign(num) * (Math.abs(num) / 1000)).toFixed(1) + 'k' : Math.sign(num) * Math.abs(num);
};

export const getRepositoryDetails = async (repositoryFullname: string) => {
	const repoDetails = await fetch('https://api.github.com/repos/' + repositoryFullname, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`,
			'X-GitHub-Api-Version': '2022-11-28'
		}
	});
	const response = await repoDetails.json();
	return response;
};

export const extractDescription = (body?: string, explicitDesc?: string, maxLength = 160): string => {
	if (explicitDesc && explicitDesc.trim().length > 0) {
		return explicitDesc.trim();
	}
	if (!body) return '';
	const clean = body
		.replace(/^---[\s\S]*?---/, '') // hapus frontmatter jika ada
		.replace(/^#+.*$/gm, '') // hapus markdown heading
		.replace(/!\[.*?\]\(.*?\)/g, '') // hapus markdown image
		.replace(/\[(.*?)\]\(.*?\)/g, '$1') // ambil teks tautan saja
		.replace(/<[^>]*>/g, '') // hapus tag html
		.replace(/(\*\*|__)(.*?)\1/g, '$2') // hapus format bold
		.replace(/(\*|_)(.*?)\1/g, '$2') // hapus format italic
		.replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // hapus blok/inline code
		.replace(/\s+/g, ' ') // normalisasi spasi & newline
		.trim();

	if (clean.length <= maxLength) return clean;
	return clean.slice(0, maxLength - 3).trim() + '...';
};

let _markdownProcessorPromise: Promise<any> | null = null;

export const getMarkdownProcessor = () => {
	if (!_markdownProcessorPromise) {
		_markdownProcessorPromise = createMarkdownProcessor();
	}
	return _markdownProcessorPromise;
};

export const renderMarkdown = async (content?: string): Promise<string> => {
	if (!content) return '';
	const processor = await getMarkdownProcessor();
	const result = await processor.render(content);
	return result.code;
};

