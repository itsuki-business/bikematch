import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, User, Calendar, MessageSquare, ThumbsUp, Filter } from "lucide-react";
import { motion } from "framer-motion";

// Mock data for demonstration
const mockReviews = [
  {
    id: 1,
    reviewer: {
      id: "user1",
      nickname: "山田太郎",
      profileImage: null,
      userType: "ライダー"
    },
    reviewee: {
      id: "photographer1",
      nickname: "佐藤カメラマン",
      profileImage: null,
      userType: "フォトグラファー"
    },
    rating: 5,
    comment: "とても丁寧でプロフェッショナルな撮影でした。バイクの美しさを完璧に捉えてくれて、大変満足しています。また機会があればお願いしたいです。",
    createdAt: "2024-01-15",
    isReceived: true
  },
  {
    id: 2,
    reviewer: {
      id: "user2",
      nickname: "田中花子",
      profileImage: null,
      userType: "ライダー"
    },
    reviewee: {
      id: "photographer2",
      nickname: "鈴木フォト",
      profileImage: null,
      userType: "フォトグラファー"
    },
    rating: 4,
    comment: "撮影技術は素晴らしく、バイクの特徴をよく理解して撮ってくれました。コミュニケーションも取れやすく、リラックスして撮影できました。",
    createdAt: "2024-01-12",
    isReceived: true
  },
  {
    id: 3,
    reviewer: {
      id: "photographer1",
      nickname: "佐藤カメラマン",
      profileImage: null,
      userType: "フォトグラファー"
    },
    reviewee: {
      id: "user1",
      nickname: "山田太郎",
      profileImage: null,
      userType: "ライダー"
    },
    rating: 5,
    comment: "とても協力的で、撮影の要望を明確に伝えてくれました。バイクへの愛情が感じられ、素晴らしい作品が撮れました。",
    createdAt: "2024-01-15",
    isReceived: false
  },
  {
    id: 4,
    reviewer: {
      id: "user3",
      nickname: "高橋ライダー",
      profileImage: null,
      userType: "ライダー"
    },
    reviewee: {
      id: "photographer3",
      nickname: "伊藤写真",
      profileImage: null,
      userType: "フォトグラファー"
    },
    rating: 3,
    comment: "撮影は上手でしたが、時間が少し長引いてしまいました。でも最終的な写真は気に入っています。",
    createdAt: "2024-01-10",
    isReceived: true
  },
  {
    id: 5,
    reviewer: {
      id: "photographer2",
      nickname: "鈴木フォト",
      profileImage: null,
      userType: "フォトグラファー"
    },
    reviewee: {
      id: "user2",
      nickname: "田中花子",
      profileImage: null,
      userType: "ライダー"
    },
    rating: 4,
    comment: "明るくて親しみやすい方で、撮影がとても楽しかったです。バイクの知識も豊富で、良い写真が撮れました。",
    createdAt: "2024-01-12",
    isReceived: false
  }
];

export default function Reviews() {
  const [activeTab, setActiveTab] = useState("received");
  const [filterRating, setFilterRating] = useState("all");

  // Filter reviews based on active tab
  const filteredReviews = mockReviews.filter(review => {
    const matchesTab = activeTab === "received" ? review.isReceived : !review.isReceived;
    const matchesRating = filterRating === "all" || review.rating === parseInt(filterRating);
    return matchesTab && matchesRating;
  });

  // Calculate statistics
  const receivedReviews = mockReviews.filter(r => r.isReceived);
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

  const renderStars = (rating, size = "w-4 h-4") => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating
            ? "text-yellow-500 fill-yellow-500"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const renderReviewCard = (review, index) => {
    const reviewer = review.reviewer;
    const reviewee = review.reviewee;
    const isReceived = review.isReceived;

    return (
      <motion.div
        key={review.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {reviewer.nickname.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{reviewer.nickname}</h3>
                <Badge variant={reviewer.userType === "フォトグラファー" ? "default" : "secondary"}>
                  {reviewer.userType}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {renderStars(review.rating, "w-4 h-4")}
                <span className="text-sm text-gray-500 ml-2">{review.rating}/5</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            {review.createdAt}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MessageSquare className="w-4 h-4" />
            {isReceived ? "受け取った評価" : "投稿した評価"}
            <span className="font-medium text-gray-700">
              {isReceived ? reviewee.nickname : reviewee.nickname}さん
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
            <ThumbsUp className="w-4 h-4 mr-1" />
            参考になった
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">評価・口コミ</h1>
          <p className="text-gray-600">取引相手との相互評価を確認できます</p>
        </motion.div>

        {/* Statistics Card */}
        {activeTab === "received" && receivedReviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="shadow-xl border-none overflow-hidden rounded-2xl">
              <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  評価サマリー
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                  <div className="text-center p-6 bg-gray-50 rounded-xl">
                    <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="flex items-center justify-center gap-1 mb-2">
                      {renderStars(Math.round(averageRating), "w-6 h-6")}
                    </div>
                    <p className="text-sm text-gray-500">
                      {receivedReviews.length}件のレビュー
                    </p>
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-8 text-right">{rating}★</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-full rounded-full transition-all duration-500"
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
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("received")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "received"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                受け取った評価 ({receivedReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("given")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === "given"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                投稿した評価 ({mockReviews.filter(r => !r.isReceived).length})
              </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">すべての評価</option>
                <option value="5">5つ星</option>
                <option value="4">4つ星</option>
                <option value="3">3つ星</option>
                <option value="2">2つ星</option>
                <option value="1">1つ星</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-6"
        >
          {filteredReviews.length > 0 ? (
            filteredReviews.map((review, index) => renderReviewCard(review, index))
          ) : (
            <Card className="shadow-lg border-none rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {activeTab === "received" ? "受け取った評価がありません" : "投稿した評価がありません"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === "received" 
                    ? "まだ評価を受け取っていません。取引を完了して評価を待ちましょう。"
                    : "まだ評価を投稿していません。取引を完了して評価を投稿しましょう。"
                  }
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  取引履歴を見る
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}