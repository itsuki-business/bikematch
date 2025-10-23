import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listUsers } from '@/graphql/queries';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import HeroSection from "../components/home/HeroSection";
import PhotographerCard from "../components/home/PhotographerCard";
import SearchFilters from "../components/home/SearchFilters";

// Constants
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const GENRES = [
  "ツーリング", "スポーツ走行", "カスタム", "レストア", "オフロード",
  "ツーリングレポート", "イベント", "ポートレート", "風景", "アクション"
];

const SPECIAL_CONDITIONS = [
  "ドローン撮影対応", "夜間撮影対応", "雨天撮影対応", "遠方出張対応",
  "編集・加工サービス", "プリントサービス", "データ納品", "SNS投稿用編集"
];

export default function HomeForRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [filters, setFilters] = useState({
    prefecture: "all",
    genre: "all",
    minRating: "all",
    priceMin: "",
    priceMax: "",
    specialConditions: []
  });

  console.log('✅ HomeForRegister rendering for user:', currentUser);

  // --- Fetch Photographers --- (フックは条件分岐の前に呼び出す必要がある)
  const { data: photographers = [], isLoading: isLoadingPhotographers, isFetching: isFetchingPhotographers } = useQuery({
    queryKey: ['photographers', filters],
    queryFn: async () => {
      let apiFilters = {
        user_type: { eq: 'photographer' },
        is_accepting_requests: { eq: true }
      };
      if (filters.prefecture !== "all") { apiFilters.prefecture = { eq: filters.prefecture }; }
      if (filters.genre !== "all") { apiFilters.shooting_genres = { contains: filters.genre }; }
      if (filters.minRating !== "all") { apiFilters.average_rating = { ge: parseFloat(filters.minRating) }; }
      const priceConditions = [];
      if (filters.priceMin) {
        priceConditions.push({ or: [{ price_range_max: { ge: parseFloat(filters.priceMin) } }, { price_range_min: { attributeExists: false } }] });
      }
      if (filters.priceMax) {
        priceConditions.push({ or: [{ price_range_min: { le: parseFloat(filters.priceMax) } }, { price_range_min: { attributeExists: false } }] });
      }
      if (priceConditions.length > 0) { apiFilters.and = [...(apiFilters.and || []), ...priceConditions]; }
      if (filters.specialConditions && filters.specialConditions.length > 0) {
        const conditionFilters = filters.specialConditions.map(condition => ({ special_conditions: { contains: condition } }));
        apiFilters.and = [...(apiFilters.and || []), ...conditionFilters];
      }
      console.log("Constructed API Filters:", apiFilters);
      try {
        const client = generateClient();
        const result = await client.graphql({
          query: listUsers,
          variables: { filter: apiFilters },
          authMode: 'userPool' // Cognito User Pools認証を使用
        });
        console.log("GraphQL Result:", result);
        return result.data?.listUsers?.items || [];
      } catch (error) {
        console.error("Error fetching photographers:", error);
        if (error.errors) { error.errors.forEach(err => console.error("GraphQL Error:", err.message, err)); }
        return [];
      }
    },
  });

  const isFetching = isFetchingPhotographers;

  // 認証状態を取得
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoadingUser(true);
      try {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        console.log('HomeForRegister - Current user:', cognitoUser);
        console.log('HomeForRegister - User attributes:', attributes);
        
        setCurrentUser({
          username: cognitoUser.username ?? cognitoUser.userId,
          userId: cognitoUser.userId,
          attributes: attributes || {},
        });
      } catch (error) {
        console.error('HomeForRegister - Not authenticated:', error);
        // 認証されていない場合はHomeForNonRegisterにリダイレクト
        navigate('/home-for-non-register');
      } finally {
        setIsLoadingUser(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // ローディング中の表示
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // 認証されていない場合（リダイレクト中）
  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <HeroSection />
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {/* ユーザータイプ別アラート */}
        {currentUser?.attributes?.['custom:user_type'] === 'photographer' && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              フォトグラファーの方は、ライダーからの依頼をお待ちください。プロフィールを充実させて、魅力的なポートフォリオを作成しましょう。
              <Button 
                onClick={() => navigate(`/profile/${currentUser?.userId}`)} 
                variant="outline" 
                size="sm" 
                className="ml-2 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                プロフィール編集
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {currentUser?.attributes?.['custom:user_type'] === 'rider' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              ライダーの方は、下記から理想のフォトグラファーを探して撮影を依頼しましょう。
              <Button 
                onClick={() => navigate(`/profile/${currentUser?.userId}`)} 
                variant="outline" 
                size="sm" 
                className="ml-2 border-green-300 text-green-700 hover:bg-green-100"
              >
                プロフィール編集
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        {!currentUser?.attributes?.['custom:user_type'] && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              プロフィールを設定して、より充実したサービスをご利用ください。
              <Button 
                onClick={() => navigate(`/profile/${currentUser?.userId}`)} 
                variant="outline" 
                size="sm" 
                className="ml-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                プロフィール設定
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <SearchFilters filters={filters} setFilters={setFilters} />
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">フォトグラファーを探す</h2>
            {isFetching ? (
              <Badge variant="outline" className="text-lg px-4 py-2 animate-pulse bg-yellow-100 text-yellow-800 border-yellow-300">
                検索中...
              </Badge>
            ) : (
              <Badge variant="outline" className="text-lg px-4 py-2">
                {photographers.length}人
              </Badge>
            )}
          </div>
          {isLoadingPhotographers && photographers.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={`skel-loading-${i}`} className="bg-white rounded-2xl p-6 space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : !isFetching && photographers.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-500">条件に合うフォトグラファーが見つかりませんでした</p>
              <p className="text-sm text-gray-400 mt-2">検索条件を変更してみてください。</p>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {photographers.map((photographer) => (
                <PhotographerCard key={photographer.id} photographer={photographer} currentUser={currentUser} />
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

