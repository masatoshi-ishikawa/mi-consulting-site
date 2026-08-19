import { segment, KEEP_TOGETHER_BY_LENGTH } from './budoux-core.mjs';

/**
 * markdownを整えるSätteri hastプラグイン。
 *
 * 1. 見出し（h1〜h4）: 文節区切り <wbr> を入れる（全markdown）
 * 2. 固定ページの段落: 文節区切り＋原稿の改行を <br> にする
 * 3. 記事本文: 保護語だけを <span class="nobr"> で包む
 * 4. 表: 横スクロール可能なdivで包む
 *
 * 3が2と違うのは意図的。記事本文まで文節優先で改行すると右端が大きく波打ち、
 * 長文ではかえって読みにくくなる。一方で「という」「として」のような語が
 * 途中で割れるのは避けたいので、そこだけピンポイントで止める。
 */
const HEADINGS = ['h1', 'h2', 'h3', 'h4'];
const BODY_TAGS = ['p', 'li', 'td', 'th', 'blockquote'];
const PAGES_DIR = '/content/pages/';
const SCROLL_CLASS = 'table-scroll';
/** 中に立ち入らない要素（等幅表示や既に処理済みのもの） */
const OPAQUE = new Set(['code', 'pre', 'kbd', 'samp', 'wbr', 'br']);

const el = (tagName, children = [], properties = {}) => ({
  type: 'element',
  tagName,
  properties,
  children,
});

const isPageFile = (ctx) => !!ctx.fileURL && ctx.fileURL.pathname.includes(PAGES_DIR);

/* ------------------------------------------------------------------ *
 * 文節区切り（見出し・固定ページ）
 * ------------------------------------------------------------------ */

/** 要素配下のテキストを、太字やリンクをまたいで1本につなげる */
function collectText(node, acc = []) {
  for (const c of node.children ?? []) {
    if (c.type === 'text') acc.push(c.value);
    else if (c.type === 'element' && !OPAQUE.has(c.tagName)) collectText(c, acc);
  }
  return acc;
}

/**
 * 改行位置（文字オフセット）を求める。
 * 太字などで分断されていても、つながった1文として解析するのが要点。
 * これをしないと <strong> の前後で文節が切れず、そこだけ改行できない塊になる。
 */
function boundariesOf(full, hardBreaks) {
  const wbr = new Set();
  const br = new Set();
  let base = 0;
  const lines = hardBreaks ? full.split('\n') : [full];
  for (const [i, line] of lines.entries()) {
    if (i > 0) br.add(base - 1); // 直前の改行文字の位置
    let pos = base;
    for (const part of segment(line).slice(0, -1)) {
      pos += part.length;
      wbr.add(pos);
    }
    base += line.length + 1; // +1 は改行文字ぶん
  }
  return { wbr, br };
}

/** boundaries に従って木を組み直す。state.offset で全体位置を追う。 */
function rebuild(node, marks, state, hardBreaks) {
  const children = [];
  for (const c of node.children ?? []) {
    if (c.type === 'text') {
      let buf = '';
      for (const ch of c.value) {
        const at = state.offset;
        if (hardBreaks && marks.br.has(at)) {
          if (buf) children.push({ type: 'text', value: buf });
          buf = '';
          children.push(el('br'));
          state.offset += 1;
          continue; // 改行文字自体は出力しない
        }
        if (marks.wbr.has(at) && state.lastWbrAt !== at) {
          if (buf) children.push({ type: 'text', value: buf });
          buf = '';
          children.push(el('wbr'));
          state.lastWbrAt = at;
        }
        buf += ch;
        state.offset += 1;
      }
      if (buf) children.push({ type: 'text', value: buf });
    } else if (c.type === 'element' && !OPAQUE.has(c.tagName)) {
      // 要素の境目にちょうど区切りが来る場合は、要素の手前に入れる
      // （中の先頭でも同じ位置を検出するため、二重挿入を防ぐ）
      if (marks.wbr.has(state.offset) && state.lastWbrAt !== state.offset) {
        children.push(el('wbr'));
        state.lastWbrAt = state.offset;
      }
      children.push(rebuild(c, marks, state, hardBreaks));
    } else {
      children.push(c);
    }
  }
  return { ...node, children };
}

function addClass(properties, name) {
  const cls = properties?.className;
  const className = Array.isArray(cls) ? [...cls, name] : cls ? [cls, name] : [name];
  return { ...properties, className };
}

/* ------------------------------------------------------------------ *
 * 保護語だけを折り返し禁止にする（記事本文）
 * ------------------------------------------------------------------ */

/** 常に配列を返す内部処理。変更があったかは state に記録する。 */
function wrapWalk(children, state) {
  return children.flatMap((child) => {
    // 太字やリンクの中にも保護語は現れるので、中まで降りる
    if (child.type === 'element') {
      if (OPAQUE.has(child.tagName)) return [child];
      const cls = child.properties?.className;
      const done = Array.isArray(cls) ? cls.includes('nobr') : cls === 'nobr';
      if (done) return [child];
      return [{ ...child, children: wrapWalk(child.children ?? [], state) }];
    }
    if (child.type !== 'text' || !child.value.trim()) return [child];

    const pieces = [];
    let rest = child.value;
    outer: while (rest.length > 0) {
      for (let i = 0; i < rest.length; i++) {
        for (const term of KEEP_TOGETHER_BY_LENGTH) {
          if (rest.startsWith(term, i)) {
            if (i > 0) pieces.push({ type: 'text', value: rest.slice(0, i) });
            pieces.push(el('span', [{ type: 'text', value: term }], { className: ['nobr'] }));
            rest = rest.slice(i + term.length);
            state.changed = true;
            continue outer;
          }
        }
      }
      pieces.push({ type: 'text', value: rest });
      break;
    }
    return pieces;
  });
}

/** 変更がなければ null を返す（ノードを差し替えないため）。 */
function wrapProtectedTerms(children) {
  const state = { changed: false };
  const out = wrapWalk(children, state);
  return state.changed ? out : null;
}

/* ------------------------------------------------------------------ */

export function budouxHeadings() {
  return {
    name: 'budoux-phrases',
    element: [
      {
        filter: [...HEADINGS, ...BODY_TAGS],
        visit(node, ctx) {
          // 差し替えたノードは再度visitされるため、処理済みなら何もしない。
          // これを怠ると要素の境目に <wbr> が重複して入る。
          const cls = node.properties?.className;
          const done = Array.isArray(cls) ? cls.includes('phrase') : cls === 'phrase';
          if (done) return;

          const isHeading = HEADINGS.includes(node.tagName);
          const isPage = isPageFile(ctx);

          // 記事本文（固定ページ以外の段落など）は保護語だけ止める
          if (!isHeading && !isPage) {
            const children = wrapProtectedTerms(node.children ?? []);
            return children ? { ...node, children } : undefined;
          }

          const hardBreaks = !isHeading && isPage;
          const full = collectText(node).join('');
          if (!full.trim()) return;

          const marks = boundariesOf(full, hardBreaks);
          if (marks.wbr.size === 0 && marks.br.size === 0) return;

          const rebuilt = rebuild(node, marks, { offset: 0, lastWbrAt: -1 }, hardBreaks);
          return { ...rebuilt, properties: addClass(node.properties, 'phrase') };
        },
      },
      {
        filter: ['table'],
        visit(node, ctx) {
          const parent = ctx.parent(node);
          const cls = parent?.properties?.className;
          if (Array.isArray(cls) ? cls.includes(SCROLL_CLASS) : cls === SCROLL_CLASS) return;
          return el('div', [node], { className: [SCROLL_CLASS] });
        },
      },
    ],
  };
}
