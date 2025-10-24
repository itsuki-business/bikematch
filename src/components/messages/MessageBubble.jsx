import React, { useState, useEffect } from "react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";
import { useMock } from '@/config/environment';
import { getUrl } from 'aws-amplify/storage';
import { Image as ImageIcon, Video as VideoIcon, Loader2, Clock } from "lucide-react";
import { motion } from "framer-motion";

// S3 URL取得ヘルパー (共通化推奨)
const s3UrlCacheBubble = new Map();
const getMediaUrl = async (key) => {
    // キーが存在しない、または無効な場合は null を返す
    if (!key || typeof key !== 'string' || key.trim() === '') return null;
    if (s3UrlCacheBubble.has(key)) return s3UrlCacheBubble.get(key);
    try {
        // Storage.get の level は Amplify Storage の設定 (public/protected/private) に合わせる
        // protected や private の場合は identityId が必要になる可能性あり
        const url = await getUrl({ key });
        s3UrlCacheBubble.set(key, url.url.toString()); // 取得成功時にキャッシュ
        return url.url.toString();
    } catch (error) {
        console.error(`Error getting media URL for key ${key}:`, error);
        return null; // エラー時も null を返す
    }
};

export default function MessageBubble({ message, isOwnMessage }) {
    const [mediaUrl, setMediaUrl] = useState(null);
    const [isLoadingMedia, setIsLoadingMedia] = useState(false);
    const [hasMediaError, setHasMediaError] = useState(false); // エラー状態を追加

    // Fetch media URL when message.media_key changes
    useEffect(() => {
        let isMounted = true;
        setMediaUrl(null); // Reset URL on message change
        setHasMediaError(false); // Reset error state
        setIsLoadingMedia(false); // Reset loading state

        // media_key が存在する場合のみURL取得を試みる
        if (message.media_key && !useMock) {
            setIsLoadingMedia(true);
            getMediaUrl(message.media_key).then(url => {
                 if (isMounted) {
                    if (url) {
                        setMediaUrl(url);
                        setHasMediaError(false);
                    } else {
                        // URL取得に失敗した場合
                        setHasMediaError(true);
                    }
                 }
            }).finally(() => {
                 if (isMounted) {
                    setIsLoadingMedia(false);
                 }
            });
        }

        return () => { isMounted = false; }; // Cleanup function
    }, [message.media_key]); // Depend only on media_key

    // Use createdAt field from Amplify (or created_date if using older mock)
    const messageDate = message.createdAt || message.created_date ? new Date(message.createdAt || message.created_date) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`relative max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-lg ${
          isOwnMessage
            ? 'bg-gradient-to-br from-red-500 to-red-600 text-white rounded-br-md'
            : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
        }`}
      >
        {/* Media Content */}
        {message.media_key && !useMock && (
            <div className={`mb-2 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center ${message.media_type === 'image' ? 'max-w-xs' : 'max-w-sm'}`}>
                {isLoadingMedia && (
                    <div className="aspect-video w-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                )}
                {!isLoadingMedia && hasMediaError && (
                     <div className="aspect-video w-full flex flex-col items-center justify-center text-xs text-red-500 p-2 text-center">
                        {message.media_type === 'image' ? <ImageIcon className="w-5 h-5 mx-auto mb-1 text-red-400"/> : <VideoIcon className="w-5 h-5 mx-auto mb-1 text-red-400"/>}
                         メディア表示エラー
                     </div>
                 )}
                {!isLoadingMedia && !hasMediaError && mediaUrl && message.media_type === 'image' && (
                  <img
                    src={mediaUrl}
                    alt="送信画像"
                    className="block max-w-full max-h-[300px] h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => window.open(mediaUrl, '_blank')}
                    loading="lazy"
                    onError={() => setHasMediaError(true)}
                  />
                )}
                {!isLoadingMedia && !hasMediaError && mediaUrl && message.media_type === 'video' && (
                  <video
                    src={mediaUrl}
                    controls
                    className="block max-w-full max-h-[300px] h-auto rounded-lg bg-black"
                    preload="metadata"
                    onError={() => setHasMediaError(true)}
                  />
                )}
            </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-relaxed text-sm">
            {message.content}
          </p>
        )}

        {/* Timestamp */}
        {(message.content || message.media_key) && messageDate && isDate(messageDate) && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
                isOwnMessage ? 'text-red-100 opacity-80 justify-end' : 'text-gray-400 justify-start'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{format(messageDate, "HH:mm", { locale: ja })}</span>
            </div>
        )}
      </div>
    </motion.div>
  );
}