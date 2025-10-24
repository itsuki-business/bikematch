import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import mockAPIService from '@/services/mockAPIService';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { listConversations, getUser, messagesByConversationIDAndCreatedAt } from '@/graphql/queries';
import { createConversation, createMessage, updateConversation } from '@/graphql/mutations';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, User, MapPin, Camera } from "lucide-react";
import MessageBubble from "../components/messages/MessageBubble";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

export default function UserMessage() {
  const navigate = useNavigate();
  const { myUserId, otherUserId } = useParams(); // 自分と相手のユーザーID
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef(null);

  // 現在のユーザーを取得
  useEffect(() => {
    const fetchUser = async () => {
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
          navigate(`/messages/${userId}/${otherUserId}`, { replace: true });
        }
      } catch (error) {
        console.error('Not authenticated:', error);
        navigate('/home-for-register');
      }
    };
    fetchUser();
  }, [navigate, myUserId, otherUserId]);

  // 相手のユーザー情報を取得
  const { data: targetUser, isLoading: targetUserLoading } = useQuery({
    queryKey: ['user', otherUserId],
    queryFn: async () => {
      if (useMock) {
        // Mock環境ではダミーユーザー情報を返す
        return {
          id: otherUserId,
          nickname: 'サンプルユーザー',
          prefecture: '東京都',
          user_type: 'photographer',
          bio: 'バイク撮影を専門としています。'
        };
      } else {
        const client = generateClient();
        const result = await client.graphql({
          query: getUser,
          variables: { id: otherUserId },
          authMode: 'userPool' // Cognito User Pools認証を使用
        });
        return result.data.getUser;
      }
    },
    enabled: !!otherUserId
  });

  // 既存の会話を検索
  const { data: existingConversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', currentUserId, otherUserId],
    queryFn: async () => {
      if (!currentUserId || !otherUserId) return null;
      
      if (useMock) {
        // Mock環境では会話なしとして扱う
        return null;
      } else {
        const client = generateClient();
        const result = await client.graphql({
          query: listConversations,
          variables: {
            filter: {
              or: [
                { and: [{ biker_id: { eq: currentUserId } }, { photographer_id: { eq: otherUserId } }] },
                { and: [{ biker_id: { eq: otherUserId } }, { photographer_id: { eq: currentUserId } }] }
              ]
            }
          },
          authMode: 'userPool' // Cognito User Pools認証を使用
        });
        
        const conversations = result.data?.listConversations?.items || [];
        return conversations.length > 0 ? conversations[0] : null;
      }
    },
    enabled: !!currentUserId && !!otherUserId
  });

  // メッセージ一覧を取得
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', existingConversation?.id],
    queryFn: async () => {
      if (!existingConversation) return [];
      
      if (useMock) {
        // Mock環境では空の配列を返す
        return [];
      } else {
        const client = generateClient();
        const result = await client.graphql({
          query: messagesByConversationIDAndCreatedAt,
          variables: {
            conversationID: existingConversation.id,
            sortDirection: 'ASC'
          },
          authMode: 'userPool' // Cognito User Pools認証を使用
        });
        
        return result.data?.messagesByConversationIDAndCreatedAt?.items || [];
      }
    },
    enabled: !!existingConversation,
    refetchInterval: 5000 // 5秒ごとに更新
  });

  // 会話作成ミューテーション
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const client = generateClient();
      
      // ユーザータイプを判定して適切なIDを割り当て
      const isBiker = currentUser?.attributes?.['custom:user_type'] === 'rider';
      
      const conversationData = {
        biker_id: isBiker ? currentUserId : otherUserId,
        photographer_id: isBiker ? otherUserId : currentUserId,
        biker_name: isBiker ? (currentUser.attributes.name || currentUser.attributes.email) : (targetUser?.nickname || 'ユーザー'),
        photographer_name: isBiker ? (targetUser?.nickname || 'ユーザー') : (currentUser.attributes.name || currentUser.attributes.email),
        last_message: "",
        last_message_at: new Date().toISOString(),
        status: "active"
      };
      
      const result = await client.graphql({
        query: createConversation,
        variables: { input: conversationData },
        authMode: 'userPool' // Cognito User Pools認証を使用
      });
      
      return result.data.createConversation;
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries(['conversation', currentUserId, otherUserId]);
    }
  });

  // メッセージ送信ミューテーション
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      const client = generateClient();
      
      // 会話がなければ作成
      let conversationId = existingConversation?.id;
      if (!conversationId) {
        const newConversation = await createConversationMutation.mutateAsync();
        conversationId = newConversation.id;
      }
      
      // メッセージを作成
      const messageInput = {
        conversationID: conversationId,
        sender_id: currentUserId,
        content: messageData.content,
        is_read: false,
        createdAt: new Date().toISOString()
      };
      
      const result = await client.graphql({
        query: createMessage,
        variables: { input: messageInput },
        authMode: 'userPool' // Cognito User Pools認証を使用
      });
      
      // 会話の最終メッセージを更新
      await client.graphql({
        query: updateConversation,
        variables: {
          input: {
            id: conversationId,
            last_message: messageData.content,
            last_message_at: new Date().toISOString()
          }
        },
        authMode: 'userPool' // Cognito User Pools認証を使用
      });
      
      return result.data.createMessage;
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries(['messages', existingConversation?.id]);
      queryClient.invalidateQueries(['conversations', currentUserId]);
    }
  });

  // メッセージ送信ハンドラー
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    
    await sendMessageMutation.mutateAsync({ content: messageContent.trim() });
  };

  // 最新メッセージまでスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!currentUserId || targetUserLoading || conversationLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-10 w-1/3 mb-8" />
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 text-center">
        <p className="text-red-600 mb-4">ユーザーが見つかりません</p>
        <Button onClick={() => navigate(currentUserId ? `/messages/${currentUserId}` : '/home-for-register')}>
          {currentUserId ? 'メッセージ一覧に戻る' : 'ホームに戻る'}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* ヘッダー */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/messages/${currentUserId}`)}
            className="hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
              {targetUser?.nickname ? targetUser.nickname.charAt(0) : 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {targetUser?.nickname || 'ユーザー'}
                </h1>
                <Badge variant={targetUser?.user_type === 'photographer' ? 'default' : 'secondary'}>
                  {targetUser?.user_type === 'photographer' ? 'フォトグラファー' : 'ライダー'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{targetUser?.prefecture || '未設定'}</span>
                </div>
                {targetUser?.user_type === 'photographer' && (
                  <div className="flex items-center gap-1">
                    <Camera className="w-4 h-4" />
                    <span>撮影可能</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* メッセージエリア */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-xl border-none rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messagesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-gray-500">読み込み中...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">まだメッセージはありません</h3>
                      <p className="text-gray-600">最初のメッセージを送信してみましょう</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <MessageBubble
                          message={message}
                          isOwnMessage={message.sender_id === currentUserId}
                        />
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* メッセージ入力フォーム */}
              <div className="p-6 bg-white border-t">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="メッセージを入力..."
                    className="flex-1 resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    type="submit"
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg"
                  >
                    {sendMessageMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

