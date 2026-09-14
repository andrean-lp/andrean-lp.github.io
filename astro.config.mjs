import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from "@astrojs/tailwind";
import { autoNewTabExternalLinks } from './src/autoNewTabExternalLinks';

// https://astro.build/config
export default defineConfig({
  site: 'https://andrean-lp.github.io',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    inlineStylesheets: 'always'
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/studio/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    tailwind(),
  ],
  markdown: {
    extendDefaultPlugins: true,
    rehypePlugins: [[autoNewTabExternalLinks, {
      domain: 'andrean-lp.github.io'
    }]]
  }
});