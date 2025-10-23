import React, { useState, useEffect } from "react";
// --- Amplify (v6 modular) ---
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
// import { DataStore } from '@aws-amplify/datastore';
// import { Conversation as ConversationModel, User as UserModel } from '@/models'; // DataStoreの場合
// GraphQL operations
import { listConversations, getUser } from '@/graphql/queries';
// ---------------
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // 未使用のためコメントアウト
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, User as UserIcon, AlertCircle } from "lucide-react";
import { format, isDate } from "date-fns"; // isDate をインポート
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Cognitoユーザー情報
  const [userId, setUserId] = useState(null); // Cognito Sub (ID)
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- Get Current User ---
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const current = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        // fetchUserAttributes で詳細属性を取ることも可能
        setUser({ attributes: { sub: current.userId, ...attributes } });
        setUserId(current.userId);
      } catch (error) {
        console.log('Not signed in', error);
        setUser(null);
        setUserId(null);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // --- Fetch Conversations ---
  // listConversationsForUser クエリは、biker_id または photographer_id が currentUser の ID に一致するものを取得するように
  // バックエンド (GraphQLスキーマ + リゾルバ or @index/@connection) で定義する必要があります。
  const { data: conversations = [], isLoading: isLoadingConversations } = useQuery({
    queryKey: ['conversations', userId], // ユーザーIDをキーに含める
    queryFn: async () => {
      if (!userId) return []; // ユーザーIDがなければ空配列

      try {
        // --- Amplify API (GraphQL) ---
        const client = generateClient();
        const result = await client.graphql({
          query: listConversations,
          variables: { filter: { or: [ { biker_id: { eq: userId } }, { photographer_id: { eq: userId } } ] } }
        });
        const fetchedConversations = result.data?.listConversations?.items || [];

         // last_message_at でソート (nullチェック追加)
          fetchedConversations.sort((a, b) => {
              const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(a.createdAt || 0); // createdAt fallback
              const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(b.createdAt || 0);
              return dateB - dateA;
          });

         return fetchedConversations;
        // -----------------------------

        // --- DataStoreの場合 (よりシンプル) ---
        // const userConversations = await DataStore.query(ConversationModel, c => c.or(
        //     q => [
        //         q.biker_id.eq(userId),
        //         q.photographer_id.eq(userId)
        //     ]
        // ), {
        //     sort: s => s.last_message_at('DESCENDING') // DataStore v6 style
        // });
        // return userConversations;
        // --------------------

      } catch (error) {
        console.error("Error fetching conversations:", error);
         if (error.errors) {
             error.errors.forEach(err => console.error("GraphQL Error:", err.message, err));
         }
        return [];
      }
    },
    enabled: !!userId, // ユーザーIDが取得できてから実行
    refetchInterval: 30000, // 30秒ごとにポーリング (DataStoreなら不要かも)
    refetchOnWindowFocus: true, // フォーカス時に再取得
  });

  // --- Fetch User Details for Conversation Partners ---
  // conversations が取得できたら、相手のユーザーIDを抽出し、それらのユーザー情報を取得
  const otherUserIds = React.useMemo(() => {
    if (!userId || !conversations.length) return [];
    const ids = conversations.map(conv =>
      conv.biker_id === userId ? conv.photographer_id : conv.biker_id
    );
    return [...new Set(ids)]; // 重複を除外
  }, [conversations, userId]);

  // react-queryを使って相手ユーザー情報を効率的に取得 (個別に or バッチで)
  // ここでは簡単な例として個別に取得 (多数の会話がある場合はバッチ取得を検討)
  const otherUsersData = useQuery({
      queryKey: ['otherUsers', otherUserIds],
      queryFn: async () => {
          if (!otherUserIds.length) return {};
          const usersMap = {};
          // Promise.allで並行して取得
          await Promise.all(otherUserIds.map(async (id) => {
              try {
                  const client = generateClient();
                  const result = await client.graphql({ query: getUser, variables: { id } });
                  if (result.data?.getUser) {
                      usersMap[id] = result.data.getUser;
                  }
              } catch (error) {
                  console.error(`Error fetching user ${id}:`, error);
              }
          }));
          return usersMap;
      },
      enabled: otherUserIds.length > 0,
      staleTime: 5 * 60 * 1000, // ユーザー情報は少し長めにキャッシュ
  });

  const getOtherUser = (conversation) => {
    if (!userId || !otherUsersData.data) return null;
    const otherId = conversation.biker_id === userId
      ? conversation.photographer_id
      : conversation.biker_id;
    return otherUsersData.data[otherId] || null; // キャッシュから取得
  };

  // --- Render Logic ---

  if (isLoadingUser || (userId && isLoadingConversations)) {
    // ローディング中のスケルトン表示
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ログインしていない場合 (useEffectでリダイレクトされるはずだが念のため)
  if (!user) {
       return (
           <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 text-center">
               <p>このページを表示するにはログインが必要です。</p>
               {/* Login button or redirect logic */}
           </div>
       );
   }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">メッセージ</h1>

        {/* フォトグラファーで会話がない場合のアラート (ユーザータイプは Cognito attributes or App DB から取得) */}
        {user.attributes?.['custom:user_type'] === 'photographer' && conversations.length === 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
             <AlertCircle className="h-4 w-4 text-blue-600" />
             <AlertDescription className="text-blue-900">
               ライダーからの依頼をお待ちください。
               プロフィールを充実させると、より多くの依頼が来る可能性が高まります。
             </AlertDescription>
          </Alert>
        )}

        {conversations.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-500">メッセージがありません</p>
              {/* ライダーの場合の案内 (ユーザータイプ判定を修正) */}
              {user.attributes?.['custom:user_type'] === 'rider' && (
                <p className="text-sm text-gray-400 mt-2">
                  気になるフォトグラファーにメッセージを送ってみましょう
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation, index) => {
              const otherUser = getOtherUser(conversation);
               const lastMessageDate = conversation.last_message_at ? new Date(conversation.last_message_at) : null;


              return (
                <motion.div
                  key={conversation.id} // GraphQL の ID を使用
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }} // delay を短く
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border rounded-lg overflow-hidden" // style調整
                    onClick={() => navigate(createPageUrl("ConversationDetail") + `?id=${conversation.id}`)}
                  >
                    <CardContent className="p-4 flex items-center gap-4"> {/* Padding調整 */}
                       {/* Avatar */}
                       <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                         {otherUser?.profile_image ? (
                           // TODO: Storage.get() でURLを取得する必要がある
                           <img
                             src={otherUser.profile_image_url || `https://via.placeholder.com/48?text=${otherUser.nickname?.[0] || '?'}`} // 仮のURL or Placeholder
                             alt={otherUser.nickname || 'アバター'}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <UserIcon className="w-6 h-6 text-gray-500" />
                         )}
                       </div>

                       {/* Info */}
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-start mb-0.5">
                           <h3 className="font-semibold text-base text-gray-800 truncate mr-2"> {/* サイズ調整 */}
                             {otherUser?.nickname || "読み込み中..."} {/* ローディング表示 */}
                           </h3>
                           {/* 最終メッセージ日時 */}
                           {lastMessageDate && isDate(lastMessageDate) && ( // isDateでチェック
                             <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                               {format(lastMessageDate, "MM/dd HH:mm", { locale: ja })}
                             </span>
                           )}
                         </div>
                         <p className="text-sm text-gray-500 truncate">
                            {conversation.last_message || "まだメッセージはありません"} {/* 最終メッセージ表示 */}
                         </p>
                       </div>

                       {/* Unread Indicator (Optional) */}
                       {/* {conversation.unreadCount > 0 && (
                         <div className="w-3 h-3 bg-red-500 rounded-full ml-2 flex-shrink-0"></div>
                       )} */}

                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}