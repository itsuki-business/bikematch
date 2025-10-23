import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, ImageOff, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
// --- Amplify v6 ---
import { getUrl } from 'aws-amplify/storage';
// ---------------
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton をインポート

// S3 URL取得ヘルパー (共通化推奨)
const s3UrlCacheGallery = new Map();
const getPortfolioUrl = async (key) => {
    // キーの基本的な検証を追加
    if (!key || typeof key !== 'string' || key.trim() === '') return null;
    if (s3UrlCacheGallery.has(key)) return s3UrlCacheGallery.get(key);
    try {
        // Portfolioはおそらく公開されているので level: 'public' (デフォルト)
        const url = await getUrl({ key });
        s3UrlCacheGallery.set(key, url.url.toString()); // 成功時にキャッシュ
        return url.url.toString();
    } catch (error) {
        console.error(`Error getting portfolio URL for key ${key}:`, error);
        return null; // エラー時は null を返す
    }
};

// Component to render individual portfolio item with URL fetching
const PortfolioItem = ({ item, index }) => {
    const [imageUrl, setImageUrl] = useState(null);
    const [isLoadingUrl, setIsLoadingUrl] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setImageUrl(null); // Reset on item change
        setHasError(false);
        setIsLoadingUrl(false);

        if (item.image_key) { // GraphQLスキーマのフィールド名に合わせる (例: image_key)
            setIsLoadingUrl(true);
            getPortfolioUrl(item.image_key).then(url => {
                if (isMounted) {
                    if (url) {
                        setImageUrl(url);
                        setHasError(false);
                    } else {
                        setHasError(true);
                    }
                    setIsLoadingUrl(false);
                }
            });
        } else {
            setHasError(true); // キー自体がない場合もエラー扱い
        }
        return () => { isMounted = false; };
    }, [item.image_key]); // Depend on the S3 key

    return (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="group relative aspect-square rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 bg-gray-100" // Added bg
        >
          {isLoadingUrl && (
              <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
          )}
          {!isLoadingUrl && hasError && (
               <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                  <ImageOff className="w-8 h-8 mb-1" />
                  <span className="text-xs">画像表示エラー</span>
              </div>
          )}
          {!isLoadingUrl && imageUrl && (
              <img
                src={imageUrl}
                alt={item.title || `ポートフォリオ ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={() => {
                    // 画像自体のロードエラーの場合
                    if (!hasError) setHasError(true); // エラー状態をセット
                }}
              />
          )}

          {/* Overlay for Title/Description */}
          {/* 修正箇所: && !isLoadingUrl && !hasError を追加 */}
          {(item.title || item.description) && !isLoadingUrl && !hasError && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
              <div className="p-3 text-white w-full">
                {item.title && <h4 className="font-semibold text-sm truncate">{item.title}</h4>}
                {item.description && <p className="text-xs text-gray-200 mt-0.5 line-clamp-2">{item.description}</p>}
              </div>
            </div>
          )}
        </motion.div>
    );
};


export default function PortfolioGallery({ portfolio = [], isLoading = false }) {

  return (
    <Card className="mb-8 shadow-lg border-none rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Camera className="w-5 h-5 md:w-6 md:w-6 text-red-600" />
          ポートフォリオ {isLoading ? '' : `(${portfolio.length}枚)`} {/* 件数表示修正 */}
        </CardTitle>
      </CardHeader>
      <CardContent>
         {isLoading && portfolio.length === 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                      <Skeleton key={`skel-gallery-${i}`} className="w-full aspect-square rounded-lg" />
                  ))}
              </div>
          ) : portfolio.length === 0 ? (
               <div className="text-center py-8 text-gray-500">
                   ポートフォリオ画像はまだありません。
               </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolio.map((item, index) => (
                 <PortfolioItem key={item.id} item={item} index={index} />
              ))}
            </div>
          )}
      </CardContent>
    </Card>
  );
}