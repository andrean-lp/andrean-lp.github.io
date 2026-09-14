import rawSite from './site.json';

export interface SiteData {
	title: string;
	tagline?: string;
	description?: string;
	favicon?: string;
	[key: string]: any;
}

export const site: SiteData = rawSite as SiteData;
export default site;
