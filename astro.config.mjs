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
  i18n: {
    defaultLocale: 'id',
    locales: ['id', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false
    }
  },
  build: {
    inlineStylesheets: 'auto'
  },
  image: {
    domains: ['res.cloudinary.com']
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/studio/') && !page.endsWith('/side-projects/') && !page.endsWith('/testimoni/'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    tailwind({
      applyBaseStyles: false
    }),
  ],
  markdown: {
    extendDefaultPlugins: true,
    rehypePlugins: [[autoNewTabExternalLinks, {
      domain: 'andrean-lp.github.io'
    }]]
  }
});