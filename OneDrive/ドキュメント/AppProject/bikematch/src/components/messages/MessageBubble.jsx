import React, { useState, useEffect } from "react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";
// --- Amplify v6 ---
import { getUrl } from 'aws-amplify/storage';
// ---------------
import { Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";

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

export default function MessageBubble({ message, isOwn }) {
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
        if (message.media_key) {
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
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-2`}> {/* Added mb-2 */}
      <div
        className={`relative max-w-[75%] md:max-w-[65%] rounded-xl px-3 py-1.5 shadow-sm text-sm ${ // Adjusted padding and font size
          isOwn
            ? 'bg-red-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        {/* Media Content */}
        {message.media_key && (
            // Apply different styling based on media type
            <div className={`mb-1 relative rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center ${message.media_type === 'image' ? 'max-w-xs' : 'max-w-sm'}`}> {/* Image max width smaller */}
                {isLoadingMedia && (
                    <div className="aspect-video w-full flex items-center justify-center"> {/* Placeholder aspect ratio */}
                        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                )}
                {!isLoadingMedia && hasMediaError && ( // Error state
                     <div className="aspect-video w-full flex flex-col items-center justify-center text-xs text-red-500 p-2 text-center">
                        {message.media_type === 'image' ? <ImageIcon className="w-5 h-5 mx-auto mb-1 text-red-400"/> : <VideoIcon className="w-5 h-5 mx-auto mb-1 text-red-400"/>}
                         メディア表示エラー
                     </div>
                 )}
                {!isLoadingMedia && !hasMediaError && mediaUrl && message.media_type === 'image' && (
                  <img
                    src={mediaUrl}
                    alt="送信画像"
                    className="block max-w-full max-h-[300px] h-auto rounded-lg cursor-pointer" // Max height, allow natural width
                    onClick={() => window.open(mediaUrl, '_blank')} // Open in new tab
                    loading="lazy"
                    onError={() => setHasMediaError(true)} // Handle image load error
                  />
                )}
                {!isLoadingMedia && !hasMediaError && mediaUrl && message.media_type === 'video' && (
                  <video
                    src={mediaUrl}
                    controls
                    className="block max-w-full max-h-[300px] h-auto rounded-lg bg-black" // Max height
                    preload="metadata"
                    onError={() => setHasMediaError(true)} // Handle video load error
                  />
                )}
            </div>
        )}

        {/* Text Content */}
        {message.content && (
          <p className="whitespace-pre-wrap break-words leading-snug">{message.content}</p>
        )}

        {/* Timestamp (only show if there's content or media) */}
        {(message.content || message.media_key) && messageDate && isDate(messageDate) && (
            <p className={`text-[10px] mt-1 text-right ${ // Smaller timestamp
                isOwn ? 'text-red-100 opacity-80' : 'text-gray-400'
            }`}>
              {format(messageDate, "HH:mm", { locale: ja })}
            </p>
        )}
      </div>
    </div>
  );
}