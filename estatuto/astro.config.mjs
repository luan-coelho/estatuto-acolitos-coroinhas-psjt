import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const portal = JSON.parse(
  readFileSync(new URL('./portal.config.json', import.meta.url), 'utf8'),
);

export default defineConfig({
  site: process.env.SITE_URL,
  integrations: [
    starlight({
      title: portal.title,
      description: portal.description,
      favicon: '/favicon.svg',
      locales: { root: portal.locale },
      sidebar: [],
      pagination: false,
      pagefind: false,
      disable404Route: true,
      routeMiddleware: './src/starlight-route-data.ts',
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 2 },
      customCss: ['./src/styles/custom.css'],
      components: {
        PageTitle: './src/components/PageTitle.astro',
      },
      head: [
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#6f2635' },
        },
      ],
    }),
  ],
});
