import type { RehypePlugin } from '@astrojs/markdown-remark';
import { visit } from 'unist-util-visit';

interface Options {
	domain: string;
}

export const autoNewTabExternalLinks: RehypePlugin = (options?: Options) => {
	const siteDomain = options?.domain ?? '';

	return (tree: unknown) => {
		visit(tree, (node: any) => {
			if (node.type != 'element') {
				return;
			}

			const element = node;

			// Auto lazy-load and async decode images in markdown content
			if (element.tagName === 'img') {
				if (!element.properties) {
					element.properties = {};
				}
				if (!element.properties.loading) {
					element.properties.loading = 'lazy';
				}
				if (!element.properties.decoding) {
					element.properties.decoding = 'async';
				}
			}

			if (!isAnchor(element)) {
				return;
			}

			const url = getUrl(element);

			if (isExternal(url, siteDomain)) {
				element.properties!['target'] = '_blank';
				element.properties!['rel'] = 'noopener noreferrer';
			}
		});
	};
};

const isAnchor = (element: any) => element.tagName == 'a' && element.properties && 'href' in element.properties;

const getUrl = (element: any) => {
	if (!element.properties) {
		return '';
	}

	const url = element.properties['href'];

	if (!url) {
		return '';
	}

	return url.toString();
};

const isExternal = (url: string, domain: string) => {
	return url.startsWith('http') && !url.includes(domain);
};
