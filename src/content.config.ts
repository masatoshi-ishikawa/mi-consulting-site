import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

import { PILLARS } from './consts';

const pillarIds = PILLARS.map((p) => p.id) as [string, ...string[]];

const articles = defineCollection({
  // URLはAstroの既定どおり小文字に正規化される（K1_shikinguri-toha.md →
  // /articles/k1_shikinguri-toha/）。記事本文の相互リンクもこの形に揃えている。
  loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
  schema: z.object({
    /** 1記事＝1検索意図。検索結果に出る見出しを想定して書く。 */
    title: z.string(),
    /** メタディスクリプション兼、一覧に出る要約。 */
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    /** 6つの柱のいずれか。 */
    pillar: z.enum(pillarIds),
    /** 基礎記事にはK番号を振る（例: K01）。応用記事は空。 */
    basicId: z.string().optional(),
    /** 応用記事から親となる基礎記事のスラッグを指定し、内部リンクの親子構造をつくる。 */
    parent: z.string().optional(),
    /** trueの間はビルドに含めない。 */
    draft: z.boolean().default(false),
  }),
});

/**
 * 固定ページの本文。レイアウトのコードを触らずに文章だけ直せるよう、
 * .astro から切り出してmarkdownで管理する。
 */
const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: z.object({
    /** ページ見出し。ページ側で使わない場合は省略可。 */
    title: z.string().optional(),
    /** meta description。検索結果に出る要約。 */
    description: z.string().optional(),
    /** 冒頭に大きめに置く一文（プロフィールのリード文など）。 */
    lead: z.string().optional(),
    /** ヒーローの見出し。 */
    heading: z.string().optional(),
    /** 自己紹介で使う名前と資格。 */
    name: z.string().optional(),
    credential: z.string().optional(),
  }),
});

export const collections = { articles, pages };
