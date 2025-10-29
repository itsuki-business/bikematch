import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, MapPin, Camera, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import HeroSection from "../components/home/HeroSection";
import PhotographerCard from "../components/home/PhotographerCard";
import { useQuery } from "@tanstack/react-query";
import { generateClient } from 'aws-amplify/api';
import { listUsers } from '@/graphql/queries';
import { Skeleton } from "@/components/ui/skeleton";
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import { getCurrentUser } from 'aws-amplify/auth';

export default function HomeForNonRegister() {
  const navigate = useNavigate();

  // 開発用：Mock環境で認証状態をリセットする関数をグローバルに公開
  useEffect(() => {
    if (useMock && typeof window !== 'undefined') {
      window.resetMockAuth = () => {
        mockAuthService.resetMockData();
        console.log('Mock auth data reset. Please refresh the page.');
        window.location.reload();
      };
      console.log('Development: Call window.resetMockAuth() to reset mock authentication state');
    }
  }, []);

  // 認証状態をチェック
  useEffect(() => {
    const checkAuth = async () => {
      try {
        let cognitoUser;
        if (useMock) {
          cognitoUser = await mockAuthService.getCurrentUser();
          // Mock環境では、isAuthenticatedフラグも確認
          const isAuthenticated = mockAuthService.isAuthenticated;
          console.log('HomeForNonRegister - Mock auth state:', { cognitoUser, isAuthenticated });
          
          if (cognitoUser && cognitoUser.userId && isAuthenticated) {
            console.log('HomeForNonRegister - Redirecting authenticated mock user to /home-for-register');
            navigate('/home-for-register');
          }
        } else {
          cognitoUser = await getCurrentUser();
          console.log('HomeForNonRegister - User is authenticated:', cognitoUser);
          
          // 認証済みユーザーは home-for-register にリダイレクト
          if (cognitoUser && cognitoUser.userId) {
            console.log('HomeForNonRegister - Redirecting authenticated user to /home-for-register');
            navigate('/home-for-register');
          }
        }
      } catch (error) {
        console.log('HomeForNonRegister - User is not authenticated:', error);
        // 認証されていない場合はこのページを表示
      }
    };
    
    checkAuth();
  }, [navigate]);

  // フォトグラファーのプレビューを取得（最大3人）
  const { data: photographers = [], isLoading } = useQuery({
    queryKey: ['photographers-preview'],
    queryFn: async () => {
      try {
        // 一時的にMockデータを返す
        console.log("Using mock photographers data");
        return [
          {
            id: 'mock-photographer-1',
            nickname: 'サンプルフォトグラファー1',
            prefecture: '東京都',
            shooting_genres: ['ポートレート', '風景'],
            average_rating: 4.5,
            review_count: 12
          },
          {
            id: 'mock-photographer-2',
            nickname: 'サンプルフォトグラファー2',
            prefecture: '大阪府',
            shooting_genres: ['スポーツ', 'イベント'],
            average_rating: 4.8,
            review_count: 8
          },
          {
            id: 'mock-photographer-3',
            nickname: 'サンプルフォトグラファー3',
            prefecture: '神奈川県',
            shooting_genres: ['ファッション', '商品撮影'],
            average_rating: 4.2,
            review_count: 15
          }
        ];
      } catch (error) {
        console.error("Error fetching photographers:", error);
        return [];
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* ログイン前の案内 */}
        <div className="text-center mb-12">
          <Alert className="mb-6 bg-blue-50 border-blue-200 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              BikeMatchへようこそ！ライダーとフォトグラファーをつなぐプラットフォームです。
              ログインまたは新規登録をして、素敵な写真撮影を始めましょう。
            </AlertDescription>
          </Alert>
          <div className="mt-6 space-x-4">
            <p className="text-gray-600">
              サイドバーからログインまたは新規登録してください
            </p>
          </div>
        </div>

        {/* サービス紹介 */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">フォトグラファーを探す</h3>
            <p className="text-gray-600">お住まいの地域や撮影ジャンルから、理想のフォトグラファーを見つけられます。</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">撮影を依頼</h3>
            <p className="text-gray-600">メッセージ機能で直接やり取りし、撮影の詳細を相談できます。</p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">安心取引</h3>
            <p className="text-gray-600">レビューシステムで信頼できるフォトグラファーを選べます。</p>
          </motion.div>
        </div>

        {/* プレビュー表示 */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">登録フォトグラファー</h2>
            <p className="text-gray-600">ログインして詳細を確認し、撮影を依頼しましょう</p>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => (
                <div key={`skel-preview-${i}`} className="bg-white rounded-2xl p-6 space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : photographers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              現在登録されている募集中フォトグラファーがいません。
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {photographers.map((photographer) => (
                <div key={photographer.id} className="relative group">
                  <div className="absolute inset-0 bg-black bg-opacity-60 rounded-xl flex flex-col items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-semibold mb-3 text-center px-4">
                      詳細の確認や依頼にはログインが必要です
                    </p>
                    <p className="text-white text-sm">
                      サイドバーからログインしてください
                    </p>
                  </div>
                  <PhotographerCard photographer={photographer} currentUser={null} />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      
      {/* デバッグ用のlocalStorage確認機能 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg z-50">
          <h3 className="font-bold mb-2">Debug: localStorage Status</h3>
          <div className="text-sm space-y-1">
            <div>Auth Data: {localStorage.getItem('mockAuthData') ? '✅' : '❌'}</div>
            <div>API Data: {localStorage.getItem('mockAPIData') ? '✅' : '❌'}</div>
            <div>Pending User: {localStorage.getItem('mockPendingUser') ? '✅' : '❌'}</div>
          </div>
          <button
            onClick={() => {
              console.log('=== localStorage Debug Info ===');
              console.log('mockAuthData:', localStorage.getItem('mockAuthData'));
              console.log('mockAPIData:', localStorage.getItem('mockAPIData'));
              console.log('mockPendingUser:', localStorage.getItem('mockPendingUser'));
            }}
            className="mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
          >
            Log to Console
          </button>
        </div>
      )}
    </div>
  );
}

