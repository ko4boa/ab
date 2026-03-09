# 実装計画 (implementation_plan.md)

## 目的
1. **クラウド同期の実現**: 複数端末で在庫データを共有するため、IndexedDB から Supabase へ移行する。
2. **クラウド公開**: Vercel を使い、インターネット上でパスワード保護された状態でアプリを公開する。

## 実施内容
- **Supabase クライアント作成**: `src/lib/supabase.ts` を作成。
- **データ層の書き換え**: 全ての `useLiveQuery` (Dexie) を `useEffect` + `supabase` によるフェッチへ変更。
- **書き込み処理の変更**: 各登録フォーム (`product-form.tsx`, `receive-form.tsx`, `sale-form.tsx`, `reservation-form.tsx`) を Supabase インサート・アップデートに変更。
- **セキュリティ**: `src/proxy.ts` (Next.js Middleware) による Basic 認証の実装。
- **デプロイ**: Vercel と GitHub の連携、および環境変数の設定。
- **ビルド問題の修正**: iCloud 同期対策と Vercel ビルドの競合を、`next.config.ts` での条件分岐（`process.env.VERCEL`）により解消。
