import { loadDefaultJapaneseParser } from 'budoux';

const parser = loadDefaultJapaneseParser();

/**
 * 内部で改行させない語。
 *
 * BudouXは統計モデルなので、複合語や複合助詞を誤って割ることがある。
 * 実例:「中小企業」→「中／小企業」、「として」→「と／して」、
 * 「という」→「と／いう」。ここに載せた語の内部にできた区切りは削除する。
 *
 * 順不同でよい（出現位置ごとに判定するため）。挙動を素のBudouXに
 * 戻したい場合はこの配列を空にする。
 */
export const KEEP_TOGETHER = [
  // このサイトの中核語
  '中小企業診断士',
  '中小企業',
  '金融機関',
  '信用保証協会',
  '日本政策金融公庫',
  '信用金庫',
  '資金繰り',
  '資金調達',
  '運転資金',
  '設備投資',
  '売掛金',
  '買掛金',
  '棚卸資産',
  '決算書',
  '試算表',
  '事業計画',
  '手元流動性',
  '社外CFO',
  '計画や資料',
  '経営コンサルティング事務所',
  // BudouXが割りやすい複合助詞・慣用表現
  'という',
  'といった',
  'どういう',
  'そういう',
  'こういう',
  'として',
  'として、',
  'を含めて',
  'そのもの',
  'その分',
  'もう一段',
  // 複合動詞（「身に／つけた」「積み／上がっている」のように割られる）
  '身につけ',
  '立て替え',
  // 長い形を先に置く必要はない（長さ順に並べ替えて判定するため）。
  // 「積み上がって」だけだと後ろの「いる」との間で切れる余地が残るため両方入れる。
  '積み上がっている',
  '積み上がって',
];

/**
 * 内部で改行させない形（正規表現）。語として列挙しきれないものに使う。
 * 実例:「1か／月分」のように、数字と単位の間で割れるのを防ぐ。
 */
export const KEEP_TOGETHER_PATTERNS = [/[0-9０-９]+か月分?/];

/** 文節配列 → 区切り位置（文字オフセット）の配列 */
function toBoundaries(parts) {
  const b = [];
  let pos = 0;
  for (let i = 0; i < parts.length - 1; i++) {
    pos += parts[i].length;
    b.push(pos);
  }
  return b;
}

/** 保護語の内部にあたる区切り位置を集める */
function forbiddenPositions(text) {
  const forbidden = new Set();
  for (const term of KEEP_TOGETHER) {
    let from = 0;
    for (;;) {
      const at = text.indexOf(term, from);
      if (at === -1) break;
      for (let k = at + 1; k < at + term.length; k++) forbidden.add(k);
      from = at + 1;
    }
  }
  for (const pattern of KEEP_TOGETHER_PATTERNS) {
    for (const m of text.matchAll(new RegExp(pattern.source, 'g'))) {
      for (let k = m.index + 1; k < m.index + m[0].length; k++) forbidden.add(k);
    }
  }
  return forbidden;
}

/** 文節に分割する。保護語の内部では区切らない。 */
export function segment(text) {
  const boundaries = toBoundaries(parser.parse(text));
  const forbidden = forbiddenPositions(text);
  const kept = boundaries.filter((b) => !forbidden.has(b));

  const out = [];
  let prev = 0;
  for (const b of kept) {
    out.push(text.slice(prev, b));
    prev = b;
  }
  out.push(text.slice(prev));
  return out.filter((s) => s !== '');
}

/** 長い語から順に並べた保護語。記事本文で <span class="nobr"> に包む際に使う。 */
export const KEEP_TOGETHER_BY_LENGTH = [...KEEP_TOGETHER].sort((a, b) => b.length - a.length);
