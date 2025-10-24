import React, { useState, useEffect, useRef, useCallback } from "react"; // useCallback をインポート
// --- Amplify v6 ---
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';
// TODO: later migrate to v6 modular
// import { DataStore, Predicates } from '@aws-amplify/datastore'; // DataStoreの場合
// import { Conversation as ConversationModel, Message as MessageModel, User as UserModel } from '@/models'; // DataStoreの場合
// 下記は例です。スキーマに合わせてクエリ/ミューテーション/サブスクリプション名を変更してください
import { getConversation, getUser, messagesByConversationIDAndCreatedAt } from '@/graphql/queries';
import { createMessage, updateConversation } from '@/graphql/mutations';
import { onCreateMessage } from '@/graphql/subscriptions';
// ---------------
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation をインポート
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Send, User as UserIcon, Paperclip, Image as ImageIcon, Video as VideoIcon } from "lucide-react"; // アイコン追加
import { format, isDate } from "date-fns"; // isDate をインポート
import { ja } from "date-fns/locale";
import MessageBubble from "../components/messages/MessageBubble";

export default function ConversationDetail() {
  const navigate = useNavigate();
  const location = useLocation(); // useLocation を使用
  const queryClient = useQueryClient();
  // URLSearchParams を location.search から取得
  const urlParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const conversationId = urlParams.get('id');

  const [user, setUser] = useState(null); // Cognitoユーザー
  const [userId, setUserId] = useState(null); // Cognito Sub (ID)
  const [messageContent, setMessageContent] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaPreview, setMediaPreview] = useState(null); // メディアプレビュー用
   const [mediaFile, setMediaFile] = useState(null); // 送信するメディアファイル用
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null); // ファイル入力への参照

  // --- Get Current User ---
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then(cognitoUser => {
        setUser(cognitoUser);
        setUserId(cognitoUser.attributes.sub);
      })
      .catch(() => {
        console.log("Redirecting to login");
        Auth.federatedSignIn(); // Redirect to login
      });
  }, []);

  // --- Fetch Conversation Details ---
  const { data: conversation, isLoading: conversationLoading, error: conversationError } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async () => {
      if (!conversationId) throw new Error("Conversation ID is missing");
      // --- Amplify API (GraphQL) ---
      const result = await API.graphql(graphqlOperation(getConversation, { id: conversationId }));
      if (!result.data?.getConversation) throw new Error("Conversation not found");
      return result.data.getConversation;
      // -----------------------------
      // --- DataStoreの場合 ---
      // const conv = await DataStore.query(ConversationModel, conversationId);
      // if (!conv) throw new Error("Conversation not found");
      // return conv;
      // --------------------
    },
    enabled: !!conversationId,
    retry: false, // 見つからなければリトライしない
  });

  // --- Fetch Messages ---
  const { data: messages = [], isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
       if (!conversationId) return [];
      // --- Amplify API (GraphQL) ---
       // 既存の生成クエリ: messagesByConversationIDAndCreatedAt を使用
       const result = await API.graphql(graphqlOperation(messagesByConversationIDAndCreatedAt, {
           conversationID: conversationId,
           sortDirection: 'ASC',
       }));
       return result.data?.messagesByConversationIDAndCreatedAt?.items || [];
      // -----------------------------
      // --- DataStoreの場合 ---
      // return await DataStore.query(MessageModel, m => m.conversationId.eq(conversationId), {
      //     sort: s => s.createdAt('ASCENDING')
      // });
      // --------------------
    },
    enabled: !!conversationId, // conversationId があってから実行
  });

   // --- Fetch Other User Details ---
   const otherUserId = React.useMemo(() => {
       if (!conversation || !userId) return null;
       return conversation.biker_id === userId ? conversation.photographer_id : conversation.biker_id;
   }, [conversation, userId]);

   const { data: otherUser, isLoading: otherUserLoading, error: otherUserError } = useQuery({
       queryKey: ['otherUser', otherUserId],
       queryFn: async () => {
           if (!otherUserId) return null;
           // --- Amplify API (GraphQL) ---
           const result = await API.graphql(graphqlOperation(getUser, { id: otherUserId }));
           return result.data?.getUser || null;
           // -----------------------------
           // --- DataStoreの場合 ---
           // return await DataStore.query(UserModel, otherUserId);
           // --------------------
       },
       enabled: !!otherUserId,
       staleTime: 5 * 60 * 1000, // ユーザー情報はキャッシュ長め
   });


  // --- Real-time Message Subscription ---
  useEffect(() => {
      if (!conversationId) return;

      console.log(`Subscribing to messages for conversation: ${conversationId}`);
      // --- Amplify API (GraphQL Subscription) ---
       const subscription = API.graphql(
          graphqlOperation(onCreateMessage, { filter: { conversationID: { eq: conversationId } } })
       ).subscribe({
           next: ({ provider, value }) => {
               console.log('Received message via subscription:', value);
               const newMessage = value.data?.onCreateMessage;
               if (newMessage && newMessage.conversationID === conversationId) { // 念のためID確認
                   // react-query のキャッシュを更新
                   queryClient.setQueryData(['messages', conversationId], (oldMessages = []) => {
                       // 重複を避ける (既にリストにあるかIDで確認)
                       if (oldMessages.some(msg => msg.id === newMessage.id)) {
                           return oldMessages;
                       }
                       // 新しいメッセージを末尾に追加してソート (createdAtで)
                       const updatedMessages = [...oldMessages, newMessage];
                       updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // createdAt フィールド名注意
                       return updatedMessages;
                   });
                   // 新メッセージ受信時に一番下にスクロール
                   setTimeout(scrollToBottom, 100);
               }
           },
           error: (error) => console.error('Subscription error:', error),
       });
      // ------------------------------------

      // --- DataStoreの場合 (Observe) ---
      // const subscription = DataStore.observe(MessageModel, m => m.conversationId.eq(conversationId)).subscribe(msg => {
      //   console.log('Received message via DataStore observe:', msg);
      //   if (msg.opType === 'INSERT') {
      //      queryClient.setQueryData(['messages', conversationId], (oldMessages = []) => {
      //        if (oldMessages.some(m => m.id === msg.element.id)) return oldMessages;
      //        const updated = [...oldMessages, msg.element];
      //        updated.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      //        return updated;
      //      });
      //      setTimeout(scrollToBottom, 100);
      //   }
      // });
      // --------------------------

      // クリーンアップ関数
      return () => {
          console.log(`Unsubscribing from messages for conversation: ${conversationId}`);
          subscription.unsubscribe();
      };
  }, [conversationId, queryClient]); // conversationId が変わったら再購読


  // Scroll to bottom when messages change or component mounts
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = useCallback(() => { // useCallbackでラップ
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []); // 依存配列は空


  // --- Send Message Mutation ---
  const sendMessageMutation = useMutation({
     mutationFn: async ({ content, mediaKey, mediaType }) => {
       if (!userId || !conversationId) throw new Error("User or Conversation ID missing");
       if (!content && !mediaKey) throw new Error("Cannot send empty message"); // 空メッセージは送らない

       // 1. Create Message in DB
       const messageInput = {
         content: content || null, // 空文字列はnullに
         media_key: mediaKey || null, // S3 Key
         media_type: mediaType || null,
         sender_id: userId,
         conversationID: conversationId, // スキーマのフィールド名に合わせる
         is_read: false,
         // createdAt, updatedAt は AppSync/DataStore が自動付与する想定
       };
       console.log("Sending message input:", messageInput);
       // --- Amplify API (GraphQL) ---
       const createMessageResult = await API.graphql(graphqlOperation(createMessage, { input: messageInput }));
       const createdMessage = createMessageResult.data?.createMessage;
       if (!createdMessage) throw new Error("Failed to create message");
       // -----------------------------
       // --- DataStoreの場合 ---
       // const createdMessage = await DataStore.save(new MessageModel(messageInput));
       // --------------------

       // 2. Update Conversation's last message details
       const lastMessageText = content || (mediaKey ? (mediaType === 'image' ? '画像を送信しました' : '動画を送信しました') : '');
       const conversationInput = {
           id: conversationId,
           last_message: lastMessageText,
           last_message_at: new Date().toISOString()
       };
       // --- Amplify API (GraphQL) ---
       await API.graphql(graphqlOperation(updateConversation, { input: conversationInput }));
       // -----------------------------
       // --- DataStoreの場合 ---
       // const originalConv = await DataStore.query(ConversationModel, conversationId);
       // if (originalConv) {
       //     await DataStore.save(ConversationModel.copyOf(originalConv, updated => {
       //         updated.last_message = lastMessageText;
       //         updated.last_message_at = conversationInput.last_message_at;
       //     }));
       // }
       // --------------------

       return createdMessage; // 作成されたメッセージを返す
     },
     onSuccess: (createdMessage) => {
       setMessageContent(""); // Clear text input
       setMediaFile(null); // Clear media file state
       setMediaPreview(null); // Clear media preview
       // Subscriptionがキャッシュを更新するはずなので、ここではinvalidateしないことが多い
       // queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
       // queryClient.invalidateQueries({ queryKey: ['conversations', userId] }); // 会話リストも更新
       setTimeout(scrollToBottom, 100); // Ensure scroll after potential re-render
     },
     onError: (error) => {
       console.error("Message sending failed:", error);
       alert(`メッセージの送信に失敗しました: ${error.message || '不明なエラー'}`);
       setUploadingMedia(false); // エラー時はアップロード状態を解除
     }
   });

  // --- Handle Media Selection ---
   const handleMediaSelect = (e) => {
       const file = e.target.files?.[0];
       if (!file) {
           setMediaFile(null);
           setMediaPreview(null);
           return;
       }
       // Basic validation (can be more robust)
       const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'];
        if (!allowedTypes.includes(file.type)) {
            alert('対応していないファイル形式です。画像または動画を選択してください。');
            e.target.value = ''; // Reset input
            return;
        }
        if (file.size > 25 * 1024 * 1024) { // Example: 25MB limit
            alert('ファイルサイズが大きすぎます (最大25MB)。');
            e.target.value = ''; // Reset input
            return;
        }


       setMediaFile(file); // Store the file object

       // Generate preview URL
       const reader = new FileReader();
       reader.onloadend = () => {
           setMediaPreview({
               url: reader.result, // Data URL for preview
               type: file.type.startsWith('image/') ? 'image' : 'video'
           });
       };
       reader.readAsDataURL(file);
       e.target.value = ''; // Reset input for next selection
   };

    // --- Handle Sending (Text or Media) ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!messageContent.trim() && !mediaFile) || sendMessageMutation.isPending || uploadingMedia) {
            return; // Don't send if empty, already sending, or uploading
        }

        let mediaKey = null;
        let mediaType = null;

        // 1. Upload media if present
        if (mediaFile) {
            setUploadingMedia(true);
            try {
                const timestamp = Date.now();
                // Construct a unique key for S3
                const fileExtension = mediaFile.name.split('.').pop() || '';
                const fileName = `chat-media/${conversationId}/${userId}-${timestamp}.${fileExtension}`;

                // --- Amplify Storage ---
                const result = await Storage.put(fileName, mediaFile, {
                    contentType: mediaFile.type,
                    // level: 'protected', // Consider access level 'protected' or 'private'
                });
                console.log("Media uploaded:", result);
                mediaKey = result.key;
                mediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
                // --------------------

            } catch (error) {
                console.error("Error uploading media:", error);
                alert(`メディアのアップロードに失敗しました: ${error.message}`);
                setUploadingMedia(false);
                return; // Stop message sending if upload fails
            } finally {
                setUploadingMedia(false); // Set to false after upload attempt
            }
        }

        // 2. Send message (with or without media key)
        sendMessageMutation.mutate({
            content: messageContent.trim(),
            mediaKey: mediaKey,
            mediaType: mediaType,
        });
    };

    // Remove selected media
    const removeMedia = () => {
        setMediaFile(null);
        setMediaPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the file input visually
        }
    };


  // --- Render Logic ---

   const isLoading = conversationLoading || messagesLoading || otherUserLoading || !user;

  // Show loading skeleton if data is not ready
  if (isLoading && !conversationError && !messagesError && !otherUserError) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }

  // Show error message if fetching failed
   if (conversationError || messagesError || otherUserError || !userId) {
     return (
       <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
         <div className="text-center p-8">
           <p className="text-xl text-red-600 mb-4">エラー</p>
           <p className="text-gray-600 mb-6">
             {conversationError?.message || messagesError?.message || otherUserError?.message || 'データの読み込みに失敗しました。'}
           </p>
           <Button onClick={() => navigate(createPageUrl("Messages"))}>
             メッセージ一覧へ戻る
           </Button>
         </div>
       </div>
     );
   }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col h-screen">
       {/* Header */}
      <div className="flex-shrink-0 bg-white border-b sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
              <Button
                  variant="ghost"
                  onClick={() => navigate(createPageUrl("Messages"))}
                  className="pl-0"
              >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  一覧へ
              </Button>
               {/* Other User Info in Header */}
               <div className="flex items-center gap-3">
                   <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                       {otherUser?.profile_image ? (
                           // TODO: Use Storage.get() for URL
                           <img src={otherUser.profile_image_url || `https://via.placeholder.com/36?text=${otherUser.nickname?.[0] || '?'}`} alt={otherUser.nickname} className="w-full h-full object-cover" />
                       ) : (
                           <UserIcon className="w-5 h-5 text-gray-500" />
                       )}
                   </div>
                   <span className="font-semibold text-gray-800 truncate">
                       {otherUser?.nickname || "Unknown User"}
                   </span>
               </div>
               {/* Placeholder for potential actions (e.g., call, info) */}
               <div></div>
          </div>
      </div>

       {/* Message List Area */}
       <div className="flex-grow overflow-y-auto mb-4 max-w-4xl mx-auto w-full px-4 md:px-8">
         <div className="space-y-4 py-4">
           {messages.map((message) => (
             <MessageBubble
               key={message.id} // GraphQL ID
               message={message}
               isOwn={message.sender_id === userId}
               // Pass media URL fetching function if needed
               // getMediaUrl={async (key) => key ? await Storage.get(key) : null}
             />
           ))}
           {/* Scroll anchor */}
           <div ref={messagesEndRef} />
         </div>
       </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 sticky bottom-0 pb-safe"> {/* pb-safe for iOS */}
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-3">
               {/* Media Preview */}
               {mediaPreview && (
                   <div className="mb-2 relative w-24 h-24 p-1 border rounded-md bg-gray-100">
                       {mediaPreview.type === 'image' && (
                           <img src={mediaPreview.url} alt="Preview" className="w-full h-full object-contain rounded" />
                       )}
                       {mediaPreview.type === 'video' && (
                           <div className="w-full h-full flex items-center justify-center">
                               <VideoIcon className="w-8 h-8 text-gray-500" />
                           </div>
                       )}
                       <Button
                           type="button"
                           variant="ghost"
                           size="icon"
                           className="absolute -top-2 -right-2 w-6 h-6 bg-gray-700 text-white rounded-full hover:bg-red-600"
                           onClick={removeMedia}
                           aria-label="Remove media"
                       >
                           <X className="w-4 h-4" />
                       </Button>
                   </div>
               )}

              {/* Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  {/* Attach Button */}
                  <Button
                      type="button"
                      variant="ghost" // Use ghost for less emphasis
                      size="icon"
                      disabled={uploadingMedia || sendMessageMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-gray-500 hover:text-red-600 flex-shrink-0"
                      aria-label="Attach media"
                  >
                      <Paperclip className="w-5 h-5" />
                  </Button>
                  <input
                      ref={fileInputRef}
                      id="media-upload" // Keep ID for potential label usage
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaSelect}
                      className="hidden"
                      disabled={uploadingMedia || sendMessageMutation.isPending}
                  />

                  {/* Textarea */}
                  <Textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={uploadingMedia ? "アップロード中..." : "メッセージを入力..."}
                      rows={1}
                      className="flex-grow resize-none max-h-32 overflow-y-auto bg-gray-100 rounded-lg border-transparent focus:border-transparent focus:ring-1 focus:ring-red-500 focus:ring-offset-0 px-3 py-2 text-sm" // Adjusted styles
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                          }
                      }}
                      disabled={uploadingMedia || sendMessageMutation.isPending}
                      onInput={(e) => { // Auto-resize based on content
                          e.target.style.height = 'auto';
                          e.target.style.height = `${e.target.scrollHeight}px`;
                      }}
                  />

                  {/* Send Button */}
                  <Button
                      type="submit"
                      disabled={(!messageContent.trim() && !mediaFile) || sendMessageMutation.isPending || uploadingMedia}
                      className="bg-red-600 hover:bg-red-700 rounded-lg flex-shrink-0" // Adjusted styles
                      aria-label="Send message"
                      size="icon"
                  >
                       {/* Show spinner when sending */}
                       {sendMessageMutation.isPending ? (
                           <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                       ) : (
                           <Send className="w-5 h-5" />
                       )}
                  </Button>
              </form>
          </div>
      </div>
    </div>
  );
}