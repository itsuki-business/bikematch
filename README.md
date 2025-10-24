# BikeMatch

バイク専門フォトグラファーとライダーをマッチングするサービスです。

## 概要

BikeMatchは、バイク愛好家とプロのフォトグラファーを結びつけるプラットフォームです。ツーリングの思い出、カスタムバイクの記録、サーキット走行の瞬間を、プロの技術で美しく残すことができます。

## 主な機能

- **ユーザー登録・認証**: AWS Cognitoを使用した安全な認証システム
- **プロフィール管理**: ライダーとフォトグラファーの詳細プロフィール
- **マッチング機能**: 条件に基づいたフォトグラファー検索
- **メッセージ機能**: 直接的なコミュニケーション
- **評価・レビュー**: 相互評価システム
- **ポートフォリオ**: フォトグラファーの作品集

## 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング
- **React Router** - ルーティング
- **TanStack Query** - データフェッチング
- **Framer Motion** - アニメーション

### バックエンド
- **AWS Amplify** - フルスタック開発プラットフォーム
- **AWS Cognito** - 認証・認可
- **AWS AppSync** - GraphQL API
- **Amazon DynamoDB** - NoSQLデータベース
- **AWS S3** - ファイルストレージ

### 開発環境
- **Mock Services** - ローカル開発用のモックサービス
- **localStorage** - Mockデータの永続化

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- AWS CLI（本番環境用）

### インストール

1. リポジトリをクローン
```bash
git clone <repository-url>
cd bikematch
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
# Mock環境で開発する場合
echo "VITE_USE_MOCK=true" > .env.local

# 本番環境で開発する場合
echo "VITE_USE_MOCK=false" > .env.local
```

4. 開発サーバーを起動
```bash
npm run dev
```

## 開発モード

### Mock環境での開発
Mock環境では、実際のAWSサービスを使用せずにローカルで開発できます。

- **認証**: Mock認証サービス
- **API**: Mock GraphQLサービス
- **ストレージ**: Mockストレージサービス
- **データ永続化**: localStorage

### 本番環境での開発
AWS Amplifyを使用した本番環境での開発：

```bash
# Amplifyの初期化
amplify init

# 認証の設定
amplify add auth

# APIの設定
amplify add api

# ストレージの設定
amplify add storage

# デプロイ
amplify push
```

## プロジェクト構造

```
src/
├── components/          # 再利用可能なコンポーネント
│   ├── auth/           # 認証関連コンポーネント
│   ├── home/           # ホームページコンポーネント
│   ├── messages/       # メッセージ関連コンポーネント
│   ├── photographer/   # フォトグラファー関連コンポーネント
│   ├── profile/        # プロフィール関連コンポーネント
│   └── ui/             # UIコンポーネント
├── pages/              # ページコンポーネント
├── services/           # Mockサービス
├── graphql/            # GraphQLクエリ・ミューテーション
├── hooks/              # カスタムフック
├── lib/                # ユーティリティ
└── config/             # 設定ファイル
```

## 主要なページ

- **`/`** - ホームページ（未認証ユーザー向け）
- **`/home-for-register`** - ホームページ（認証済みユーザー向け）
- **`/first-time-profile-setup`** - 初回プロフィール設定
- **`/profile/:userId`** - プロフィール編集
- **`/messages/:userId`** - メッセージ一覧
- **`/conversation-detail`** - 会話詳細

## 認証フロー

1. **新規登録** → メール確認 → 初回プロフィール設定
2. **ログイン** → ホームページ
3. **ログアウト** → 未認証ユーザー向けホームページ

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。

## 連絡先

プロジェクトに関する質問や提案があれば、お気軽にお声がけください。