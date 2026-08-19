// サイト全体で使う定数。表記はCLAUDE.mdの「表記ルール」に従う。

export const SITE_URL = 'https://mi-consulting.biz';

/** 主看板は個人名 */
export const NAME = '石川雅敏';

/** タグライン */
export const TAGLINE = '金融機関の内側を知る社外CFO';

/** 資格表記（従の位置） */
export const CREDENTIAL = '中小企業診断士';

/** 屋号（ヘッダーは小さく、フッターに正式名称） */
export const OFFICE_NAME = '石川雅敏経営コンサルティング事務所';

/** 問い合わせ先メールアドレス */
export const EMAIL = 'masatoshi.ishikawa@mi-consulting.biz';

/** titleタグ用の共通サフィックス。指名検索の受け皿として名前を含める。 */
export const TITLE_SUFFIX = `${NAME}｜${TAGLINE}`;

export const SITE_DESCRIPTION =
  '金融機関の内側を知る社外CFO。年商3〜10億円の成長企業に対し、財務・資金調達の設計を支援します。';

/** グローバルナビゲーション */
export const NAV_ITEMS = [
  { href: '/', label: 'トップ' },
  { href: '/profile/', label: 'プロフィール' },
  { href: '/service/', label: 'サービス' },
  { href: '/articles/', label: '記事' },
] as const;

/**
 * 記事の6つの柱。記事は将来の書籍の章立てを兼ねる設計のため、
 * ここの順序と番号がそのまま章立てになる。
 */
export const PILLARS = [
  {
    id: 'how-banks-see-you',
    order: 1,
    title: '金融機関は御社をこう見ている',
    summary: '決算書のどこを見て、何を根拠に格付けが決まるのか。審査する側の視点から。',
  },
  {
    id: 'funding-design',
    order: 2,
    title: '成長企業の資金調達設計',
    summary: '売上の伸びに資金繰りが追いつかない局面で、どう借入を組み立てるか。',
  },
  {
    id: 'investment-and-subsidy',
    order: 3,
    title: '投資と補助金のファイナンス',
    summary: '設備投資の資金をどう調達するか。補助金と借入をどう組み合わせるか。',
  },
  {
    id: 'cashflow-system',
    order: 4,
    title: '資金繰りの仕組み化',
    summary: '資金繰り表を回し、先を読める状態をつくる。属人化させないための型。',
  },
  {
    id: 'when-cash-runs-short',
    order: 5,
    title: '資金繰りが苦しくなったら',
    summary: 'リスケジュール、条件変更、金融機関との交渉。追い込まれる前に打てる手。',
  },
  {
    id: 'public-finance',
    order: 6,
    title: '公的金融の使い方',
    summary: '日本政策金融公庫、信用保証協会。制度を知っている企業だけが使える枠がある。',
  },
] as const;

export type PillarId = (typeof PILLARS)[number]['id'];

export const PILLAR_MAP = Object.fromEntries(
  PILLARS.map((p) => [p.id, p]),
) as Record<PillarId, (typeof PILLARS)[number]>;
