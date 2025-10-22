import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Camera, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function PhotographerCard({ photographer, currentUser }) {
  const navigate = useNavigate();
  const rating = photographer.average_rating || 0;
  const reviewCount = photographer.review_count || 0;

  // ポートフォリオ画像を取得
  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', photographer.id],
    queryFn: async () => {
      try {
        const result = await base44.entities.Portfolio.filter({ photographer_id: photographer.id });
        return result || [];
      } catch (error) {
        console.error('Portfolio fetch error:', error);
        return [];
      }
    },
    enabled: !!photographer.id,
    staleTime: 0, // 常に最新データを取得
    cacheTime: 60000, // 1分間キャッシュを保持
  });

  const handleCardClick = () => {
    navigate(createPageUrl("PhotographerDetail") + `?id=${photographer.id}`);
  };

  const handleMessageClick = async (e) => {
    e.stopPropagation(); // カードクリックを防ぐ
    
    if (!currentUser) {
      alert('メッセージを送るにはログインしてください');
      return;
    }

    try {
      // 既存の会話を検索（biker → photographer）
      const existingConversations = await base44.entities.Conversation.filter({
        biker_id: currentUser.id,
        photographer_id: photographer.id
      });

      let conversationId;
      
      if (existingConversations && existingConversations.length > 0) {
        // 既存の会話がある場合はそのIDを使用
        conversationId = existingConversations[0].id;
      } else {
        // 新しい会話を作成
        const newConversation = await base44.entities.Conversation.create({
          biker_id: currentUser.id,
          photographer_id: photographer.id,
          biker_name: currentUser.nickname || currentUser.name || '名無し',
          photographer_name: photographer.nickname || photographer.name || '名無し',
          last_message: '',
          last_message_at: new Date().toISOString()
        });
        conversationId = newConversation.id;
      }

      // 会話詳細ページに遷移
      navigate(createPageUrl("ConversationDetail") + `?id=${conversationId}`);
    } catch (error) {
      console.error('Failed to create/get conversation:', error);
      alert('メッセージルームの作成に失敗しました');
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="overflow-visible cursor-pointer shadow-md hover:shadow-xl transition-shadow duration-300 border-none"
        onClick={handleCardClick}
      >
        <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300">
          {photographer.profile_image ? (
            <img 
              src={photographer.profile_image} 
              alt={photographer.nickname || photographer.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
              }}
            />
          ) : portfolio.length > 0 ? (
            <img 
              src={portfolio[0].image_url} 
              alt={photographer.nickname || photographer.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="w-16 h-16 text-gray-400" />
            </div>
          )}
          {photographer.is_accepting_requests && (
            <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
              募集中
            </div>
          )}
        </div>
        
        <CardContent className="p-5">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {photographer.nickname || "名前未設定"}
          </h3>
          
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{photographer.prefecture || "地域未設定"}</span>
          </div>

          {/* レビュー表示 */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="font-bold text-lg text-gray-900">{rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-gray-500">({reviewCount}件のレビュー)</span>
          </div>

          {/* メッセージボタン */}
          <div className="mb-4">
            <Button 
              onClick={handleMessageClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              メッセージを送る
            </Button>
          </div>

          {photographer.shooting_genres && photographer.shooting_genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {photographer.shooting_genres.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                  {genre}
                </Badge>
              ))}
              {photographer.shooting_genres.length > 3 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  +{photographer.shooting_genres.length - 3}
                </Badge>
              )}
            </div>
          )}

          {photographer.special_conditions && photographer.special_conditions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {photographer.special_conditions.slice(0, 2).map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  {condition}
                </Badge>
              ))}
              {photographer.special_conditions.length > 2 && (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                  +{photographer.special_conditions.length - 2}
                </Badge>
              )}
            </div>
          )}

          {photographer.price_range_min !== undefined && photographer.price_range_max !== undefined && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">料金目安</p>
              <p className="text-lg font-bold text-gray-900">
                ¥{photographer.price_range_min?.toLocaleString()} - ¥{photographer.price_range_max?.toLocaleString()}
              </p>
            </div>
          )}

          {portfolio.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">ポートフォリオ</p>
              <div className="flex gap-2 overflow-x-auto">
                {portfolio.slice(0, 3).map((item, index) => (
                  <img
                    key={index}
                    src={item.image_url}
                    alt={`Portfolio ${index + 1}`}
                    className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="gray" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
                    }}
                  />
                ))}
                {portfolio.length > 3 && (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-600">+{portfolio.length - 3}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}