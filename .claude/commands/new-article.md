---
description: 記事を1本追加して本番公開まで行う
---

記事を追加する。原稿または指示: $ARGUMENTS

まず `OPERATIONS.md` を読むこと。手順・スキーマ・禁止事項はすべてそこに書いてある。

## 進め方

### 1. 原稿を受け取る

原稿の場所を確認する。指定がなければ聞く。

**通常は `src/content/articles/` に本人が直接書いている**ので、その場合はファイルを新規作成せず、既にあるファイルを検証する。原稿が別の場所（貼り付け、`_source/` 配下など）にある場合のみ、`src/content/articles/` に新規作成する。`_source/` は正本ではない。

**本文には手を入れない。** 誤字が明らかな場合も、勝手に直さず指摘だけする。

### 2. frontmatter を決める

以下を確定させる。原稿から判断できないものはユーザーに聞く。**推測で埋めない。**

- `title` / `description`
- `pubDate`（指定がなければ本日）
- `pillar`（6つの値から1つ。`OPERATIONS.md` の表を参照）
- `basicId`（基礎記事なら `K03` のような番号。既存記事と重複させない）
- `parent`（応用記事なら親のファイル名。拡張子なし・小文字）

ファイル名も決める。**ファイル名がURLになる**（小文字化される）。英数字・ハイフン・アンダースコアのみ。

### 3. ファイルを作る

`src/content/articles/` に配置する。frontmatter は既存記事と同じ形式で書く。

### 4. ビルドで検証する

```bash
rm -rf .astro dist node_modules/.astro && npm run build
```

確認すること:

- ビルドが通るか（frontmatterのスキーマ違反はここで落ちる）
- 生成されたURLが意図どおりか
- 記事一覧に出ているか
- 本文が原稿と一致しているか（改変していないことの確認）
- 内部リンク切れがないか（`OPERATIONS.md` 11章のコマンド）

図版のSVGは `scripts/fix-svg.mjs` がビルド前に自動で整える（`viewBox` の付与、フォントの統一）。手作業は不要だが、**修正が入った場合はコミット対象に含まれる**ので、push前の一覧提示のときに漏れなく報告すること。

### 5. 表示を確認する

devサーバーを起動し、記事ページと一覧をPC幅・スマホ幅の両方で見る。改行位置が不自然な語があれば、`src/lib/budoux-core.mjs` の `KEEP_TOGETHER` への追加を提案する（勝手に追加せず、確認を取る）。

### 6. push の承認を得る

**必ず `git diff --cached --name-status` の結果を提示してから承認を求める。** 承認なしにpushしない。

除外対象（`_source/`、`_dns-backup-*.md`、`配管確認/`、`.DS_Store`）が混入していないことも確認して報告する。

### 7. 公開して検証する

push後、**コミットSHAで照合して**デプロイ完了を待つ。直前の実行を見て誤判定しないこと。

```bash
SHA=$(git rev-parse HEAD)
curl -s "https://api.github.com/repos/masatoshi-ishikawa/mi-consulting-site/actions/runs?per_page=10" \
 | python3 -c "
import json,sys
sha='$SHA'
for r in json.load(sys.stdin)['workflow_runs']:
    if r['head_sha']==sha and r['name']=='Deploy to GitHub Pages':
        print(r['status'], r['conclusion']); break
else: print('not_found','None')
"
```

完了したら本番URLで記事ページ・記事一覧・サイトマップが200であることを確認して報告する。

## 守ること

- DNSには一切触れない（MX・SPF・DKIMでメールが動いている）
- `public/CNAME` と `BaseHead.astro` の `google-site-verification` を消さない
- リポジトリはPublic。`.gitignore` の除外設定を緩めない
- 見た目に関わる判断、ファイルの削除・上書き、push前は必ず確認を取る
