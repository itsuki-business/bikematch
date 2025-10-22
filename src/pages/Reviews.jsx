import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Star, User as UserIcon, Calendar, MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { motion } from "framer-motion";

export default function Reviews() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin(createPageUrl("Reviews"));
    });
  }, []);

  const { data: receivedReviews, isLoading: receivedLoading } = useQuery({
    queryKey: ['received-reviews', user?.id],
    queryFn: () => base44.entities.Review.filter({ reviewee_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: givenReviews, isLoading: givenLoading } = useQuery({
    queryKey: ['given-reviews', user?.id],
    queryFn: () => base44.entities.Review.filter({ reviewer_id: user?.id }, '-created_date'),
    enabled: !!user,
    initialData: [],
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
  });

  const getUserById = (id) => users.find(u => u.id === id);

  const averageRating = receivedReviews.length > 0
    ? receivedReviews.reduce((sum, r) => sum + r.rating, 0) / receivedReviews.length
    : 0;

  const ratingDistribution = {
    5: receivedReviews.filter(r => r.rating === 5).length,
    4: receivedReviews.filter(r => r.rating === 4).length,
    3: receivedReviews.filter(r => r.rating === 3).length,
    2: receivedReviews.filter(r => r.rating === 2).length,
    1: receivedReviews.filter(r => r.rating === 1).length,
  };

  if (receivedLoading || givenLoading || !user) {
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">評価・口コミ</h1>

        {receivedReviews.length === 0 && givenReviews.length === 0 && (
          <Alert className="mb-6 bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              まだ評価がありません。取引を完了して相互評価を行いましょう。
            </AlertDescription>
          </Alert>
        )}

        {receivedReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Card className="shadow-xl border-none overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  受け取った評価
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-900 mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {Array(5).fill(0).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-6 h-6 ${
                            i < Math.round(averageRating)
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {receivedReviews.length}件のレビュー
                    </p>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-8">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${receivedReviews.length > 0 ? (ratingDistribution[rating] / receivedReviews.length) * 100 : 0}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 w-8 text-right">
                          {ratingDistribution[rating]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {receivedReviews.map((review, index) => {
                    const reviewer = getUserById(review.reviewer_id);
                    return (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                              {reviewer?.profile_image ? (
                                <img
                                  src={reviewer.profile_image}
                                  alt={reviewer.nickname}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {reviewer?.nickname || "名前未設定"}
                              </p>
                              <div className="flex items-center gap-2">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(review.created_date), "yyyy年MM月dd日", { locale: ja })}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {givenReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  投稿した評価
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-4">
                  {givenReviews.map((review, index) => {
                    const reviewee = getUserById(review.reviewee_id);
                    return (
                      <motion.div
                        key={review.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                              {reviewee?.profile_image ? (
                                <img
                                  src={reviewee.profile_image}
                                  alt={reviewee.nickname}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <UserIcon className="w-6 h-6 text-gray-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {reviewee?.nickname || "名前未設定"}さんへの評価
                              </p>
                              <div className="flex items-center gap-2">
                                {Array(5).fill(0).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(review.created_date), "yyyy年MM月dd日", { locale: ja })}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}