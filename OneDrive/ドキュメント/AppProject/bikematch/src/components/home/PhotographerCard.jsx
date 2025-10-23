import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Camera, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // useQueryClient をインポート

export default function PhotographerCard({ photographer, currentUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // queryClient を取得
  const rating = photographer.average_rating || 0;
  const reviewCount = photographer.review_count || 0;

  // ポートフォリオ画像を取得
  const { data: portfolio = [] } = useQuery({
    queryKey: ['portfolio', photographer.id],
    queryFn: async () => {
      try {
        // base44 を bikematchClient.js のインスタンス名に変更 (どちらでも良いが統一)
        const result = await base44.entities.Portfolio.filter({ photographer_id: photographer.id });
        return result || [];
      } catch (error) {
        console.error('Portfolio fetch error:', error);
        return [];
      }
    },
    enabled: !!photographer.id,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュを有効にする
    cacheTime: 15 * 60 * 1000, // 15分間キャッシュを保持
  });

  const handleCardClick = () => {
    navigate(createPageUrl("PhotographerDetail") + `?id=${photographer.id}`);
  };

  const handleMessageClick = async (e) => {
    e.stopPropagation(); // カードクリックを防ぐ

    if (!currentUser) {
      alert('メッセージを送るにはログインしてください');
      // ここでログインモーダルを開く処理を呼び出すことも検討
      // 例: openLoginModal();
      return;
    }

    if (!currentUser.user_type) {
       alert('プロフィールでユーザータイプを設定してください');
       navigate(createPageUrl("Profile"));
       return;
     }


    if (currentUser.user_type !== 'rider') {
      alert('メッセージを送るにはライダーとして登録してください。プロフィールページで変更できます。');
      return; // ライダー以外はメッセージを送れない
    }

    if (currentUser.id === photographer.id) {
       alert('自分自身にメッセージを送ることはできません。');
       return;
     }


    try {
      // 既存の会話を検索（biker_id と photographer_id で検索）
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
          biker_name: currentUser.nickname || currentUser.name || 'ライダー', // 名前がない場合のデフォルト
          photographer_name: photographer.nickname || photographer.name || 'フォトグラファー', // 名前がない場合のデフォルト
          last_message: '会話を開始しました', // 修正点：初期メッセージを設定
          status: "依頼中", // 会話の初期状態
          // last_message_at は bikematchClient 側で自動設定される
        });
        conversationId = newConversation.id;
        // 新規作成後に会話リストのキャッシュを無効化して更新を促す
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }

      // 会話詳細ページに遷移
      navigate(createPageUrl("ConversationDetail") + `?id=${conversationId}`);
    } catch (error) {
      console.error('Failed to create/get conversation:', error);
      // 修正点：エラーメッセージをより具体的に
      alert(`メッセージルームの作成/取得に失敗しました: ${error.message || '不明なエラーが発生しました。時間をおいて再度お試しください。'}`);
    }
  };


    // 画像エラー時にプレースホルダーを表示する関数
    const handleImageError = (e) => {
      e.target.style.display = 'none'; // エラーしたimg要素を隠す
      // 親要素（div.relative）にプレースホルダーSVGを追加
      const parent = e.target.parentElement;
      if (parent && !parent.querySelector('.placeholder-icon')) { // 既にプレースホルダーがないか確認
          parent.innerHTML += `
              <div class="placeholder-icon w-full h-full flex items-center justify-center bg-gray-200">
                  <svg class="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
              </div>`;
      }
    };

    // ポートフォリオ画像の onError ハンドラ
    const handlePortfolioImageError = (e) => {
        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
        e.target.style.backgroundColor = '#f1f5f9'; // bg-slate-100
    };


  return (
    <motion.div
      whileHover={{ y: -5, transition: { duration: 0.2 } }} // 少し控えめな動きに
      initial={{ opacity: 0, y: 15 }} // 少し控えめな動きに
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full" // 高さを親要素に合わせる + 幅を100%に
    >
      <Card
        className="overflow-hidden cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-300 border rounded-xl flex flex-col flex-grow w-full bg-white" // 角丸、flex-grow追加、幅100%、明るい背景
        onClick={handleCardClick}
      >
        <div className="relative h-48 bg-gray-200"> {/* 高さを少し小さく */}
          {photographer.profile_image ? (
            <img
              src={photographer.profile_image}
              alt={photographer.nickname || photographer.name || 'プロフィール画像'}
              className="w-full h-full object-cover"
              onError={handleImageError} // エラーハンドラを追加
              loading="lazy" // 遅延読み込み
            />
          ) : portfolio.length > 0 && portfolio[0].image_url ? ( // portfolio画像が存在するか確認
            <img
              src={portfolio[0].image_url}
              alt={photographer.nickname || photographer.name || 'ポートフォリオ画像'}
              className="w-full h-full object-cover"
              onError={handleImageError} // エラーハンドラを追加
              loading="lazy" // 遅延読み込み
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100"> {/* プレースホルダー背景 */}
              <Camera className="w-12 h-12 text-gray-400" /> {/* 少し小さく */}
            </div>
          )}
          {photographer.is_accepting_requests && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow"> {/* 位置調整 */}
              募集中
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-grow"> {/* パディング調整、flex-grow */}
          <h3 className="text-lg font-bold text-gray-900 mb-1 truncate"> {/* サイズ調整、マージン調整、truncate */}
            {photographer.nickname || "名前未設定"}
          </h3>

          <div className="flex items-center gap-1 text-gray-600 mb-2 text-sm"> {/* サイズ、マージン調整 */}
            <MapPin className="w-3.5 h-3.5" /> {/* アイコンサイズ調整 */}
            <span>{photographer.prefecture || "地域未設定"}</span>
          </div>

          {/* レビュー表示 */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100"> {/* マージン、パディング調整 */}
            <div className="flex items-center gap-0.5"> {/* gap調整 */}
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" /> {/* サイズ調整 */}
              <span className="font-bold text-base text-gray-900">{rating.toFixed(1)}</span> {/* サイズ調整 */}
            </div>
            <span className="text-xs text-gray-500">({reviewCount}件)</span> {/* サイズ調整 */}
          </div>

          {/* ジャンル */}
          {photographer.shooting_genres && photographer.shooting_genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2"> {/* gap, margin調整 */}
              {photographer.shooting_genres.slice(0, 3).map((genre, index) => (
                <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200 text-xs px-1.5 py-0.5"> {/* サイズ、padding調整 */}
                  {genre}
                </Badge>
              ))}
              {photographer.shooting_genres.length > 3 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5"> {/* サイズ、padding調整 */}
                  +{photographer.shooting_genres.length - 3}
                </Badge>
              )}
            </div>
          )}

           {/* こだわり条件 */}
           {photographer.special_conditions && photographer.special_conditions.length > 0 && (
             <div className="flex flex-wrap gap-1 mb-3"> {/* gap, margin調整 */}
               {photographer.special_conditions.slice(0, 2).map((condition, index) => (
                 <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-1.5 py-0.5"> {/* サイズ、padding調整 */}
                   {condition}
                 </Badge>
               ))}
               {photographer.special_conditions.length > 2 && (
                 <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs px-1.5 py-0.5"> {/* サイズ、padding調整 */}
                   +{photographer.special_conditions.length - 2}
                 </Badge>
               )}
             </div>
           )}


          {/* 料金目安 */}
          {photographer.price_range_min !== undefined && photographer.price_range_max !== undefined && (
            <div className="mt-auto pt-3 border-t border-gray-100"> {/* mt-autoで下寄せ、padding調整 */}
              <p className="text-xs text-gray-500 mb-0.5">料金目安</p> {/* サイズ調整 */}
              <p className="text-base font-bold text-gray-900"> {/* サイズ調整 */}
                ¥{photographer.price_range_min?.toLocaleString()} - ¥{photographer.price_range_max?.toLocaleString()}
              </p>
            </div>
          )}

          {/* ポートフォリオ簡易表示 */}
          {portfolio.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100"> {/* margin, padding調整 */}
              <p className="text-xs text-gray-500 mb-1.5">ポートフォリオ</p> {/* サイズ調整 */}
              <div className="flex gap-1.5 overflow-x-auto"> {/* gap調整 */}
                {portfolio.slice(0, 4).map((item, index) => ( // 4枚表示に
                  <img
                    key={index}
                    src={item.image_url}
                    alt={`Portfolio ${index + 1}`}
                    className="w-12 h-12 object-cover rounded flex-shrink-0 bg-gray-100" // サイズ調整
                    onError={handlePortfolioImageError} // エラーハンドラ
                    loading="lazy"
                  />
                ))}
                {portfolio.length > 4 && (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0"> {/* サイズ調整 */}
                    <span className="text-xs text-gray-600">+{portfolio.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}

           {/* メッセージボタン */}
           <div className="mt-4"> {/* 上部にマージンを追加 */}
               <Button
                 onClick={handleMessageClick}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 shadow-sm hover:shadow transition-all" // py調整、shadow調整
                 size="sm" // ボタンサイズを小さく
                 disabled={!currentUser || currentUser?.user_type !== 'rider' || currentUser?.id === photographer.id} // 送信不可条件を追加
               >
                 <MessageCircle className="w-4 h-4 mr-1.5" /> {/* アイコンサイズ、margin調整 */}
                 メッセージを送る
               </Button>
           </div>

        </CardContent>
      </Card>
    </motion.div>
  );
}