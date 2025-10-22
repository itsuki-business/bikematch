import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, User as UserIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Messages() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(createPageUrl("Messages"));
    });
  }, []);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const allConversations = await base44.entities.Conversation.list();
      return allConversations.filter(
        conv => conv.biker_id === user.id || conv.photographer_id === user.id
      ).sort((a, b) => new Date(b.last_message_at || b.created_date) - new Date(a.last_message_at || a.created_date));
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const getOtherUser = (conversation) => {
    const otherId = conversation.biker_id === user?.id 
      ? conversation.photographer_id 
      : conversation.biker_id;
    return users.find(u => u.id === otherId);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">メッセージ</h1>
        <div className="space-y-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">メッセージ</h1>

        {user && user.user_type === 'photographer' && conversations.length === 0 && (
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
              {user?.user_type === 'rider' && (
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
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-xl transition-shadow duration-300 border-none shadow-md"
                    onClick={() => navigate(createPageUrl("ConversationDetail") + `?id=${conversation.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                            {otherUser?.profile_image ? (
                              <img
                                src={otherUser.profile_image}
                                alt={otherUser.nickname}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-7 h-7 text-gray-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                              {otherUser?.nickname || "名前未設定"}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {otherUser?.user_type === 'photographer' ? 'フォトグラファー' : 'ライダー'}
                              {otherUser?.prefecture && ` • ${otherUser.prefecture}`}
                            </p>
                            {conversation.last_message_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(conversation.last_message_at), "MM月dd日 HH:mm", { locale: ja })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
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