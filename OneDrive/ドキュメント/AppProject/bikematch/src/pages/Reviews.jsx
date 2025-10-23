import React, { useState, useEffect } from "react";
// --- Amplify v6 ---
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';
// import { DataStore } from '@aws-amplify/datastore';
// スキーマに合わせてクエリ名を変更
import { listReviews, getUser } from '@/graphql/queries';
// import { Review as ReviewModel, User as UserModel } from '@/models'; // DataStore
// ---------------
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, User as UserIcon, Calendar, MessageSquare, AlertCircle } from "lucide-react";
import { format, isDate } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

// S3 URL取得ヘルパー (共通化推奨)
const s3UrlCacheReviewsPage = new Map();
const getS3UrlReviewsPage = async (key) => {
    if (!key) return null;
    if (s3UrlCacheReviewsPage.has(key)) return s3UrlCacheReviewsPage.get(key);
    try {
        const url = await Storage.get(key); // Adjust level if needed
        s3UrlCacheReviewsPage.set(key, url);
        return url;
    } catch (error) {
        console.error("Error fetching S3 URL:", error);
        return null;
    }
};


export default function Reviews() {
  const [user, setUser] = useState(null); // Cognito User
  const [userId, setUserId] = useState(null); // Cognito Sub (ID)
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // --- Get Current User ---
  useEffect(() => {
    setIsLoadingUser(true);
    Auth.currentAuthenticatedUser()
      .then(cognitoUser => {
        setUser(cognitoUser);
        setUserId(cognitoUser.attributes.sub);
      })
      .catch(() => {
        console.log("Redirecting to login");
        setUser(null);
        setUserId(null);
        Auth.federatedSignIn(); // Redirect
      })
      .finally(() => setIsLoadingUser(false));
  }, []);

  // --- Fetch Received Reviews ---
  const { data: receivedReviews = [], isLoading: receivedLoading, error: receivedError } = useQuery({
    queryKey: ['received-reviews', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const result = await API.graphql(graphqlOperation(listReviews, { // Adjust query name
            filter: { reviewee_id: { eq: userId } },
            limit: 100
        }));
        let items = result.data?.listReviews?.items || [];
         items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // createdAt想定

          // Fetch reviewer details
          const reviewsWithDetails = await Promise.all(items.map(async (review) => {
              let reviewer = null;
              try {
                  const reviewerData = await API.graphql(graphqlOperation(getUser, { id: review.reviewer_id }));
                  reviewer = reviewerData.data?.getUser;
                  if (reviewer?.profile_image) {
                      // Corrected function call name
                      reviewer.profile_image_url = await getS3UrlReviewsPage(reviewer.profile_image);
                  }
              } catch (e) { console.error("Err fetching reviewer", e); }
              return { ...review, reviewer }; // reviewer オブジェクトを付与
          }));
          return reviewsWithDetails;
      } catch (error) {
          console.error("Error fetching received reviews:", error);
          throw error;
      }
    },
    enabled: !!userId,
  });

  // --- Fetch Given Reviews ---
  const { data: givenReviews = [], isLoading: givenLoading, error: givenError } = useQuery({
    queryKey: ['given-reviews', userId],
    queryFn: async () => {
       if (!userId) return [];
       try {
        const result = await API.graphql(graphqlOperation(listReviews, { // Adjust query name
            filter: { reviewer_id: { eq: userId } },
            limit: 100
        }));
         let items = result.data?.listReviews?.items || [];
         items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // createdAt想定

          // Fetch reviewee details
          const reviewsWithDetails = await Promise.all(items.map(async (review) => {
              let reviewee = null;
              try {
                  const revieweeData = await API.graphql(graphqlOperation(getUser, { id: review.reviewee_id }));
                  reviewee = revieweeData.data?.getUser;
                  if (reviewee?.profile_image) {
                      // Corrected function call name
                      reviewee.profile_image_url = await getS3UrlReviewsPage(reviewee.profile_image);
                  }
              } catch (e) { console.error("Err fetching reviewee", e); }
              return { ...review, reviewee }; // reviewee オブジェクトを付与
          }));
          return reviewsWithDetails;
       } catch (error) {
           console.error("Error fetching given reviews:", error);
           throw error;
       }
    },
    enabled: !!userId,
  });

  // --- Calculations ---
  const averageRating = receivedReviews.length > 0
    ? receivedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / receivedReviews.length
    : 0;

  const ratingDistribution = {
    5: receivedReviews.filter(r => r.rating === 5).length,
    4: receivedReviews.filter(r => r.rating === 4).length,
    3: receivedReviews.filter(r => r.rating === 3).length,
    2: receivedReviews.filter(r => r.rating === 2).length,
    1: receivedReviews.filter(r => r.rating === 1).length,
  };

  // --- Render Logic ---
  const isLoading = isLoadingUser || receivedLoading || givenLoading;

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-8">
         <Skeleton className="h-10 w-1/3 mb-4" />
         <Skeleton className="h-48 w-full rounded-2xl" />
         <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (receivedError || givenError) {
       return (
           <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center">
               <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
               <p className="text-lg text-red-600 mb-2">エラー</p>
               <p className="text-gray-600">レビュー情報の読み込みに失敗しました。</p>
               <p className="text-sm text-gray-500 mt-2">
                  {receivedError?.message || givenError?.message}
               </p>
           </div>
       );
   }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">評価・口コミ</h1>

        {/* No Reviews Alert */}
        {!isLoading && receivedReviews.length === 0 && givenReviews.length === 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
             <AlertCircle className="h-4 w-4 text-blue-600" />
             <AlertDescription className="text-blue-900">
               まだ評価がありません。取引を完了して相互評価を行いましょう。
             </AlertDescription>
          </Alert>
        )}

        {/* Received Reviews Section */}
        {receivedReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="shadow-xl border-none overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  受け取った評価
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                {/* Rating Summary */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-8">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-1">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                       {/* 修正箇所: [...] の閉じ括弧 */}
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={`avg-star-${i}`}
                          className={`w-5 h-5 ${
                            i < Math.round(averageRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))} {/* ここを修正 */}
                    </div>
                    <p className="text-sm text-gray-500">
                      {receivedReviews.length}件のレビュー
                    </p>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={`dist-${rating}`} className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-6 text-right">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${receivedReviews.length > 0 ? (ratingDistribution[rating] / receivedReviews.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-6 text-right">
                          {ratingDistribution[rating]}
                        </span>
                      </div>
                    ))} {/* 修正箇所: mapの閉じ括弧 */}
                  </div>
                </div>

                {/* Individual Reviews List */}
                <div className="space-y-4">
                  {receivedReviews.map((review, index) => {
                    const reviewer = review.reviewer;
                    const reviewDate = review.createdAt ? new Date(review.createdAt) : null;

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
                              {reviewer?.profile_image_url ? (
                                <img src={reviewer.profile_image_url} alt={reviewer.nickname || 'アバター'} className="w-full h-full object-cover" />
                              ) : (
                                <UserIcon className="w-5 h-5 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {reviewer?.nickname || "不明なユーザー"}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                 {/* 修正箇所: [...] の閉じ括弧 */}
                                {[...Array(5)].map((_, i) => (
                                  <Star key={`rev-star-${review.id}-${i}`} className={`w-3.5 h-3.5 ${ i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300" }`} />
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
                        {review.comment && <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>}
                      </motion.div>
                    );
                  })} {/* 修正箇所: mapの閉じ括弧 */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Given Reviews Section */}
        {givenReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="shadow-xl border-none rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  投稿した評価
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="space-y-4">
                  {givenReviews.map((review, index) => {
                    const reviewee = review.reviewee;
                    const reviewDate = review.createdAt ? new Date(review.createdAt) : null;

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
                               {reviewee?.profile_image_url ? (
                                 <img src={reviewee.profile_image_url} alt={reviewee.nickname || 'アバター'} className="w-full h-full object-cover" />
                               ) : (
                                 <UserIcon className="w-5 h-5 text-gray-500" />
                               )}
                            </div>
                             <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {reviewee?.nickname || "不明なユーザー"}さんへの評価
                              </p>
                               <div className="flex items-center gap-1 mt-0.5">
                                  {/* 修正箇所: [...] の閉じ括弧 */}
                                 {[...Array(5)].map((_, i) => (
                                   <Star key={`given-star-${review.id}-${i}`} className={`w-3.5 h-3.5 ${ i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300" }`} />
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
                          {review.comment && <p className="text-gray-700 leading-relaxed text-sm">{review.comment}</p>}
                      </motion.div>
                    );
                  })} {/* 修正箇所: mapの閉じ括弧 */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}