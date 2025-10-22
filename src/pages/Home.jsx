import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import LoginModal from "@/components/auth/LoginModal";

import PhotographerCard from "../components/home/PhotographerCard";
import SearchFilters from "../components/home/SearchFilters";
import HeroSection from "../components/home/HeroSection";

import { Search, MapPin, Camera, DollarSign, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";

export default function Home() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [filters, setFilters] = useState({
    prefecture: "all",
    genre: "all",
    minRating: "all", // Added new filter condition
    priceMin: "",
    priceMax: "",
    specialConditions: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setCurrentUser(userData);
      } catch (error) {
        console.log('Not authenticated:', error);
        setCurrentUser(null);
      }
    };
    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setShowLoginModal(false);
    // ログイン後に自動更新
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSearch = () => {
    // 検索ボタンクリック時にクエリを即座に再取得
    queryClient.invalidateQueries(['photographers']);
  };

  const { data: photographers, isLoading, isFetching } = useQuery({
    queryKey: ['photographers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(user => 
        user.user_type === 'photographer' && 
        user.is_accepting_requests === true
      );
    },
    initialData: [],
    staleTime: Infinity, // キャッシュを常に使用（検索ボタンで手動更新）
    cacheTime: Infinity, // キャッシュを永続化
    refetchOnMount: false, // マウント時に再取得しない
    refetchOnWindowFocus: false, // フォーカス時に再取得しない
  });

  const filteredPhotographers = photographers.filter(photographer => {
    if (filters.prefecture !== "all" && photographer.prefecture !== filters.prefecture) {
      return false;
    }
    if (filters.genre !== "all") {
      if (!photographer.shooting_genres || !photographer.shooting_genres.includes(filters.genre)) {
        return false;
      }
    }
    // New filtering condition for minRating
    if (filters.minRating !== "all") {
      const photographerRating = photographer.average_rating || 0; // Assuming average_rating exists, default to 0 if null/undefined
      if (photographerRating < parseFloat(filters.minRating)) {
        return false;
      }
    }
    if (filters.priceMin && photographer.price_range_min < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && photographer.price_range_max > parseFloat(filters.priceMax)) {
      return false;
    }
    if (filters.specialConditions && filters.specialConditions.length > 0) {
      const photographerConditions = photographer.special_conditions || [];
      const hasAllConditions = filters.specialConditions.every(
        condition => photographerConditions.includes(condition)
      );
      if (!hasAllConditions) {
        return false;
      }
    }
    return true;
  });

  // ログイン前の表示
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

          {/* プレビュー用のフォトグラファー表示（ログイン前でも一部表示） */}
          <div className="mb-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                登録フォトグラファー
              </h2>
              <p className="text-gray-600">ログインして詳細を確認し、撮影を依頼しましょう</p>
            </div>

            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                    <Skeleton className="h-48 w-full rounded-xl" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <motion.div 
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                {photographers.slice(0, 3).map((photographer) => (
                  <div key={photographer.id} className="bg-white rounded-2xl p-6 shadow-lg relative">
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-50 rounded-2xl flex items-center justify-center">
                      <div className="text-center text-white">
                        <p className="font-semibold mb-2">ログインして詳細を見る</p>
                        <Button 
                          onClick={() => setShowLoginModal(true)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          ログイン
                        </Button>
                      </div>
                    </div>
                    <PhotographerCard 
                      photographer={photographer}
                      currentUser={null}
                    />
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ログイン後の表示
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <HeroSection />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        {currentUser && currentUser.user_type === 'photographer' && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              フォトグラファーの方は、ライダーからの依頼をお待ちください。
              プロフィールを充実させて、魅力的なポートフォリオを作成しましょう。
              他のフォトグラファーの作品も参考にご覧いただけます。
            </AlertDescription>
          </Alert>
        )}

        <SearchFilters filters={filters} setFilters={setFilters} onSearch={handleSearch} />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              フォトグラファーを探す
            </h2>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {filteredPhotographers.length}人
            </Badge>
          </div>

          {(isLoading || isFetching) && filteredPhotographers.length === 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 space-y-4">
                  <Skeleton className="h-48 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredPhotographers.length === 0 ? (
            <div className="text-center py-16">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-500">条件に合うフォトグラファーが見つかりませんでした</p>
            </div>
          ) : (
            <motion.div 
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredPhotographers.map((photographer) => (
                <div key={photographer.id} className="flex w-full">
                  <PhotographerCard 
                    photographer={photographer}
                    currentUser={currentUser}
                  />
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
