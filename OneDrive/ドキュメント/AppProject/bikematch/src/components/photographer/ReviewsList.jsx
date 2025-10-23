import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, User as UserIcon, Calendar } from "lucide-react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton"; // Skeleton をインポート

// Assume getS3Url function is available via props or context if needed,
// but ideally the URL is pre-fetched in the parent (Reviews.jsx or PhotographerDetail.jsx)

export default function ReviewsList({ reviews = [], isLoading = false }) { // isLoading prop を追加

  return (
    <Card className="shadow-lg border-none rounded-2xl mb-8"> {/* Added mb-8 */}
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
          <Star className="w-5 h-5 md:w-6 md:w-6 text-yellow-500 fill-yellow-500" />
          レビュー {isLoading ? '' : `(${reviews.length}件)`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && reviews.length === 0 ? (
             <div className="space-y-4">
                 {[...Array(3)].map((_, i) => (
                     <div key={`skel-review-item-${i}`} className="bg-gray-50 rounded-xl p-4 md:p-6 space-y-3">
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-3">
                                 <Skeleton className="h-10 w-10 rounded-full" />
                                 <div className="space-y-1.5">
                                     <Skeleton className="h-4 w-24" />
                                     <Skeleton className="h-3 w-16" />
                                 </div>
                             </div>
                             <Skeleton className="h-3 w-16" />
                         </div>
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3" />
                     </div>
                 ))}
             </div>
         ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                  まだレビューはありません。
              </div>
         ) : (
           <div className="space-y-4">
            {reviews.map((review, index) => {
              const reviewer = review.reviewer; // Assume reviewer object is attached
              const reviewDate = review.createdAt ? new Date(review.createdAt) : null;
              const avatarUrl = reviewer?.profile_image_url; // Use pre-fetched URL

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-gray-50 rounded-xl p-4 md:p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                         {avatarUrl ? (
                           <img
                             src={avatarUrl}
                             alt={reviewer?.nickname || 'アバター'}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                                 e.target.style.display = 'none';
                                 const fallback = e.target.nextElementSibling;
                                 if (fallback) fallback.style.display = 'flex';
                             }}
                           />
                         ) : null}
                         {/* Fallback Icon */}
                         <UserIcon
                             className={`w-5 h-5 text-gray-500 ${avatarUrl ? 'hidden' : 'flex'}`}
                             style={{ display: avatarUrl ? 'none' : 'flex' }}
                         />
                       </div>
                       <div>
                         <p className="font-semibold text-gray-900 text-sm">
                           {reviewer?.nickname || "不明なユーザー"}
                         </p>
                         <div className="flex items-center gap-1 mt-0.5">
                            {/* 修正箇所: [...] の閉じ括弧 */}
                           {[...Array(5)].map((_, i) => (
                             <Star
                               key={`star-${review.id}-${i}`} // Ensure unique key
                               className={`w-3.5 h-3.5 ${
                                 i < (review.rating || 0)
                                   ? "text-yellow-500 fill-yellow-500"
                                   : "text-gray-300"
                               }`}
                             />
                           ))} {/* ここを修正 */}
                         </div>
                       </div>
                    </div>
                     {reviewDate && isDate(reviewDate) && (
                         <div className="flex items-center gap-1.5 text-xs text-gray-500 flex-shrink-0 whitespace-nowrap ml-2">
                           <Calendar className="w-3.5 h-3.5" />
                           {format(reviewDate, "yyyy/MM/dd", { locale: ja })}
                         </div>
                     )}
                  </div>
                   {review.comment && (
                      <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>
                   )}
                </motion.div>
              );
            })} {/* 修正箇所: mapの閉じ括弧 */}
          </div>
         )}
      </CardContent>
    </Card>
  );
}