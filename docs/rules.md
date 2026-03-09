title: "Inventory Lite 開発ルールと思考履歴"
updated: "2026-03-10"

# 開発ルールと履歴 (docs/rules.md)

このドキュメントは、複数端末間での開発を円滑に進めるため、AI（Antigravity）および開発者が参照すべき共通ルールと過去の経緯を記録するものです。
開発を再開する際は、**必ず最初にこのファイルおよび関連ドキュメントを確認してください。**

- **基本構成**: `Next.js` (App Router) を採用。
- **デプロイ先**: `Vercel` にて公開済み。
- **バックエンド/DB**: `Supabase` を導入し、 IndexedDB (Dexie) からの移行を完了。現在はクラウド上のDBが本番データ。
- **環境変数の管理**: Vercel に以下の環境変数を設定している（Supabase 接続用）。
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **React+Vite について**: 一時期 Vite への移行を検討・検証したが、最終的に Next.js + Vercel の本来の技術スタックで進める方針に決定したため、Vite版のコードは破棄済み。

- **問題**: Next.js のビルド時や開発サーバー起動時に生成される `.next` フォルダが大量のキャッシュファイルを頻繁に更新するため、iCloud の同期プロセスがフリーズし、起動に異常な時間がかかる（数十時間レベル）。
- **対策**: `next.config.ts` にて、**ローカル開発時のみ** ビルド出力先を `.next.nosync` に変更している。
  ```typescript
  // next.config.ts の設定例
  const nextConfig: NextConfig = {
    distDir: process.env.VERCEL ? ".next" : ".next.nosync",
  };
  ```
  ※ Vercel上では標準の `.next` を使い、ローカル（iCloud）のみ同期除外フォルダを使うことで、デプロイと動作の安定性を両立している。**この設定は安易に変更しないこと。**

## 3. ドキュメント運用のルール
別端末間で作業を引き継ぐ際は、GitHubを経由して以下のドキュメントを更新・共有すること。
（※各端末のAntigravityが文脈を理解するための必須手順です）

1. 新しい機能実装や方向性変更があった場合は、この `docs/rules.md` に追記する。
2. 作業を中断・終了する際は、進行中だったタスクや次やるべきことを書き残す。
3. 別端末で作業を再開する際は、**「docs の内容を読んで、前回の続きから作業を再開して」**とAIに指示を出すこと。
