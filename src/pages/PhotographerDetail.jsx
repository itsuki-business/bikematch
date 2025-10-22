
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Star, Camera, MessageSquare, ArrowLeft, DollarSign, Package, ExternalLink, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import PortfolioGallery from "../components/photographer/PortfolioGallery";
import ReviewsList from "../components/photographer/ReviewsList";

export default function PhotographerDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const photographerId = urlParams.get('id');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: photographer, isLoading } = useQuery({
    queryKey: ['photographer', photographerId],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.find(u => u.id === photographerId);
    },
    enabled: !!photographerId,
  });

  const { data: portfolio } = useQuery({
    queryKey: ['portfolio', photographerId],
    queryFn: () => base44.entities.Portfolio.filter({ photographer_id: photographerId }),
    enabled: !!photographerId,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', photographerId],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: photographerId }, '-created_date'),
    enabled: !!photographerId,
    initialData: [],
  });

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const existing = await base44.entities.Conversation.filter({
        rider_id: currentUser.id,
        photographer_id: photographerId
      });
      
      if (existing.length > 0) {
        return existing[0];
      }
      
      return await base44.entities.Conversation.create({
        rider_id: currentUser.id,
        photographer_id: photographerId,
        status: "依頼中",
        last_message_date: new Date().toISOString()
      });
    },
    onSuccess: (conversation) => {
      navigate(createPageUrl("ConversationDetail") + `?id=${conversation.id}`);
    },
  });

  const handleContactClick = async () => {
    if (!currentUser) {
      alert('メッセージを送るにはログインが必要です');
      return;
    }
    
    if (!currentUser.user_type) {
      alert('プロフィールでユーザータイプを設定してください');
      navigate(createPageUrl("Profile"));
      return;
    }
    
    if (currentUser.user_type !== 'rider') {
      alert('メッセージを送るにはライダーとして登録してください。プロフィールページで変更できます。');
      return;
    }

    createConversationMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-96 w-full rounded-2xl mb-8" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center">
        <p className="text-lg text-gray-500">フォトグラファーが見つかりません</p>
      </div>
    );
  }

  const canSendMessage = currentUser && currentUser.user_type === 'rider';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>

        {currentUser && currentUser.user_type === 'photographer' && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              フォトグラファー同士でメッセージを送ることはできません。
              ライダーからの依頼をお待ちください。
            </AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 shadow-xl border-none overflow-hidden">
            <div className="relative h-64 md:h-96 bg-gradient-to-br from-gray-200 to-gray-400">
              {photographer.profile_image ? (
                <img 
                  src={photographer.profile_image} 
                  alt={photographer.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-24 h-24 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {photographer.nickname || "名前未設定"}
                </h1>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                    <MapPin className="w-4 h-4" />
                    <span>{photographer.prefecture || "地域未設定"}</span>
                  </div>
                  {photographer.average_rating && (
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{photographer.average_rating.toFixed(1)}</span>
                      <span className="text-sm">({photographer.review_count || 0}件)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">プロフィール</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {photographer.bio || "自己紹介がありません"}
                  </p>
                </div>

                <div className="space-y-6">
                  {photographer.shooting_genres && photographer.shooting_genres.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        得意ジャンル
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {photographer.shooting_genres.map((genre, index) => (
                          <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-sm px-3 py-1">
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {photographer.special_conditions && photographer.special_conditions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        こだわり条件
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {photographer.special_conditions.map((condition, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-3 py-1">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {photographer.equipment && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        使用機材
                      </h4>
                      <p className="text-gray-700">{photographer.equipment}</p>
                    </div>
                  )}

                  {(photographer.portfolio_website || photographer.instagram_url || photographer.twitter_url || photographer.youtube_url) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        リンク
                      </h4>
                      <div className="space-y-2">
                        {photographer.portfolio_website && (
                          <a
                            href={photographer.portfolio_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            ポートフォリオサイト
                          </a>
                        )}
                        {photographer.instagram_url && (
                          <a
                            href={photographer.instagram_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-pink-600 hover:text-pink-800 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                            Instagram
                          </a>
                        )}
                        {photographer.twitter_url && (
                          <a
                            href={photographer.twitter_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                            X
                          </a>
                        )}
                        {photographer.youtube_url && (
                          <a
                            href={photographer.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-red-600 hover:text-red-800 hover:underline"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                            YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {photographer.price_range_min !== undefined && photographer.price_range_max !== undefined && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        料金目安
                      </h4>
                      <p className="text-3xl font-bold text-gray-900">
                        ¥{photographer.price_range_min?.toLocaleString()} - ¥{photographer.price_range_max?.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        ※実際の料金は撮影内容により変動します。メッセージでご相談ください。
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {canSendMessage && (
                <Button
                  onClick={handleContactClick}
                  disabled={createConversationMutation.isPending}
                  className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
                >
                  <MessageSquare className="w-5 h-5 mr-2" />
                  {createConversationMutation.isPending ? "準備中..." : "メッセージを送る"}
                </Button>
              )}
            </CardContent>
          </Card>

          {portfolio.length > 0 && (
            <PortfolioGallery portfolio={portfolio} />
          )}

          {reviews.length > 0 && (
            <ReviewsList reviews={reviews} />
          )}
        </motion.div>
      </div>
    </div>
  );
}
