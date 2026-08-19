// @ts-check
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

import { satteri } from '@astrojs/markdown-satteri';

import { budouxHeadings } from './src/lib/budoux-headings.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://mi-consulting.biz',
  // 記事本文の内部リンクに末尾スラッシュの有無が混在するため、どちらでも解決させる
  trailingSlash: 'ignore',
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
