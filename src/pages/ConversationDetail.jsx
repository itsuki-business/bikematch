import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, User as UserIcon, Paperclip } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

import MessageBubble from "../components/messages/MessageBubble";

export default function ConversationDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const conversationId = urlParams.get('id');
  
  const [user, setUser] = useState(null);
  const [messageContent, setMessageContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: conversation, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      const conversations = await base44.entities.Conversation.list();
      return conversations.find(c => c.id === conversationId);
    },
    enabled: !!conversationId,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => base44.entities.Message.filter({ conversation_id: conversationId }, 'created_date'),
    enabled: !!conversationId,
    initialData: [],
    refetchInterval: 5000,
  });

  const { data: otherUser } = useQuery({
    queryKey: ['otherUser', conversation?.biker_id, conversation?.photographer_id, user?.id],
    queryFn: async () => {
      if (!conversation || !user) return null;
      const otherId = conversation.biker_id === user.id 
        ? conversation.photographer_id 
        : conversation.biker_id;
      const users = await base44.entities.User.list();
      return users.find(u => u.id === otherId);
    },
    enabled: !!conversation && !!user,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, media_url, media_type }) => {
      await base44.entities.Message.create({
        conversation_id: conversationId,
        sender_id: user.id,
        content,
        media_url,
        media_type,
        is_read: false
      });
      await base44.entities.Conversation.update(conversationId, {
        last_message_at: new Date().toISOString(),
        last_message: content || '画像・動画を送信しました'
      });
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries(['messages', conversationId]);
      queryClient.invalidateQueries(['conversation', conversationId]);
    },
  });


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageContent.trim()) return;
    sendMessageMutation.mutate({ content: messageContent });
  };

  const handleMediaUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
    if (!fileType) {
      alert('画像または動画ファイルを選択してください');
      return;
    }

    setUploadingMedia(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await sendMessageMutation.mutateAsync({
        content: messageContent || '',
        media_url: file_url,
        media_type: fileType
      });
      setMessageContent('');
    } catch (error) {
      console.error('Media upload failed:', error);
      alert('アップロードに失敗しました');
    } finally {
      setUploadingMedia(false);
    }
  };


  if (conversationLoading || messagesLoading || !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Messages"))}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          戻る
        </Button>

        <Card className="mb-6 shadow-lg border-none">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  {otherUser?.profile_image ? (
                    <img
                      src={otherUser.profile_image}
                      alt={otherUser.nickname}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-xl">{otherUser?.nickname || "名前未設定"}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {otherUser?.user_type === 'photographer' ? 'フォトグラファー' : 'ライダー'}
                  </p>
                </div>
              </div>

            </div>
          </CardHeader>
        </Card>

        <Card className="mb-6 shadow-lg border-none">
          <CardContent className="p-6">
            <div className="h-96 overflow-y-auto mb-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  最初のメッセージを送信してください
                </div>
              ) : (
                messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.sender_id === user.id}
                  />
                ))
              )}
            </div>

            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex gap-3">
                <Textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="メッセージを入力..."
                  rows={2}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    type="submit"
                    disabled={!messageContent.trim() || sendMessageMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingMedia}
                    onClick={() => document.getElementById('media-upload').click()}
                    className="border-gray-300"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                className="hidden"
              />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}