/**
 * public/images/ のSVGを、サイトで正しく表示できる形に整える。
 *
 * PowerPointなどから書き出したSVGには次の問題がある。書き出し側の仕様で、
 * 作図時の設定では回避できないため、ここで機械的に直す。
 *
 *   1. viewBox が無い
 *      → 記事内で縮小表示したとき、図の左上の一部しか表示されない
 *   2. font-family が作図ツールのフォント名のまま
 *      → サイト本文と別の書体になり、ヒラギノが無い環境では総崩れになる
 *   3. font-weight が 300
 *      → 本文（400）より細く見える
 *
 * npm run dev / npm run build の前に自動実行される（package.json の
 * predev / prebuild）。手で叩く必要はない。
 *
 * 冪等（何度実行しても結果は変わらない）。修正済みのファイルは触らない。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIR = 'public/images';

/** src/styles/global.css の --font-sans と同じ内容。片方を変えたら両方直すこと。 */
const FONT_STACK =
  "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP'," +
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Meiryo,sans-serif";

function listSvg(dir) {
  let out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out = out.concat(listSvg(path));
    else if (extname(name).toLowerCase() === '.svg') out.push(path);
  }
  return out;
}

function fix(path) {
  const before = readFileSync(path, 'utf8');
  let s = before;
  const changes = [];

  // 1. viewBox を補う（width / height から生成）
  const openTag = s.match(/<svg\b([^>]*)>/);
  if (openTag && !/\bviewBox=/.test(openTag[1])) {
    const w = openTag[1].match(/\bwidth="([\d.]+)"/);
    const h = openTag[1].match(/\bheight="([\d.]+)"/);
    if (w && h) {
      const attrs = openTag[1].replace(
        /\bheight="[\d.]+"/,
        `height="${h[1]}" viewBox="0 0 ${w[1]} ${h[1]}"`,
      );
      s = s.slice(0, openTag.index) + `<svg${attrs}>` + s.slice(openTag.index + openTag[0].length);
      changes.push(`viewBox="0 0 ${w[1]} ${h[1]}" を追加`);
    } else {
      changes.push('★viewBoxを追加できない（width/heightが数値でない）');
    }
  }

  // 2. font-family をサイト本文のスタックに統一
  const families = [...s.matchAll(/font-family="([^"]*)"/g)].map((m) => m[1]);
  const needFont = families.filter((f) => f !== FONT_STACK);
  if (needFont.length > 0) {
    s = s.replace(/font-family="[^"]*"/g, `font-family="${FONT_STACK}"`);
    changes.push(`font-family を ${needFont.length}件 統一`);
  }

  // 3. font-weight 300 → 400（本文と揃える）
  const weight300 = (s.match(/font-weight="300"/g) || []).length;
  if (weight300 > 0) {
    s = s.replace(/font-weight="300"/g, 'font-weight="400"');
    changes.push(`font-weight 300→400 を ${weight300}件`);
  }

  if (s !== before) writeFileSync(path, s, 'utf8');
  return changes;
}

let touched = 0;
for (const path of listSvg(DIR)) {
  const changes = fix(path);
  if (changes.length > 0) {
    touched++;
    console.log(`[fix-svg] ${path}`);
    for (const c of changes) console.log(`          ${c}`);
  }
}
if (touched === 0) console.log('[fix-svg] 修正の必要なし');
