# 運用ガイド（技術）

mi-consulting.biz の技術的な取扱説明書。記事の追加、仕組みの説明、触ってはいけない箇所をまとめる。

文章の方針・トーン・戦略はこのファイルには書かない（`CLAUDE.md` と別管理のNotionを参照）。

---

## 1. 前提

| | |
|---|---|
| 公開URL | https://mi-consulting.biz （wwwなし。www付きは自動転送） |
| ホスティング | GitHub Pages（GitHub Actions経由でビルド成果物を配信） |
| リポジトリ | github.com/masatoshi-ishikawa/mi-consulting-site（**Public**） |
| フレームワーク | Astro 7 |
| Node.js | 22.12.0 以上（`package.json` の engines に記載） |
| DNS管理 | Squarespace（ネームサーバーは移していない） |

### 更新から公開までの流れ

```
ファイルを編集 → git push origin main
    ↓（自動）
.github/workflows/deploy.yml が起動
    ↓
npm ci → npm run build → dist/ を GitHub Pages へ配信
    ↓
1〜2分で https://mi-consulting.biz に反映
```

手作業のデプロイ操作は不要。`main` へのpushだけで公開される。

---

## 2. ディレクトリ構成

```
src/
  content/               ← 文章はすべてここ。編集の起点
    articles/            記事（.md）
    pages/               固定ページの本文（.md）
  pages/                 ルーティング。ファイル名がURLになる
    index.astro          /            トップ
    profile.astro        /profile/    プロフィール
    service.astro        /service/    サービス案内
    articles/index.astro /articles/   記事一覧
    articles/[...slug].astro          記事詳細（自動生成）
    rss.xml.js           /rss.xml
  layouts/
    Base.astro           全ページ共通の外枠
    Article.astro        記事詳細の枠
  components/
    BaseHead.astro       <head>。metaタグ・OGP・Search Console認証タグ
    Header.astro / Footer.astro
    Phrase.astro         文節改行を適用するための部品
    FormattedDate.astro  日付表示
  lib/
    budoux-core.mjs      文節分割と保護語リスト
    budoux-headings.mjs  markdownを加工するプラグイン
    budoux.ts            .astro から使うヘルパー
  styles/global.css      サイト全体のCSS。色・フォント・寸法の定義元
  consts.ts              屋号・タグライン・メールアドレス・記事の6分類
  content.config.ts      frontmatterのスキーマ定義

public/                  ここに置いたファイルはそのままURLになる
  images/                写真・図版
  CNAME                  独自ドメイン指定（消さないこと）
  robots.txt

.github/workflows/deploy.yml   自動ビルド・公開の設定
```

**文章だけを直したいときに開くファイルは、`src/content/` 配下の5つだけ。**

| ファイル | 対応箇所 |
|---|---|
| `src/content/pages/hero.md` | トップの大見出しとリード文 |
| `src/content/pages/intro.md` | トップの自己紹介 |
| `src/content/pages/profile.md` | プロフィールページ |
| `src/content/articles/*.md` | 記事 |

サービス案内（`src/pages/service.astro`）だけは、まだ本文が `.astro` の中にある。

---

## 3. 記事を追加する手順

### 3-1. ファイルを作る

`src/content/articles/` に `.md` ファイルを新規作成する。

**ファイル名がそのままURLになる（小文字化される）。**

```
K3_kuroji-tousan.md  →  https://mi-consulting.biz/articles/k3_kuroji-tousan/
```

英数字とハイフン・アンダースコアで構成すること。日本語ファイル名は使わない。

### 3-2. frontmatterを書く

ファイル冒頭に `---` で囲んだ設定を置く。既存記事をコピーして書き換えるのが早い。

```markdown
---
title: "黒字倒産はなぜ起きるか"
description: "利益が出ているのに現金が尽きる。この状態がなぜ起きるのかを、金融機関で融資に携わった立場から説明します。"
pubDate: 2026-09-01
pillar: cashflow-system
basicId: K03
draft: false
---

本文をここから書く。
```

### 3-3. 確認する

```bash
npm run dev
```

`http://localhost:4321/articles/` に一覧が出る。表示を確認する。

### 3-4. 公開する

```bash
git add -A
git commit -m "記事: 黒字倒産はなぜ起きるか"
git push origin main
```

1〜2分後に本番へ反映される。サイトマップとRSSは自動更新されるので追加作業は不要。

---

## 4. frontmatterのスキーマ

定義元は `src/content.config.ts`。**スキーマに合わない値を書くとビルドが止まる**（誤字がそのまま公開される事故を防ぐため）。

### 4-1. 記事（`src/content/articles/*.md`）

| 項目 | 必須 | 型 | 説明 |
|---|---|---|---|
| `title` | ✓ | 文字列 | 記事タイトル。titleタグと一覧に使われる |
| `description` | ✓ | 文字列 | meta descriptionと一覧の要約を兼ねる |
| `pubDate` | ✓ | 日付 | `2026-09-01` の形式 |
| `updatedDate` | | 日付 | 更新日。書くと記事上部に「更新 ○月○日」が出る |
| `pillar` | ✓ | 下記から1つ | 記事の分類 |
| `basicId` | | 文字列 | 基礎記事に振る番号（`K01` など）。一覧で先頭に並ぶ |
| `parent` | | 文字列 | 親記事のファイル名（拡張子なし・小文字）。相互リンクが自動生成される |
| `draft` | | 真偽値 | `true` で非公開。既定は `false`（＝公開される）。下記の注意を読むこと |

**`pillar` に指定できる値（この6つ以外はエラー）**

| 値 | 分類名 |
|---|---|
| `how-banks-see-you` | 金融機関は御社をこう見ている |
| `funding-design` | 成長企業の資金調達設計 |
| `investment-and-subsidy` | 投資と補助金のファイナンス |
| `cashflow-system` | 資金繰りの仕組み化 |
| `when-cash-runs-short` | 資金繰りが苦しくなったら |
| `public-finance` | 公的金融の使い方 |

分類名の定義は `src/consts.ts` の `PILLARS`。**現在この分類はサイト上に表示していない**（記事数が少ないため）。データとしては保持しており、記事が増えたら一覧をこの分類で束ねられる。

`parent` を指定すると、子記事には「この記事の前提となる基礎記事」、親記事には「この基礎記事から派生する記事」のリンクが**両方向に自動生成される**。

#### `draft` の注意（検証済み）

`draft` は「下書きフラグ」であって公開フラグではない。**`true` で隠れる。**

```
draft: true   下書きである  → 出さない
draft: false  下書きではない → 出す（省略時もこちら）
```

**`draft: true` にすると、開発サーバーでも表示されない。** 実測で確認済み。

| | `draft: true` の記事 |
|---|---|
| ビルド結果 | ページが生成されない |
| 記事一覧・トップの最近の記事・RSS | 出ない |
| `npm run dev`（開発サーバー） | **404** |

したがって**仕上がりの確認に `draft: true` は使えない**。改行位置などを見たい場合は `draft: false` のままローカルで確認すること。**push しない限り公開されない**ので、それで「未公開のまま確認する」目的は達成できる。

`draft: true` が要るのは、書きかけを push したいが公開はしたくない場合のみ。

絞り込みは以下の4箇所で行っている。挙動を変えるならこの4つを揃えて直す（例：`import.meta.env.PROD ? !data.draft : true` にすると、ローカルでは下書きも表示され、本番では隠れる）。

```
src/pages/index.astro
src/pages/articles/index.astro
src/pages/articles/[...slug].astro
src/pages/rss.xml.js
```

### 4-2. 固定ページ（`src/content/pages/*.md`）

ファイルごとに使う項目が異なる。

| ファイル | 使う項目 | 本文の扱い |
|---|---|---|
| `hero.md` | `heading` | トップのリード文 |
| `intro.md` | `name` / `credential` | トップの自己紹介の本文 |
| `profile.md` | `title` / `description` / `lead` | プロフィール本文 |

`lead` は冒頭に大きめの書体で表示される一文。

---

## 5. 画像の扱い

### 5-1. 置き場所と参照

`public/images/` に置き、`/images/ファイル名` で参照する。ビルド時にそのままコピーされ、パスは変わらない。

```markdown
![運転資金の増加と入出金のタイミング](/images/k1-temotoshikin.svg)
```

`alt`（角括弧の中）は必ず書く。読み上げと検索で使われる。

### 5-2. SVG図版を作るときの必須事項

**① `viewBox` 属性を必ず付ける**

```xml
<svg width="3905" height="2274" viewBox="0 0 3905 2274" ...>
```

これが無いと、記事内で縮小表示したときに**図の左上の一部しか表示されない**。PowerPointから書き出すと付かないことがあるので、毎回確認する。

**② フォントをサイト本文と揃える**

`<svg>` 直下に以下を入れる。作図ツールが個別に `font-family` を書いている場合は、それらをすべてこの値に置換する。

```xml
<style>
  text {
    font-family: 'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',
      -apple-system,BlinkMacSystemFont,'Segoe UI',Meiryo,sans-serif;
    fill: #1c1f26;
  }
</style>
```

XML属性の中なのでフォント名は**シングルクォート**で囲む。ウェイトは本文と揃えて `font-weight="400"`。

**③ 作図時のフォントはヒラギノ角ゴシック W3**（太字は W6）

**④ 枠に2割の余裕を持たせる**

和文は全角＝1emでどのフォントでも幅が変わらないが、**数字だけは環境によって幅が変わる**（Windowsではヒラギノが無く別フォントになる）。数字を枠にぴったり収めると、環境によってはみ出す。

### 5-3. 写真

`public/images/photo.jpg`（480×640、約76KB）。トップのヒーローで使用。差し替える場合は同名で置き換え、`src/pages/index.astro` の `width` / `height` 属性を実寸に合わせて直す（縦横比のずれ防止）。

---

## 6. 後から導入した仕組み

### 6-1. BudouX（日本語の改行位置）

日本語は既定ではほぼ全ての文字間で改行されるため、語の途中で切れる。これを文節の切れ目に寄せる仕組みを入れている。

**動作原理（ここを理解していないと壊す）**

1. ビルド時にBudouXが文章を文節に分割し、切れ目に `<wbr>` を挿入する
2. CSSの `.phrase { word-break: keep-all }` が**通常の改行を禁止**する
3. 結果、`<wbr>` の位置だけが改行可能として残る

**`<wbr>` と `.phrase` は必ずセット。**`<wbr>` は「ここで改行してよい」という許可にすぎず、単体では何の効果もない。片方だけ消すと機能しなくなる。

全ブラウザで同じ結果になる。閲覧者に配信されるJavaScriptはゼロ（ビルド時に処理済み）。

**適用範囲**

| 対象 | 処理 |
|---|---|
| 見出し（h1〜h4、全markdown） | 文節分割 |
| `src/content/pages/` の段落 | 文節分割 ＋ 原稿の改行を `<br>` に変換 |
| **記事本文の段落** | **文節分割しない。**保護語だけ `<span class="nobr">` で包む |
| 記事タイトル（h1） | 文節分割 ＋ 全角ダッシュ `——` の直後で必ず改行 |

記事本文を文節分割していないのは、長文で右端が大きく波打つため。代わりに「という」「として」などの語だけが割れないようにしてある。

**原稿の改行の扱いに注意**

- `src/content/pages/*.md` … 1行の改行が**そのまま表示の改行になる**
- `src/content/articles/*.md` … markdown標準どおり、段落内の改行は**無視される**

### 6-2. 保護語リスト（語が途中で割れるのを防ぐ）

BudouXは統計モデルなので複合語を誤って割ることがある（実例：「中小企業」→「中／小企業」、「として」→「と／して」）。

**修正方法：`src/lib/budoux-core.mjs` の `KEEP_TOGETHER` 配列に1行足すだけ。**

```js
export const KEEP_TOGETHER = [
  '中小企業診断士',
  '中小企業',
  '金融機関',
  ...
  '新しく追加したい語',
];
```

登録済みの語は専門用語（中小企業、金融機関、資金繰りなど）、複合助詞（という、として、といったなど）、複合動詞（身につけ、積み上がっているなど）。正確な内容はファイルを直接見ること。

この配列は見出し・固定ページ（文節分割の抑制）と記事本文（`nobr` で包む）の**両方で共有**される。

> **変更したら `.astro/` と `node_modules/.astro` を消してビルドし直すこと。**
> markdownの変換結果はキャッシュされており、消さないと反映されない。文章を直すだけなら不要。

### 6-3. 表の横スクロール

markdownの表は、プラグインが自動的に `<div class="table-scroll">` で包む。手作業は不要。

- 狭い画面では表だけが横スクロールする（ページ全体は横スクロールしない）
- スクロールできる側の端に影が出る。端まで送ると影が消える
- 影はCSSの背景4枚重ねで実現。`background-attachment` の `local` と `scroll` の差を利用しており、JavaScriptは不要
- 3列の表は 26% / 37% / 37% の幅配分。2列や4列以上は均等割り

### 6-4. その他

| 仕組み | 場所 |
|---|---|
| サイトマップ自動生成 | `@astrojs/sitemap`。記事追加で自動更新 |
| RSS | `src/pages/rss.xml.js` |
| Search Console認証タグ | `src/components/BaseHead.astro`（**消すと所有権が外れる**） |

---

## 7. デザイン変更の勘所

### 7-1. 色・フォント・寸法は変数で一元管理

`src/styles/global.css` の `:root` を書き換えれば全体に反映される。個別のファイルを触る必要はない。

```css
--c-bg: #ffffff;           /* 背景 */
--c-bg-subtle: #f7f6f3;    /* 薄い背景（ヒーロー、表のヘッダ） */
--c-text: #1c1f26;         /* 本文 */
--c-text-muted: #5f6672;   /* 補助テキスト */
--c-text-faint: #8a909b;   /* さらに薄い文字 */
--c-accent: #1e3d59;       /* アクセント（濃紺）。ボタン、リンク */
--c-accent-hover: #2d5679;
--c-border: #e2e0da;
--c-border-strong: #c9c6bd;

--font-sans:  /* 本文＝ゴシック（ヒラギノ角ゴ→Noto→Meiryo） */
--font-serif: /* 見出し＝明朝（ヒラギノ明朝→游明朝） */

--fs-brand: 1.28rem;       /* ヘッダーの屋号と自己紹介の名前で共有 */
--fs-brand-sp: 1.05rem;    /* 同・スマホ */

--w-page: 68rem;           /* ページ全体の最大幅 */
--w-prose: 42rem;          /* 本文の最大幅（読みやすさのため制限） */
--space-section: 5rem;     /* セクション間の余白 */
```

Webフォントは読み込んでいない（表示が速く、外部依存もない）。

### 7-2. ブレークポイント

| 幅 | 用途 |
|---|---|
| 640px以下 | スマホ。見出しサイズ、余白、行間、屋号サイズが切り替わる |
| 860px以下 | トップのヒーローが縦積みになる |
| 720px以上 | 本文幅が上限（646px）に達して固定。改行位置が安定する |

**PC表示とスマホ表示で異なる調整を入れてある箇所がある。**片方だけ直すともう片方が崩れるので、両方で確認すること。

### 7-3. markdownから生成される要素には `:global()` が必要

Astroの `<style>` はスコープ付きで、markdownの変換結果には当たらない。

```css
/* 効かない */
.page h2 { ... }

/* 効く */
.page :global(h2) { ... }
```

### 7-4. 詳細度に注意

過去に `.intro__name` が `.intro p` に負けてサイズが反映されない事例があった。効かないときはブラウザの開発者ツールで実際に適用されている値を確認する。

---

## 8. 触ってはいけない箇所

### 8-1. DNS（最重要）

**`MX` / `SPF` / `DKIM` レコードには絶対に触らない。** Google Workspaceのメールが停止する。

```
MX  : 1 smtp.google.com
SPF : v=spf1 include:_spf.google.com ~all
DKIM: google._domainkey に TXT レコード
```

サイトの公開でDNSを変更する必要は一切ない。ネームサーバーも移さない。

### 8-2. ファイル

| 対象 | 理由 |
|---|---|
| `public/CNAME` | 独自ドメインの指定。消すと `mi-consulting.biz` でアクセスできなくなる。ワークフローに存在チェックを入れてあり、欠けるとビルドが止まる |
| `BaseHead.astro` の `google-site-verification` | Search Consoleの所有権確認。消すと所有権が外れる |
| `.gitignore` の除外設定 | **リポジトリはPublic。**`_source/`、`_dns-backup-*.md`、`配管確認/`、`.claude/settings.local.json` は絶対に公開しない |
| `dist/` | 自動生成物。手で編集しても次のビルドで消える |

### 8-3. GitHub側の設定

Settings → Pages → Source は **`GitHub Actions`**。`Deploy from a branch` に戻すと公開が壊れる。

### 8-4. `_source/` は正本ではない

原稿の元ファイルが `_source/` に残っているが、**サイトが読んでいるのは `src/content/` 配下だけ**。`_source/` を編集してもサイトには反映されない。

---

## 9. よくある落とし穴

| 症状 | 原因と対処 |
|---|---|
| 変更が反映されない | **キャッシュ。**`rm -rf .astro dist node_modules/.astro` してビルドし直す。特に `budoux-core.mjs` やプラグインを変更したときに必要 |
| 新しいファイルが認識されない | devサーバーの再起動が必要。コレクションを追加したときも同様 |
| 設定ファイルの変更が効かない | `astro.config.mjs` と `src/lib/` の変更はdevサーバー再起動が必要 |
| スマホから見られない | devサーバーがlocalhost限定で起動している。`npm run dev:lan` を使う。`lsof -nP -iTCP:4321 -sTCP:LISTEN` で `*:4321` になっているか確認 |
| デプロイ成功したのに反映されない | 直前の実行を見ている可能性。**コミットSHAで照合する**こと |
| ビルドが落ちる | frontmatterのスキーマ違反が多い。`pillar` の値の誤字、日付の書式、`.astro` 内のダブルクォートの閉じ忘れ |

---

## 10. コマンド

```bash
npm run dev        # 開発サーバー（localhost のみ）
npm run dev:lan    # 開発サーバー（同一Wi-Fi内の他端末からも見える）
npm run build      # 本番と同じビルド。dist/ に出力
npm run preview    # ビルド結果を配信して確認
npm run check      # 型チェック
```

キャッシュを含めた作り直し:

```bash
rm -rf .astro dist node_modules/.astro && npm run build
```

---

## 11. 公開後の動作確認

本番へ反映されたあと、以下を確認すると事故を早期に発見できる。

```bash
# 全ページが200か
for p in / /profile/ /service/ /articles/ /rss.xml /sitemap-index.xml; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' https://mi-consulting.biz$p)  $p"
done

# 独自ドメインとSSL（ssl_verify_result が 0 なら正常）
curl -s -o /dev/null -w "%{url_effective} %{http_code} SSL:%{ssl_verify_result}\n" -L http://mi-consulting.biz/

# 配信中のCNAME（mi-consulting.biz が返るべき）
curl -s https://mi-consulting.biz/CNAME

# メール関連DNSが無傷か
dig +short MX mi-consulting.biz
dig +short TXT mi-consulting.biz | grep spf
```

リンク切れの検査（`dist/` に対して実行）:

```bash
python3 -c "
import re, pathlib
dist = pathlib.Path('dist'); t=set()
for h in dist.rglob('*.html'):
    for a,u in re.findall(r'(href|src)=\"(/[^\"]*)\"', h.read_text(encoding='utf-8',errors='replace')): t.add(u)
bad=[u for u in t if u not in ('','/') and not any(x.exists() for x in [dist/u.strip('/'), dist/u.strip('/')/'index.html', dist/(u.strip('/')+'.html')])]
print(f'{len(t)}件 → ' + ('切れなし' if not bad else f'切れ {bad}'))
"
```
