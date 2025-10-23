import React, { useState, useEffect } from "react";
// --- Amplify v6 ---
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl } from 'aws-amplify/storage';
// import { DataStore } from '@aws-amplify/datastore';
// スキーマに合わせてクエリ/ミューテーション名を変更
import { getUser, listPortfolios, listReviews, listConversations } from '@/graphql/queries';
import { createConversation } from '@/graphql/mutations';
// import { User as UserModel, Portfolio as PortfolioModel, Review as ReviewModel, Conversation as ConversationModel } from '@/models'; // DataStore
// ---------------
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom"; // useLocation を追加
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Star, Camera, MessageSquare, ArrowLeft, DollarSign, Package, ExternalLink, AlertCircle, Instagram, Youtube, Twitter } from "lucide-react"; // SNSアイコン追加
import { motion } from "framer-motion";
import PortfolioGallery from "../components/photographer/PortfolioGallery";
import ReviewsList from "../components/photographer/ReviewsList";

// Helper function to fetch S3 URL (cache results)
const s3UrlCache = new Map();
const getS3Url = async (key) => {
    if (!key) return null;
    if (s3UrlCache.has(key)) return s3UrlCache.get(key);
    try {
        const url = await Storage.get(key); // Adjust level if needed
        s3UrlCache.set(key, url); // Cache the URL
        return url;
    } catch (error) {
        console.error("Error fetching S3 URL:", error);
        return null;
    }
};


export default function PhotographerDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const urlParams = React.useMemo(() => new URLSearchParams(location.search), [location.search]);
  const photographerId = urlParams.get('id');

  const [currentUser, setCurrentUser] = useState(null); // Cognito User + App DB Data
  const [currentUserApp, setCurrentUserApp] = useState(null); // App DB Data only
  const [isLoadingCurrentUser, setIsLoadingCurrentUser] = useState(true);

  // --- Get Current User ---
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoadingCurrentUser(true);
      try {
        const cognitoUser = await getCurrentUser();
        const attributes = await fetchUserAttributes();
        setCurrentUser({ userId: cognitoUser.userId, attributes }); // Keep Cognito user object

        // Fetch App DB user data
        const client = generateClient();
        const userDataResult = await client.graphql({
          query: getUser,
          variables: { id: cognitoUser.userId },
          authMode: 'userPool'
        });
        setCurrentUserApp(userDataResult.data?.getUser || null);

      } catch (error) {
        console.log('Not signed in:', error);
        setCurrentUser(null);
        setCurrentUserApp(null);
        // Optionally redirect to login or show login prompt
      } finally {
        setIsLoadingCurrentUser(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // --- Fetch Photographer Details ---
  const { data: photographer, isLoading: isLoadingPhotographer, error: photographerError } = useQuery({
    queryKey: ['photographer', photographerId],
    queryFn: async () => {
      if (!photographerId) throw new Error("Photographer ID missing");
      // --- Amplify API (GraphQL) ---
      const client = generateClient();
      const result = await client.graphql({
        query: getUser,
        variables: { id: photographerId },
        authMode: 'userPool'
      });
      const fetchedUser = result.data?.getUser;
      if (!fetchedUser || fetchedUser.user_type !== 'photographer') {
          throw new Error("Photographer not found or invalid user type");
      }
      // Fetch profile image URL
      if (fetchedUser.profile_image) {
          fetchedUser.profile_image_url = await getS3Url(fetchedUser.profile_image);
      }
      return fetchedUser;
      // -----------------------------
      // --- DataStore ---
      // const user = await DataStore.query(UserModel, photographerId);
      // if (!user || user.user_type !== 'photographer') throw new Error("Photographer not found");
      // if (user.profile_image) user.profile_image_url = await getS3Url(user.profile_image);
      // return user;
      // ---------------
    },
    enabled: !!photographerId,
    retry: false,
  });

  // --- Fetch Portfolio ---
  const { data: portfolio = [], isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['portfolio', photographerId],
    queryFn: async () => {
      if (!photographerId) return [];
      try {
        // --- Amplify API (GraphQL) ---
        const client = generateClient();
        const result = await client.graphql({
          query: listPortfolios,
          variables: {
            filter: { photographer_id: { eq: photographerId } },
            limit: 20
          },
          authMode: 'userPool'
        });
        const items = result.data?.listPortfolios?.items || [];
        // Fetch S3 URLs for portfolio images
        const itemsWithUrls = await Promise.all(items.map(async (item) => ({
            ...item,
            image_url: await getS3Url(item.image_key) // Assuming schema uses image_key
        })));
        return itemsWithUrls;
        // -----------------------------
        // --- DataStore ---
        // const items = await DataStore.query(PortfolioModel, p => p.photographer_id.eq(photographerId));
        // const itemsWithUrls = await Promise.all(items.map(async (item) => ({...item, image_url: await getS3Url(item.image_key)})));
        // return itemsWithUrls;
        // ---------------
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        return [];
      }
    },
    enabled: !!photographerId,
    staleTime: 5 * 60 * 1000,
  });

  // --- Fetch Reviews ---
  // Assuming listReviews query exists with filtering/sorting by reviewee_id and createdAt
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['reviews', photographerId],
    queryFn: async () => {
       if (!photographerId) return [];
      try {
        // --- Amplify API (GraphQL) ---
        const client = generateClient();
        const result = await client.graphql({
          query: listReviews,
          variables: {
            filter: { reviewee_id: { eq: photographerId } },
            limit: 50
          },
          authMode: 'userPool'
        });
        let fetchedReviews = result.data?.listReviews?.items || [];
        // Client-side sort if GraphQL doesn't sort
        fetchedReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // createdAt field assumed

        // Fetch reviewer details for each review
         const reviewsWithReviewer = await Promise.all(fetchedReviews.map(async (review) => {
             let reviewer = null;
             try {
                 const reviewerData = await client.graphql({
                   query: getUser,
                   variables: { id: review.reviewer_id },
                   authMode: 'userPool'
                 });
                 reviewer = reviewerData.data?.getUser;
                 if (reviewer?.profile_image) {
                     reviewer.profile_image_url = await getS3Url(reviewer.profile_image);
                 }
             } catch (fetchError) {
                 console.error(`Error fetching reviewer ${review.reviewer_id}:`, fetchError);
             }
             return { ...review, reviewer }; // Add reviewer object to review
         }));

         return reviewsWithReviewer;

        // -----------------------------
        // --- DataStore ---
        // const fetchedReviews = await DataStore.query(ReviewModel, r => r.reviewee_id.eq(photographerId), {
        //     sort: s => s.createdAt('DESCENDING') // Or use `sort` based on DataStore version
        // });
        // const reviewsWithReviewer = await Promise.all(fetchedReviews.map(async (review) => { ... })); // Fetch reviewer as above
        // return reviewsWithReviewer;
        // ---------------
      } catch (error) {
          console.error("Error fetching reviews:", error);
          return [];
      }
    },
    enabled: !!photographerId,
    staleTime: 2 * 60 * 1000, // Reviews cache for 2 mins
  });

  // --- Create Conversation Mutation ---
   const createConversationMutation = useMutation({
     mutationFn: async () => {
       if (!currentUser || !currentUserApp || !photographer) throw new Error("Missing user data");
       if (currentUserApp.user_type !== 'rider') throw new Error("Only riders can initiate conversations.");
       if (currentUser.userId === photographerId) throw new Error("Cannot message yourself.");

       const currentUserId = currentUser.userId;

       // 1. Check if conversation already exists
       // This requires a query like listConversations with filter on both IDs
       // Example assuming such a query exists or listConversations fetches all:
       let existingConversation = null;
       try {
           const client = generateClient();
           const convResult = await client.graphql({
             query: listConversations,
             variables: {
               filter: {
                   and: [ // Check both combinations
                       { biker_id: { eq: currentUserId }, photographer_id: { eq: photographerId } },
                       // If your schema enforces biker_id < photographer_id, you only need one check
                   ]
                   // OR potentially use a more specific query if available
               },
               limit: 1
             },
             authMode: 'userPool'
           });
           existingConversation = convResult.data?.listConversations?.items?.[0];

            // Check the other combination if needed, depending on schema/query
            if (!existingConversation) {
                 const convResult2 = await client.graphql({
                   query: listConversations,
                   variables: {
                     filter: {
                         and: [
                             { biker_id: { eq: photographerId }, photographer_id: { eq: currentUserId } }
                         ]
                     },
                     limit: 1
                   },
                   authMode: 'userPool'
                 });
                 existingConversation = convResult2.data?.listConversations?.items?.[0];
            }

       } catch (listError) {
           console.error("Error checking existing conversations:", listError);
           // Proceed to create, but warn
       }


       if (existingConversation) {
           console.log("Found existing conversation:", existingConversation.id);
           return existingConversation; // Return existing one
       }

       // 2. Create new conversation if none exists
       const conversationInput = {
         biker_id: currentUserId,
         photographer_id: photographerId,
         biker_name: currentUserApp.nickname || currentUser.attributes.name || 'ライダー',
         photographer_name: photographer.nickname || photographer.name || 'フォトグラファー',
         last_message: "会話を開始しました",
         last_message_at: new Date().toISOString(),
         status: "依頼中",
         // Add owner fields if needed by your auth rules (AppSync might add them automatically)
       };
       console.log("Creating conversation input:", conversationInput);
       // --- Amplify API (GraphQL) ---
       const client = generateClient();
       const result = await client.graphql({
         query: createConversation,
         variables: { input: conversationInput },
         authMode: 'userPool'
       });
       const newConversation = result.data?.createConversation;
       if (!newConversation) throw new Error("Failed to create conversation");
       return newConversation;
       // -----------------------------
       // --- DataStore ---
       // const newConversation = await DataStore.save(new ConversationModel(conversationInput));
       // return newConversation;
       // ---------------
     },
     onSuccess: (conversationData) => {
       // Invalidate conversations list for the current user
       queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?.userId] });
       // Navigate to the detail page
       navigate(createPageUrl("ConversationDetail") + `?id=${conversationData.id}`);
     },
     onError: (error) => {
         console.error("Error creating/finding conversation:", error);
         alert(`メッセージルームの開始に失敗しました: ${error.message}`);
     }
   });


  const handleContactClick = () => {
    if (!currentUser || !currentUserApp) {
      alert('メッセージを送るにはログインが必要です');
      // Optionally open login modal or redirect
      return;
    }
    if (currentUserApp.user_type !== 'rider') {
      alert('メッセージを送るにはライダーとして登録してください。プロフィールページで変更できます。');
      return;
    }
     if (currentUser.attributes.sub === photographerId) {
        alert('自分自身にメッセージを送ることはできません。');
        return;
     }

    createConversationMutation.mutate();
  };

  // --- Render Logic ---

   const isLoading = isLoadingCurrentUser || isLoadingPhotographer || isLoadingPortfolio || isLoadingReviews;

  if (isLoading) {
    // Basic loading skeleton
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-96 w-full rounded-2xl mb-8" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

   if (photographerError) {
      return (
         <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center">
             <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
             <p className="text-lg text-red-600 mb-2">エラー</p>
             <p className="text-gray-600 mb-6">{photographerError.message}</p>
             <Button variant="outline" onClick={() => navigate(createPageUrl("Home"))}>
                 ホームに戻る
             </Button>
         </div>
       );
   }

  if (!photographer) { // Should be caught by error state, but as fallback
    return (
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 text-center">
        <p className="text-lg text-gray-500">フォトグラファーが見つかりません</p>
      </div>
    );
  }

   // Determine if the current user can send a message
   const canSendMessage = currentUser && currentUserApp?.user_type === 'rider' && currentUser?.attributes?.sub !== photographerId;


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Home"))}
          className="mb-6 text-gray-700 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          フォトグラファー一覧へ
        </Button>

        {/* Alert for Photographers */}
        {currentUserApp && currentUserApp.user_type === 'photographer' && currentUser?.attributes?.sub !== photographerId && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
             <AlertCircle className="h-4 w-4 text-yellow-600" />
             <AlertDescription className="text-yellow-900">
                 フォトグラファーは他のフォトグラファーにメッセージを送ることはできません。
             </AlertDescription>
           </Alert>
        )}
        {/* Alert if viewing own profile as photographer */}
        {currentUser && currentUser.attributes?.sub === photographerId && currentUserApp?.user_type === 'photographer' && (
             <Alert className="mb-6 bg-blue-50 border-blue-200">
                 <AlertCircle className="h-4 w-4 text-blue-600" />
                 <AlertDescription className="text-blue-900">
                     これはあなたの公開プロフィールです。ライダーからはこのように見えています。編集は<Link to={createPageUrl("Profile")} className="underline font-medium">プロフィール編集ページ</Link>から行えます。
                 </AlertDescription>
             </Alert>
         )}


        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8 shadow-xl border-none overflow-hidden rounded-2xl"> {/* Added rounded */}
            {/* Header Image */}
            <div className="relative h-64 md:h-80 bg-gray-300"> {/* Adjusted height */}
              {photographer.profile_image_url ? (
                <img
                  src={photographer.profile_image_url}
                  alt={photographer.nickname || 'プロフィール画像'}
                  className="w-full h-full object-cover"
                   onError={(e) => e.target.src = 'https://via.placeholder.com/600x400?text=Image+Error'} // Error placeholder
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-20 h-20 text-gray-400" /> {/* Slightly smaller */}
                </div>
              )}
              {/* Overlay and Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white"> {/* Adjusted padding */}
                <h1 className="text-3xl md:text-4xl font-bold mb-2"> {/* Adjusted size */}
                  {photographer.nickname || "名前未設定"}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"> {/* Adjusted gap and size */}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{photographer.prefecture || "地域未設定"}</span>
                  </div>
                  {photographer.average_rating !== undefined && photographer.average_rating !== null && (
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{photographer.average_rating.toFixed(1)}</span>
                      <span className="text-gray-300">({photographer.review_count || 0}件)</span>
                    </div>
                  )}
                   {photographer.is_accepting_requests && (
                      <Badge variant="secondary" className="bg-green-500 border-green-500 text-white text-xs">
                          募集中
                      </Badge>
                   )}
                   {!photographer.is_accepting_requests && (
                       <Badge variant="outline" className="bg-gray-500 border-gray-500 text-white text-xs">
                           募集停止中
                       </Badge>
                   )}
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-3 gap-8 mb-8">
                 {/* Bio Section (Spans 2 columns on medium screens) */}
                <div className="md:col-span-2 space-y-6">
                   <div>
                       <h3 className="text-xl font-bold text-gray-900 mb-3">プロフィール</h3>
                       <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                         {photographer.bio || "自己紹介がありません"}
                       </p>
                   </div>
                   {/* Shooting Genres */}
                   {photographer.shooting_genres && photographer.shooting_genres.length > 0 && (
                     <div>
                       <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">得意ジャンル</h4>
                       <div className="flex flex-wrap gap-2">
                         {photographer.shooting_genres.map((genre) => (
                           <Badge key={genre} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                             {genre}
                           </Badge>
                         ))}
                       </div>
                     </div>
                   )}
                   {/* Special Conditions */}
                   {photographer.special_conditions && photographer.special_conditions.length > 0 && (
                     <div>
                       <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">こだわり条件</h4>
                       <div className="flex flex-wrap gap-2">
                         {photographer.special_conditions.map((condition) => (
                           <Badge key={condition} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                             {condition}
                           </Badge>
                         ))}
                       </div>
                     </div>
                   )}
                </div>

                {/* Sidebar Section (Spans 1 column) */}
                <div className="space-y-6">
                   {/* Equipment */}
                   {photographer.equipment && (
                     <div className="bg-gray-50 rounded-lg p-4">
                       <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                         <Package className="w-4 h-4" /> 使用機材
                       </h4>
                       <p className="text-sm text-gray-700 whitespace-pre-wrap">{photographer.equipment}</p>
                     </div>
                   )}

                   {/* Price Range */}
                   {(photographer.price_range_min !== undefined && photographer.price_range_min !== null) || (photographer.price_range_max !== undefined && photographer.price_range_max !== null) ? (
                     <div className="bg-gray-50 rounded-lg p-4">
                       <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                         <DollarSign className="w-4 h-4" /> 料金目安
                       </h4>
                       <p className="text-2xl font-bold text-gray-900">
                         {/* Display range or single price */}
                         {photographer.price_range_min !== null && photographer.price_range_max !== null
                           ? `¥${photographer.price_range_min?.toLocaleString()} - ¥${photographer.price_range_max?.toLocaleString()}`
                           : photographer.price_range_min !== null
                           ? `¥${photographer.price_range_min?.toLocaleString()} から`
                           : photographer.price_range_max !== null
                           ? `〜 ¥${photographer.price_range_max?.toLocaleString()}`
                           : "要相談"}
                       </p>
                       <p className="text-xs text-gray-500 mt-1">※ 詳細はメッセージでご相談ください</p>
                     </div>
                   ) : null}


                   {/* Links */}
                   {(photographer.portfolio_website || photographer.instagram_url || photographer.twitter_url || photographer.youtube_url) && (
                     <div>
                       <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">リンク</h4>
                       <div className="space-y-2">
                         {/* Portfolio Link */}
                         {photographer.portfolio_website && (
                           <a href={photographer.portfolio_website} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline">
                             <ExternalLink className="w-4 h-4" /> ポートフォリオサイト
                           </a>
                         )}
                          {/* Instagram Link */}
                          {photographer.instagram_url && (
                             <a href={photographer.instagram_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-800 hover:underline">
                                <Instagram className="w-4 h-4" /> Instagram
                             </a>
                          )}
                          {/* X Link */}
                          {photographer.twitter_url && (
                             <a href={photographer.twitter_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-gray-800 hover:text-black hover:underline">
                                {/* Replace with X icon component if available */}
                                <Twitter className="w-4 h-4" /> X (Twitter)
                             </a>
                          )}
                          {/* YouTube Link */}
                          {photographer.youtube_url && (
                             <a href={photographer.youtube_url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 hover:underline">
                                <Youtube className="w-4 h-4" /> YouTube
                             </a>
                          )}
                       </div>
                     </div>
                   )}
                </div>
              </div>

               {/* Message Button (Show conditionally) */}
               {canSendMessage && (
                 <div className="flex justify-center md:justify-start"> {/* Center on mobile, left on desktop */}
                   <Button
                     onClick={handleContactClick}
                     disabled={createConversationMutation.isPending}
                     className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-base rounded-lg" // Adjusted styles
                   >
                     <MessageSquare className="w-5 h-5 mr-2" />
                     {createConversationMutation.isPending ? "準備中..." : "メッセージを送って相談する"}
                   </Button>
                 </div>
               )}
               {/* Show disabled button or info if user cannot send message */}
                {!currentUser && !isLoadingCurrentUser && (
                    <div className="text-center md:text-left text-sm text-gray-600 border border-dashed p-4 rounded-md">
                        <p>メッセージを送るには<Button variant="link" size="sm" className="p-0 h-auto" onClick={() => {/* Open login modal */}}>ログイン</Button>が必要です。</p>
                    </div>
                )}
                {currentUser && !canSendMessage && currentUserApp?.user_type !== 'rider' && currentUser?.attributes?.sub !== photographerId && (
                     <div className="text-center md:text-left text-sm text-gray-600 border border-dashed p-4 rounded-md">
                         <p>メッセージを送るには、プロフィールでユーザータイプを「ライダー」に設定してください。</p>
                     </div>
                 )}

            </CardContent>
          </Card>

          {/* Portfolio Gallery */}
          {portfolio.length > 0 && (
              <PortfolioGallery portfolio={portfolio} isLoading={isLoadingPortfolio} />
          )}

          {/* Reviews List */}
           {(reviews.length > 0 || isLoadingReviews) && ( // Show even if loading if there might be reviews
              <ReviewsList reviews={reviews} isLoading={isLoadingReviews} />
           )}
            {/* Show message if no reviews and not loading */}
            {!isLoadingReviews && reviews.length === 0 && (
                 <Card className="shadow-lg border-none rounded-2xl">
                     <CardContent className="p-8 text-center text-gray-500">
                         まだレビューはありません。
                     </CardContent>
                 </Card>
             )}

        </motion.div>
      </div>
    </div>
  );
}

// Need to import Link if using it in the Alert
import { Link } from "react-router-dom";