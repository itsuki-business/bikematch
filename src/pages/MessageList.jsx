import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import mockAPIService from '@/services/mockAPIService';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listConversations, getUser } from '@/graphql/queries';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, User as UserIcon, Clock, ArrowRight } from "lucide-react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

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
        let cognitoUser, attributes;
        if (useMock) {
          cognitoUser = await mockAuthService.getCurrentUser();
          attributes = await mockAuthService.fetchUserAttributes();
        } else {
          cognitoUser = await getCurrentUser();
          attributes = await fetchUserAttributes();
        }
        
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
        if (useMock) {
          // Mock環境では空の配列を返す（会話がない状態）
          return [];
        } else {
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
            },
            authMode: 'userPool' // Cognito User Pools認証を使用
          });
          
          const convs = result.data?.listConversations?.items || [];
          
          // 最終メッセージの日時で降順ソート
          return convs.sort((a, b) => {
            const dateA = a.last_message_at ? new Date(a.last_message_at) : new Date(0);
            const dateB = b.last_message_at ? new Date(b.last_message_at) : new Date(0);
            return dateB - dateA;
          });
        }
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
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">メッセージ</h1>
            <p className="text-gray-600">フォトグラファーとの会話を管理</p>
          </div>
        </motion.div>

        {conversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">メッセージがありません</h3>
                <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">
                  まだ会話が始まっていません。<br />
                  フォトグラファーのプロフィールから「メッセージを送る」で会話を始めましょう。
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/home-for-register')}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    フォトグラファーを探す
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {conversations.map((conversation, index) => {
              const otherUserId = getOtherUserId(conversation);
              const otherUserName = getOtherUserName(conversation);
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="shadow-lg border-none hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-[1.02] rounded-2xl overflow-hidden"
                    onClick={() => navigate(`/messages/${currentUserId}/${otherUserId}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        {/* アバター */}
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                          {otherUserName ? otherUserName.charAt(0) : 'U'}
                        </div>

                        {/* メッセージ内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-semibold text-gray-900 text-lg truncate">
                                {otherUserName || 'ユーザー'}
                              </h3>
                              <Badge variant="secondary" className="text-xs">
                                {conversation.biker_id === currentUserId ? 'フォトグラファー' : 'ライダー'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(conversation.last_message_at)}</span>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 truncate mb-2">
                            {conversation.last_message || 'メッセージを送信'}
                          </p>
                          
                          {conversation.status && (
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                conversation.status === 'active' 
                                  ? 'bg-green-500' 
                                  : 'bg-gray-400'
                              }`} />
                              <span className="text-xs text-gray-500">
                                {conversation.status === 'active' ? 'アクティブ' : conversation.status}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 矢印アイコン */}
                        <div className="text-gray-400">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}

