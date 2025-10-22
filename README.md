# BikeMatch App

バイクマッチングアプリケーション - ライダーとフォトグラファーをつなぐプラットフォーム

This is a Vite+React app that connects motorcycle riders with photographers for photo sessions.

## Features

- ユーザー認証とプロフィール管理
- ライダーとフォトグラファーのマッチング
- メッセージング機能
- レビューシステム
- ポートフォリオ管理

## Development

### Prerequisites

- Node.js (v16 or higher)
- npm

### Running the app locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Building the app

```bash
npm run build
```

## AWS Amplify Deployment

This app is configured for deployment on AWS Amplify.

### Setup

1. Push your code to a Git repository (GitHub, GitLab, etc.)
2. Connect your repository to AWS Amplify
3. Configure environment variables in Amplify Console:
   - `VITE_API_URL`: Your API Gateway URL
   - `VITE_AWS_REGION`: AWS region (e.g., ap-northeast-1)
4. Deploy using the included `amplify.yml` configuration

### Environment Variables

Copy `.env.example` to `.env.local` and update the values for local development.

## Project Structure

```
src/
├── api/           # API client and configuration
├── components/    # Reusable UI components
├── pages/         # Page components
└── utils/         # Utility functions
```

## Technology Stack

- **Frontend**: React + Vite
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: React Query
- **Routing**: React Router
- **Deployment**: AWS Amplify