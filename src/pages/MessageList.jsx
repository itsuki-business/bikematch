import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listConversations, getUser } from '@/graphql/queries';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, User as UserIcon } from "lucide-react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";

export default function MessageList() {
  const navigate = useNavigate();
  const { myUserId } = useParams(); // URLパラメータから自分のユーザーIDを取得
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // 現在のユーザーを取得
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoadingUser(true);
      try {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        const userId = cognitoUser.userId;
        setCurrentUser({ userId, attributes });
        setCurrentUserId(userId);
        
        // URLパラメータのmyUserIdが自分のIDと一致しない場合はリダイレクト
        if (myUserId && myUserId !== userId) {
          console.log('URL userId mismatch, redirecting to correct URL');
          navigate(`/messages/${userId}`, { replace: true });
        }
        // URLパラメータがない場合もリダイレクト
        if (!myUserId) {
          console.log('No userId in URL, redirecting with userId');
          navigate(`/messages/${userId}`, { replace: true });
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        navigate('/home-for-non-register');
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, [navigate, myUserId]);

  // 会話一覧を取得
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      try {
        const client = generateClient();
        const result = await client.graphql({
          query: listConversations,
          variables: {
            filter: {
              or: [
                { biker_id: { eq: currentUserId } },
                { photographer_id: { eq: currentUserId } }
              ]
            }
          }
        });
        
        const convs = result.data?.listConversations?.items || [];
        
        // 最終メッセージの日時で降順ソート
        return convs.sort((a, b) => {
          const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
          const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
          return dateB - dateA;
        });
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // エラーが発生しても空配列を返す（会話がない状態として扱う）
        return [];
      }
    },
    enabled: !!currentUserId,
    refetchInterval: 10000 // 10秒ごとに更新
  });

  // 各会話の相手ユーザー情報を取得
  const getOtherUserId = (conversation) => {
    return conversation.biker_id === currentUserId 
      ? conversation.photographer_id 
      : conversation.biker_id;
  };

  const getOtherUserName = (conversation) => {
    return conversation.biker_id === currentUserId 
      ? conversation.photographer_name 
      : conversation.biker_name;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (!isDate(date) || isNaN(date)) return "";
      
      const now = new Date();
      const diffInHours = (now - date) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: ja });
      } else if (diffInHours < 24 * 7) {
        return format(date, 'M月d日', { locale: ja });
      } else {
        return format(date, 'yyyy年M月d日', { locale: ja });
      }
    } catch (error) {
      console.error('Date format error:', error);
      return "";
    }
  };

  if (isLoadingUser || conversationsLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-3 mb-8">
          <MessageSquare className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">メッセージ</h1>
        </div>

        {conversations.length === 0 ? (
          <Card className="shadow-lg border-none">
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">トークルームがありません。</p>
              <p className="text-sm text-gray-400">
                フォトグラファーのプロフィールから「メッセージを送る」で会話を始めましょう
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => {
              const otherUserId = getOtherUserId(conversation);
              const otherUserName = getOtherUserName(conversation);
              
              return (
                <Card
                  key={conversation.id}
                  className="shadow-md border-none hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-[1.01]"
                  onClick={() => navigate(`/messages/${currentUserId}/${otherUserId}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* アバター */}
                      <div className="w-14 h-14 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-7 h-7 text-white" />
                      </div>

                      {/* メッセージ内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherUserName || 'ユーザー'}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatDate(conversation.last_message_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.last_message || 'メッセージを送信'}
                        </p>
                        
                        {conversation.status && (
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                              conversation.status === 'active' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {conversation.status === 'active' ? '進行中' : conversation.status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

