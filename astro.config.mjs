// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { satteri } from '@astrojs/markdown-satteri';

import { budouxHeadings } from './src/lib/budoux-headings.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://mi-consulting.biz',
  // 内部リンクは末尾スラッシュ付きに統一する。スラッシュなしのリンクは開発サーバーで404になり、書き間違いに気づける
  trailingSlash: 'always',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
  markdown: {
    // 記事の見出しを文節区切りで改行させる（Sätteriは既定の処理系のまま）
    processor: satteri({ hastPlugins: [budouxHeadings()] }),
    shikiConfig: {
      theme: 'github-light',
      wrap: true,
    },
  },
});
