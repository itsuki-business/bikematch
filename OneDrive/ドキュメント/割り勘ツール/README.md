# 割り勘ツール（Vite + React）

シンプルな割り勘計算アプリです。データはブラウザの localStorage に保存されます。

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## デプロイ（Amplify Drag & Drop）

1. `npm run build` を実行
2. `dist/` の中身を ZIP 化（ZIP 直下に `index.html` がある状態）
3. Amplify Hosting にアップロード
4. リライトルール: `/<*> -> /index.html (200)` を追加