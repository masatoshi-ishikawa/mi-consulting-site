import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { SITE_DESCRIPTION, TITLE_SUFFIX } from '../consts';

export async function GET(context) {
  const articles = await getCollection('articles', ({ data }) => !data.draft);

  return rss({
    title: TITLE_SUFFIX,
    description: SITE_DESCRIPTION,
    site: context.site,
    customData: '<language>ja</language>',
    items: articles
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((article) => ({
        title: article.data.title,
        description: article.data.description,
        pubDate: article.data.pubDate,
        link: `/articles/${article.id}/`,
      })),
  });
}
