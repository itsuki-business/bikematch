import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

// --- TanStack Query ---
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// ---------------

// --- Environment Configuration ---
import { useMock } from './config/environment';
// ---------------

// --- Amplify Configuration ---
if (useMock) {
  console.log('🚀 Using Mock Amplify services for local development');
} else {
  console.log('🌐 Using Production Amplify services');
  import('aws-amplify').then(({ Amplify }) => {
    import('./aws-exports').then(({ default: awsExports }) => {
      Amplify.configure(awsExports);
    });
  });
}
// ---------------

// TanStack Queryのクライアントを作成
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);