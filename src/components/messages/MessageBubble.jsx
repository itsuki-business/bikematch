import React from "react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isOwn
            ? 'bg-red-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-900 rounded-bl-sm'
        }`}
      >
        {message.media_url && message.media_type === 'image' && (
          <img
            src={message.media_url}
            alt="送信画像"
            className="rounded-lg mb-2 max-w-full"
            style={{ maxHeight: '300px' }}
          />
        )}
        {message.media_url && message.media_type === 'video' && (
          <video
            src={message.media_url}
            controls
            className="rounded-lg mb-2 max-w-full"
            style={{ maxHeight: '300px' }}
          />
        )}
        {message.content && (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
        <p className={`text-xs mt-1 ${isOwn ? 'text-red-100' : 'text-gray-500'}`}>
          {format(new Date(message.created_date), "HH:mm", { locale: ja })}
        </p>
      </div>
    </div>
  );
}