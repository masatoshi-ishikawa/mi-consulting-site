import { segment } from './budoux-core.mjs';

/**
 * 日本語の改行位置を文節の切れ目に寄せるための処理。
 *
 * BudouX標準の translateHTMLString() はZWSP（U+200B）を挿入するが、
 * それだとコピーしたテキストに不可視文字が混入し、ページ内検索も
 * 文節をまたぐと一致しなくなる。そのため文字を増やさない <wbr> を使う。
 *
 * <wbr> は「ここで改行してよい」という指示にすぎず、それ以外の位置での
 * 改行を禁止する力はない。日本語は既定でほぼ全ての文字間で改行できるため、
 * <wbr> だけでは意味がない。CSS側の `word-break: keep-all`（.phrase）と
 * 必ずセットで使うこと。keep-allが通常の改行を止め、<wbr> の位置だけが
 * 改行可能として残ることで、文節区切りの改行が実現する。
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * 文節の切れ目に <wbr> を入れたHTML文字列を返す。set:html と併用する。
 * breakAfterDash を立てると、全角ダッシュ（——）の直後で必ず改行する。
 * 記事タイトルのように、画面幅に関わらず決まった位置で折り返したい場合に使う。
 */
export function phrase(text: string, breakAfterDash = false): string {
  const html = segment(text).map(escapeHtml).join('<wbr>');
  if (!breakAfterDash) return html;
  // ——（全角ダッシュの連続）の直後に <br> を入れる。直後の <wbr> は不要になる。
  return html.replace(/(—+)(<wbr>)?/g, '$1<br>');
}

export { segment };
