import rawSite from './site.json';

export interface SiteData {
	title: string;
	tagline?: string;
	description?: string;
	favicon?: string;
	footer?: string;
	whatsapp?: string;
	primaryColor?: string;
	[key: string]: any;
}

export interface ColorInfo {
	r: number;
	g: number;
	b: number;
	rgb: string;
	cssRgb: string;
	hex: string;
}

export function parseColor(colorStr?: string): ColorInfo {
	if (!colorStr || typeof colorStr !== 'string') {
		return {
			r: 37,
			g: 99,
			b: 235,
			rgb: '37, 99, 235',
			cssRgb: 'rgb(37, 99, 235)',
			hex: '#2563eb',
		};
	}
	const str = colorStr.trim();
	const rgbMatch = str.match(/rgba?\(?\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
	if (rgbMatch) {
		const r = Math.min(255, Math.max(0, parseInt(rgbMatch[1], 10)));
		const g = Math.min(255, Math.max(0, parseInt(rgbMatch[2], 10)));
		const b = Math.min(255, Math.max(0, parseInt(rgbMatch[3], 10)));
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return {
			r,
			g,
			b,
			rgb: `${r}, ${g}, ${b}`,
			cssRgb: `rgb(${r}, ${g}, ${b})`,
			hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
		};
	}
	const numbersMatch = str.match(/^(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
	if (numbersMatch) {
		const r = Math.min(255, Math.max(0, parseInt(numbersMatch[1], 10)));
		const g = Math.min(255, Math.max(0, parseInt(numbersMatch[2], 10)));
		const b = Math.min(255, Math.max(0, parseInt(numbersMatch[3], 10)));
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return {
			r,
			g,
			b,
			rgb: `${r}, ${g}, ${b}`,
			cssRgb: `rgb(${r}, ${g}, ${b})`,
			hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
		};
	}
	let hex = str.replace(/^#/, '');
	if (hex.length === 3) {
		hex = hex.split('').map((c) => c + c).join('');
	}
	if (hex.length === 6) {
		const num = parseInt(hex, 16);
		if (!isNaN(num)) {
			const r = (num >> 16) & 255;
			const g = (num >> 8) & 255;
			const b = num & 255;
			const toHex = (n: number) => n.toString(16).padStart(2, '0');
			return {
				r,
				g,
				b,
				rgb: `${r}, ${g}, ${b}`,
				cssRgb: `rgb(${r}, ${g}, ${b})`,
				hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`,
			};
		}
	}
	return {
		r: 37,
		g: 99,
		b: 235,
		rgb: '37, 99, 235',
		cssRgb: 'rgb(37, 99, 235)',
		hex: '#2563eb',
	};
}

export const site: SiteData = rawSite as SiteData;
export const primaryColorInfo: ColorInfo = parseColor(site.primaryColor);
export default site;
