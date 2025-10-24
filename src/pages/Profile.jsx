import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
// --- Amplify v6 ---
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import mockAPIService from '@/services/mockAPIService';
import mockStorageService from '@/services/mockStorageService';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl, uploadData } from 'aws-amplify/storage';
// import { DataStore } from '@aws-amplify/datastore';
import { getUser, listPortfolios } from '@/graphql/queries';
import { updateUser, createUser, createPortfolio, deletePortfolio } from '@/graphql/mutations';
// import { User as UserModel, Portfolio as PortfolioModel } from '@/models'; // DataStoreの場合
// ---------------
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Plus, Save, Camera, AlertCircle, Link as LinkIcon, User, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// ImageCropperは不要 - 直接アップロード
import { Skeleton } from "@/components/ui/skeleton"; // For loading state

// Constants
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const GENRES = [
  "ツーリング", "スポーツ走行", "カスタム", "レストア", "オフロード",
  "ツーリングレポート", "イベント", "ポートレート", "風景", "アクション"
];

const SPECIAL_CONDITIONS = [
  "ドローン撮影対応", "夜間撮影対応", "雨天撮影対応", "遠方出張対応",
  "編集・加工サービス", "プリントサービス", "データ納品", "SNS投稿用編集"
];

const MAX_PORTFOLIO_IMAGES = 10;

export default function Profile() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId } = useParams(); // URLパラメータからuserIdを取得
  const [user, setUser] = useState(null); // Combined Cognito + App DB user
  const [cognitoSub, setCognitoSub] = useState(null); // Store Cognito sub (ID)
  const [currentUserId, setCurrentUserId] = useState(null); // ログイン中のユーザーID
  const [isOwnProfile, setIsOwnProfile] = useState(false); // 自分のプロフィールかどうか
  const [formData, setFormData] = useState({ // Initialize with default structure
      user_type: "",
      nickname: "",
      prefecture: "",
      bike_maker: "",
      bike_model: "",
      shooting_genres: [],
      price_range_min: "",
      price_range_max: "",
      equipment: "",
      bio: "",
      profile_image: "", // Store S3 key or null
      portfolio_website: "",
      instagram_url: "",
      twitter_url: "",
      youtube_url: "",
      special_conditions: [],
      is_accepting_requests: false
  });
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(""); // For errors
  const [profileImageUrl, setProfileImageUrl] = useState(null); // Display URL for profile image
  const [isFirstTimeProfileSetup, setIsFirstTimeProfileSetup] = useState(false); // 初回プロフィール登録フラグ

  // --- Fetch User Data ---
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoadingUser(true);
      setErrorMessage(""); // Clear previous errors
      try {
        // 現在のログインユーザーを取得
        let cognitoUser, attributes;
        if (useMock) {
          cognitoUser = await mockAuthService.getCurrentUser();
          attributes = await mockAuthService.fetchUserAttributes();
        } else {
          cognitoUser = await getCurrentUser();
          attributes = await fetchUserAttributes();
        }
        const currentId = cognitoUser.userId; // Get the unique user ID
        setCurrentUserId(currentId);
        setCognitoSub(currentId);

        // URLパラメータでuserIdが指定されていない場合は、自分のプロフィールにリダイレクト
        if (!userId) {
          console.log('No userId in URL, redirecting to own profile');
          navigate(`/profile/${currentId}`, { replace: true });
          return;
        }
        
        // 自分のプロフィールかどうかを判定
        const isOwn = userId === currentId;
        setIsOwnProfile(isOwn);

        console.log(`Profile page - Current user: ${currentId}, Target user: ${userId}, IsOwn: ${isOwn}`);

        // Fetch user data from App DB (GraphQL)
        let userDataResult;
        if (useMock) {
          console.log("🔍 Fetching user data for ID:", userId, "(Mock)");
          userDataResult = await mockAPIService.getUser({ id: userId });
        } else {
          const client = generateClient();
          console.log("🔍 Fetching user data for ID:", userId);
          console.log("🔍 Current Cognito user ID:", currentId);
          console.log("🔍 Auth mode: userPool");
          
          userDataResult = await client.graphql({
            query: getUser,
            variables: { id: userId },
            authMode: 'userPool' // Cognito User Pools認証を使用
          });
        }
        
        console.log("📥 Raw GraphQL result:", userDataResult);
        const appUser = userDataResult.data.getUser;
        console.log("📥 Fetched appUser from DB:", appUser);

        if (appUser) {
          const userData = { ...attributes, ...appUser };
          
          setUser(userData);
          setFormData({ // Populate form with fetched data
             user_type: appUser.user_type || "",
             nickname: appUser.nickname || attributes.name || "", // Fallback to Cognito name
             prefecture: appUser.prefecture || "",
             bike_maker: appUser.bike_maker || "",
             bike_model: appUser.bike_model || "",
             shooting_genres: appUser.shooting_genres || [],
             price_range_min: appUser.price_range_min ?? "", // Use ?? for null/undefined
             price_range_max: appUser.price_range_max ?? "",
             equipment: appUser.equipment || "",
             bio: appUser.bio || "",
             profile_image: appUser.profile_image || null, // S3 Key
             portfolio_website: appUser.portfolio_website || "",
             instagram_url: appUser.instagram_url || "",
             twitter_url: appUser.twitter_url || "",
             youtube_url: appUser.youtube_url || "",
             special_conditions: appUser.special_conditions || [],
             is_accepting_requests: appUser.is_accepting_requests || false
           });
           // Fetch profile image URL if key exists
           if (appUser.profile_image) {
               fetchProfileImageUrl(appUser.profile_image);
           } else {
               setProfileImageUrl(null);
           }
        } else {
          // Handle case where user exists in Cognito but not in App DB (e.g., first login after signup)
          console.warn("User data not found in DB for Cognito user:", userId);
          
          // 自分のプロフィールの場合のみ、初回登録として扱う
          if (isOwn) {
            setUser({ ...attributes, id: userId }); // Use Cognito data + ID
            setFormData({ // Populate form with Cognito data where possible
                nickname: attributes.name || attributes.email?.split('@')[0] || "",
                // Reset other fields or set defaults
                user_type: "", prefecture: "", bike_maker: "", bike_model: "",
                shooting_genres: [], price_range_min: "", price_range_max: "",
                equipment: "", bio: "", profile_image: null, portfolio_website: "",
                instagram_url: "", twitter_url: "", youtube_url: "",
                special_conditions: [], is_accepting_requests: false
            });
            setProfileImageUrl(null);
            setIsFirstTimeProfileSetup(true); // 初回プロフィール登録フラグを設定
            setSuccessMessage("BikeMatchへようこそ！プロフィール情報を入力してください。");
          } else {
            // 他人のプロフィールが存在しない場合
            setErrorMessage("このユーザーのプロフィールは存在しません。");
          }
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        
        // 認証エラーの場合
        if (error.message === 'The user is not authenticated' || 
            error.name === 'NotAuthorizedException' ||
            error.message?.includes('NotAuthorizedException') ||
            error.message?.includes('Unauthorized')) {
          console.log("🔐 User not authenticated, redirecting to home");
          navigate('/');
          return;
        }
        
        // GraphQLエラーの場合
        if (error.errors && error.errors.length > 0) {
          console.error("❌ GraphQL errors:", error.errors);
          const firstError = error.errors[0];
          if (firstError.errorType === 'Unauthorized') {
            console.log("🔐 GraphQL Unauthorized error, redirecting to home");
            navigate('/');
            return;
          }
        }
        
        // その他のエラーの場合
        setErrorMessage("ユーザーデータの取得に失敗しました。ページを再読み込みしてください。");
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId, navigate]); // userIdが変わったら再取得

    // Function to get temporary URL for S3 image
    const fetchProfileImageUrl = async (key) => {
        if (!key) return;
        try {
            const url = await getUrl({ key }); // Amplify v6 Storage API
            setProfileImageUrl(url.url.toString());
        } catch (error) {
            console.error("Error fetching profile image URL:", error);
            setProfileImageUrl(null); // Reset on error
        }
    };


  // --- Fetch Portfolio Data ---
  const { data: portfolio = [], isLoading: isLoadingPortfolio } = useQuery({
    queryKey: ['my-portfolio', cognitoSub], // Use cognitoSub as part of the key
    queryFn: async () => {
      if (!cognitoSub || formData.user_type !== 'photographer') return [];
      try {
        // Amplify API (GraphQL)
        let result;
        if (useMock) {
          result = await mockAPIService.listPortfolios({
            filter: { photographer_id: { eq: cognitoSub } }
          });
        } else {
          const client = generateClient();
          result = await client.graphql({
            query: listPortfolios,
            variables: {
              filter: { photographer_id: { eq: cognitoSub } } // Filter by user ID
              // limit: MAX_PORTFOLIO_IMAGES // Optional: Limit results if needed
            },
            authMode: 'userPool' // Cognito User Pools認証を使用
          });
        }
        
        const items = result.data?.listPortfolios?.items || [];
        
        // S3キーから署名付きURLを取得
        const itemsWithUrls = await Promise.all(
          items.map(async (item) => {
            let imageUrl = null;
            if (item.image_key) {
              try {
                const urlResult = await getUrl({ key: item.image_key });
                imageUrl = urlResult.url.toString();
              } catch (error) {
                console.error(`Error fetching URL for ${item.image_key}:`, error);
              }
            }
            return { ...item, imageUrl };
          })
        );
        
        return itemsWithUrls;
      } catch (error) {
        console.error('Portfolio fetch error:', error);
        // 初回ユーザーの場合はポートフォリオが存在しないのが正常なので、エラーメッセージは表示しない
        return [];
      }
    },
    enabled: !!cognitoSub && formData.user_type === 'photographer', // Enable only for photographer after ID is known
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // --- Update Profile Mutation ---
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      if (!cognitoSub) {
        console.error("cognitoSub is null");
        throw new Error("User ID not available");
      }
      setErrorMessage(""); // Clear previous errors

      console.log("Starting profile save with cognitoSub:", cognitoSub);
      console.log("Profile data received:", profileData);
      console.log("Current user state:", user);

      // Prepare data for GraphQL mutation
      const inputData = {
        id: cognitoSub, // Crucial: Provide the ID for update
        user_type: profileData.user_type || null,
        nickname: profileData.nickname,
        prefecture: profileData.prefecture || null,
        bike_maker: profileData.bike_maker || null,
        bike_model: profileData.bike_model || null,
        shooting_genres: profileData.shooting_genres || [],
        price_range_min: profileData.price_range_min === "" ? null : parseFloat(profileData.price_range_min),
        price_range_max: profileData.price_range_max === "" ? null : parseFloat(profileData.price_range_max),
        equipment: profileData.equipment || null,
        bio: profileData.bio || null,
        profile_image: profileData.profile_image || null,
        portfolio_website: profileData.portfolio_website || null,
        instagram_url: profileData.instagram_url || null,
        twitter_url: profileData.twitter_url || null,
        youtube_url: profileData.youtube_url || null,
        special_conditions: profileData.special_conditions || [],
        is_accepting_requests: profileData.is_accepting_requests !== undefined ? profileData.is_accepting_requests : true
      };
      
      console.log("Saving profile with data:", inputData);
      console.log("🔍 Cognito Sub:", cognitoSub);
      console.log("🔍 Timestamp:", new Date().toISOString());

      // Amplify API (GraphQL)
      let result;
      if (useMock) {
        try {
          console.log("Saving user profile... (Mock)");
          
          // 新規ユーザーか既存ユーザーかを判定
          const isNewUser = !user || !user.id;
          
          if (isNewUser) {
            console.log("Creating new user profile... (Mock)");
            result = await mockAPIService.createUser({ input: inputData });
            console.log("Create successful:", result);
            return result.data.createUser;
          } else {
            console.log("Updating existing user profile... (Mock)");
            result = await mockAPIService.updateUser({ input: inputData });
            console.log("Update successful:", result);
            return result.data.updateUser;
          }
        } catch (error) {
          console.error("Mock API error:", error);
          throw error;
        }
      } else {
        const client = generateClient();
        
        try {
          console.log("Saving user profile...");
          
          // 新規ユーザーか既存ユーザーかを判定
          // 登録時にDBにレコードが作成されているので、基本的にupdateUserを使用
          const isNewUser = !user || !user.id;
          
          if (isNewUser) {
            console.log("Creating new user profile...");
            result = await client.graphql({
              query: createUser,
              variables: { input: inputData },
              authMode: 'userPool'
            });
            console.log("Create successful:", result);
            return result.data.createUser;
          } else {
            console.log("Updating existing user profile...");
            result = await client.graphql({
              query: updateUser,
              variables: { input: inputData },
              authMode: 'userPool'
            });
            console.log("Update successful:", result);
            return result.data.updateUser;
          }
        } catch (error) {
          console.error("GraphQL update error:", error);
          throw error;
        }
      }
    },
    onSuccess: (updatedUserData) => {
      setSuccessMessage("プロフィールを更新しました");
      // Update local state immediately for better UX
      setUser(prev => ({ ...prev, ...updatedUserData }));
      setFormData(prev => ({ ...prev, ...updatedUserData })); // Update form too in case some fields were transformed
      // If profile image key changed, refetch URL
      if (formData.profile_image !== updatedUserData.profile_image) {
          fetchProfileImageUrl(updatedUserData.profile_image);
      }
      // Invalidate queries to ensure consistency, especially if Layout uses separate query
      queryClient.invalidateQueries({ queryKey: ['user', cognitoSub] }); // Invalidate specific user query
      queryClient.invalidateQueries({ queryKey: ['photographers'] }); // Invalidate list if displayed elsewhere

      // Delay reload slightly to allow state updates and message visibility
      setTimeout(() => {
        setSuccessMessage(""); // Clear message after a delay
        
        // 初回プロフィール登録完了の場合、フラグをリセットしてホーム画面にリダイレクト
        if (isFirstTimeProfileSetup) {
          setIsFirstTimeProfileSetup(false);
          window.location.href = '/';
        }
      }, 2000); // Show success for 2 seconds
    },
    onError: (error) => {
        console.error("Profile update failed:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        let errorMessage = '不明なエラー';
        
        if (error.errors && error.errors.length > 0) {
          errorMessage = error.errors[0].message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        setErrorMessage(`プロフィールの更新に失敗しました: ${errorMessage}`);
    }
  });

  // --- Add Portfolio Mutation ---
  const addPortfolioMutation = useMutation({
    mutationFn: async (portfolioData) => {
      if (!cognitoSub) throw new Error("User ID not available");
      setErrorMessage("");

      const inputData = {
        photographer_id: cognitoSub, // Link to the user
        image_key: portfolioData.image_key, // S3 Key
        // title: portfolioData.title || "", // Add fields if your schema has them
        // description: portfolioData.description || "",
        // You might want owner field automatically handled by AppSync/DataStore auth rules
      };
      console.log("Adding portfolio:", inputData);

      // Amplify API (GraphQL)
      let result;
      if (useMock) {
        result = await mockAPIService.createPortfolio({ input: inputData });
        return result.data.createPortfolio;
      } else {
        const client = generateClient();
        result = await client.graphql({
          query: createPortfolio,
          variables: { input: inputData },
          authMode: 'userPool' // Cognito User Pools認証を使用
        });
        return result.data.createPortfolio;
      }
    },
    onSuccess: (newPortfolioItem) => {
      // Invalidate portfolio query to refetch
      queryClient.invalidateQueries({ queryKey: ['my-portfolio', cognitoSub] });
       setSuccessMessage("ポートフォリオ画像を追加しました。");
       setTimeout(() => setSuccessMessage(""), 2000);
    },
    onError: (error) => {
        console.error("Add portfolio failed:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        const errorMessage = error.errors?.[0]?.message || error.message || '不明なエラー';
        setErrorMessage(`ポートフォリオの追加に失敗しました: ${errorMessage}`);
    }
  });

  // --- Delete Portfolio Mutation ---
  const deletePortfolioMutation = useMutation({
    mutationFn: async (portfolioId) => {
       setErrorMessage("");
       console.log("Deleting portfolio:", portfolioId);
       // --- Amplify API (GraphQL) ---
       // You need the item's ID for deletion
       const itemToDelete = portfolio.find(item => item.id === portfolioId);
       if (!itemToDelete) throw new Error("Portfolio item not found");

       const inputData = {
         id: portfolioId
       };
       let result;
       if (useMock) {
         result = await mockAPIService.deletePortfolio({ input: inputData });
         return result.data.deletePortfolio;
       } else {
         const client = generateClient();
         result = await client.graphql({
           query: deletePortfolio,
           variables: { input: inputData },
           authMode: 'userPool' // Cognito User Pools認証を使用
         });
         return result.data.deletePortfolio;
       }
    },
    onSuccess: (deletedItem) => {
        console.log("Deleted portfolio:", deletedItem?.id);
        // Invalidate portfolio query to refetch
        queryClient.invalidateQueries({ queryKey: ['my-portfolio', cognitoSub] });
        setSuccessMessage("ポートフォリオ画像を削除しました。");
        setTimeout(() => setSuccessMessage(""), 2000);
    },
    onError: (error) => {
        console.error("Delete portfolio failed:", error);
        setErrorMessage(`ポートフォリオの削除に失敗しました: ${error.message || '不明なエラー'}`);
    }
  });

  // --- Event Handlers ---

  // Trigger file input for profile image
  const triggerProfileImageUpload = () => {
      document.getElementById('profile-image-upload')?.click();
  };

  // Handle profile image selection (直接アップロード、切り抜きなし)
  const handleProfileImageSelect = async (e) => {
      const file = e.target.files?.[0];
      if (!file || !cognitoSub) return;
      
      setUploadingImage(true);
      setErrorMessage("");
      setSuccessMessage("");
      
      try {
          // Generate a unique key for S3
          const fileExtension = file.name.split('.').pop() || 'jpg';
          const fileName = `profile-images/${cognitoSub}-profile.${fileExtension}`;

          // --- Amplify Storage ---
          const result = await uploadData({
            key: fileName,
            data: file,
            options: {
              contentType: file.type,
            }
          }).result;
          console.log("Profile image uploaded:", result);
          // --------------------

          // Update form data with the S3 key
          setFormData({ ...formData, profile_image: result.key });
          // Fetch and display the new image immediately
          fetchProfileImageUrl(result.key);
          setSuccessMessage("プロフィール画像を更新しました。変更を保存してください。");

      } catch (error) {
          console.error("Error uploading profile image:", error);
          setErrorMessage("プロフィール画像のアップロードに失敗しました。");
      } finally {
          setUploadingImage(false);
          e.target.value = ''; // Reset file input
      }
  };


  const handlePortfolioUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !cognitoSub) return;

    const remainingSlots = MAX_PORTFOLIO_IMAGES - portfolio.length;
    if (remainingSlots <= 0) {
      alert(`ポートフォリオは最大${MAX_PORTFOLIO_IMAGES}枚までです`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      alert(`${remainingSlots}枚のみアップロードします（最大${MAX_PORTFOLIO_IMAGES}枚）`);
    }

    setUploadingPortfolio(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
        // 複数ファイルを順番にアップロード
        for (const file of filesToUpload) {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(7);
          const fileName = `portfolio/${cognitoSub}/${timestamp}-${randomStr}-${file.name}`;

          // --- Amplify Storage ---
          const result = await uploadData({
            key: fileName,
            data: file,
            options: {
              contentType: file.type,
            }
          }).result;
          console.log("Portfolio image uploaded:", result);

          // Add to portfolio DB via mutation
          await addPortfolioMutation.mutateAsync({ image_key: result.key });
        }

        setSuccessMessage(`${filesToUpload.length}枚のポートフォリオ画像を追加しました。`);
        setTimeout(() => setSuccessMessage(""), 2000);

    } catch (error) {
        console.error("Error uploading portfolio image:", error);
        setErrorMessage("ポートフォリオ画像のアップロードに失敗しました。");
    } finally {
        setUploadingPortfolio(false);
        e.target.value = ''; // Reset file input
    }
  };

  // Toggle handlers remain the same
  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
        ...prev,
        shooting_genres: prev.shooting_genres.includes(genre)
            ? prev.shooting_genres.filter(g => g !== genre)
            : [...prev.shooting_genres, genre]
    }));
  };
  const handleConditionToggle = (condition) => {
     setFormData(prev => ({
        ...prev,
        special_conditions: prev.special_conditions.includes(condition)
            ? prev.special_conditions.filter(c => c !== condition)
            : [...prev.special_conditions, condition]
    }));
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMessage(""); // Clear message before submitting
    setErrorMessage("");
    
    // 重複実行の防止
    if (updateProfileMutation.isPending) {
      console.log("⚠️ Update already in progress, ignoring duplicate submission");
      return;
    }
    
    // Basic validation (can be enhanced with Zod etc.)
    if (!formData.user_type) {
        setErrorMessage("ユーザータイプを選択してください。");
        return;
    }
    if (!formData.nickname?.trim()) {
        setErrorMessage("ニックネームを入力してください。");
        return;
    }
     if (!formData.prefecture) {
         setErrorMessage("都道府県を選択してください。");
         return;
     }
    updateProfileMutation.mutate(formData);
  };

  // --- Render Logic ---

  if (isLoadingUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
         {/* More detailed skeleton */}
         <Skeleton className="h-10 w-1/3 mb-4" />
         <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>
         <Card><CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></CardContent></Card>
         <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  // 自分のプロフィールでない場合、かつユーザーデータがない場合はエラー表示
  if (!isOwnProfile && !user && !isLoadingUser) {
      return (
          <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
              <div className="text-center">
                  <p className="text-red-600 mb-4">このユーザーのプロフィールは存在しません。</p>
                  <button 
                      onClick={() => navigate('/home-for-register')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                      ホームに戻る
                  </button>
              </div>
          </div>
      );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isOwnProfile ? 'プロフィール編集' : `${user?.nickname || 'ユーザー'}のプロフィール`}
          </h1>
          {!isOwnProfile && (
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate(`/messages/${currentUserId}/${userId}`)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                メッセージを送る
              </Button>
              <Badge variant="outline" className="text-sm">閲覧モード</Badge>
            </div>
          )}
        </div>

        {/* Success and Error Messages */}
        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
             <AlertCircle className="h-4 w-4" /> {/* Or CheckCircle */}
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
         {errorMessage && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200 text-red-800">
             <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}


        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報カード */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Type Select */}
              <div>
                <Label htmlFor="userType">ユーザータイプ *</Label>
                <Select
                  name="userType"
                  value={formData.user_type || ""}
                  onValueChange={(value) => setFormData({ ...formData, user_type: value })}
                  required
                  disabled={!isOwnProfile}
                >
                  <SelectTrigger id="userType">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rider">ライダー（撮影を依頼する側）</SelectItem>
                    <SelectItem value="photographer">フォトグラファー（撮影する側）</SelectItem>
                  </SelectContent>
                </Select>
                 <p className="text-xs text-gray-500 mt-2">
                   {formData.user_type === 'rider' ? '※ ライダーはフォトグラファーを探して撮影を依頼できます'
                    : formData.user_type === 'photographer' ? '※ フォトグラファーはライダーからの依頼を受けることができます'
                    : '※ ユーザータイプを選択してください'}
                 </p>
              </div>

              {/* Nickname Input */}
              <div>
                <Label htmlFor="nickname">ニックネーム *</Label>
                <Input
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="ニックネームを入力"
                  required
                  disabled={!isOwnProfile}
                />
              </div>

               {/* Prefecture Select */}
              <div>
                <Label htmlFor="prefecture">都道府県 *</Label>
                <Select
                  name="prefecture"
                  value={formData.prefecture || ""}
                  onValueChange={(value) => setFormData({ ...formData, prefecture: value })}
                  required
                  disabled={!isOwnProfile}
                >
                  <SelectTrigger id="prefecture">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

               {/* Profile Image Upload */}
               <div>
                 <Label>プロフィール画像</Label>
                 <div className="mt-2 flex items-center gap-4">
                   {/* Image Preview */}
                   <div className="relative w-24 h-24 flex-shrink-0">
                     {profileImageUrl ? (
                       <img
                         src={profileImageUrl}
                         alt="Profile Preview"
                         className="w-full h-full object-cover object-center rounded-lg border-2 border-gray-200"
                       />
                     ) : (
                       <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                         <User className="w-10 h-10" />
                       </div>
                     )}
                     {uploadingImage && (
                         <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                             <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                         </div>
                     )}
                   </div>
                  {/* Upload/Remove Buttons - 自分のプロフィールの場合のみ表示 */}
                  {isOwnProfile && (
                    <div className="space-y-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={triggerProfileImageUpload}
                            disabled={uploadingImage}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            画像を変更
                        </Button>
                        {formData.profile_image && ( // Show remove button only if image exists
                            <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                                setFormData({ ...formData, profile_image: null });
                                setProfileImageUrl(null); // Clear preview
                                // Optionally add Storage.remove(formData.profile_image) in mutation or here
                            }}
                            disabled={uploadingImage}
                            >
                            <X className="w-4 h-4 mr-1" />
                            削除
                            </Button>
                        )}
                    </div>
                  )}
                   {/* Hidden file input */}
                   <input
                       id="profile-image-upload"
                       type="file"
                       accept="image/jpeg, image/png, image/webp, image/gif" // Specify accepted types
                       onChange={handleProfileImageSelect}
                       className="hidden"
                       disabled={uploadingImage}
                   />
                 </div>
               </div>

              {/* Bio Textarea */}
              <div>
                <Label htmlFor="bio">自己紹介</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="自己紹介、活動内容、撮影スタイルなどを入力..."
                  rows={5} // Increased rows
                  maxLength={500} // Example max length
                  className="mt-1"
                />
                 <p className="text-xs text-gray-500 mt-1 text-right">{formData.bio?.length || 0} / 500 文字</p>
              </div>
            </CardContent>
          </Card>

           {/* SNSアカウント カード */}
           <Card className="shadow-lg border-none">
             <CardHeader>
               <CardTitle>SNS・Webサイト</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {/* Instagram */}
               <div className="flex items-center gap-3">
                 <Label htmlFor="instagram_url" className="w-24 flex-shrink-0 flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.849-.07c-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849C2.013 4.877 3.528 3.322 6.78 3.174c1.266-.057 1.645-.069 4.849-.069zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                   Instagram
                 </Label>
                 <Input
                   id="instagram_url" type="url"
                   value={formData.instagram_url}
                   onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                   placeholder="https://instagram.com/..."
                   className="flex-grow"
                 />
               </div>
               {/* X (Twitter) */}
               <div className="flex items-center gap-3">
                 <Label htmlFor="twitter_url" className="w-24 flex-shrink-0 flex items-center gap-1.5">
                   <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                   X
                 </Label>
                 <Input
                   id="twitter_url" type="url"
                   value={formData.twitter_url}
                   onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                   placeholder="https://x.com/..."
                   className="flex-grow"
                 />
               </div>
               {/* YouTube */}
               <div className="flex items-center gap-3">
                 <Label htmlFor="youtube_url" className="w-24 flex-shrink-0 flex items-center gap-1.5">
                   <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                   YouTube
                 </Label>
                 <Input
                   id="youtube_url" type="url"
                   value={formData.youtube_url}
                   onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                   placeholder="https://youtube.com/..."
                   className="flex-grow"
                 />
               </div>
                {/* Portfolio Website */}
               <div className="flex items-center gap-3">
                 <Label htmlFor="portfolio_website" className="w-24 flex-shrink-0 flex items-center gap-1.5">
                   <LinkIcon className="w-4 h-4 text-blue-600" />
                   Webサイト
                 </Label>
                 <Input
                   id="portfolio_website" type="url"
                   value={formData.portfolio_website}
                   onChange={(e) => setFormData({ ...formData, portfolio_website: e.target.value })}
                   placeholder="https://example.com"
                   className="flex-grow"
                 />
               </div>
               <p className="text-xs text-gray-500 pt-2">
                 ※ プロフィールページにリンクが表示されます。
               </p>
             </CardContent>
           </Card>


          {/* Rider Specific Fields */}
          {formData.user_type === 'rider' && (
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>ライダー情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="bikeMaker">バイクメーカー</Label>
                  <Input
                    id="bikeMaker"
                    value={formData.bike_maker}
                    onChange={(e) => setFormData({ ...formData, bike_maker: e.target.value })}
                    placeholder="例: Honda, Yamaha"
                  />
                </div>
                <div>
                  <Label htmlFor="bikeModel">バイクモデル</Label>
                  <Input
                    id="bikeModel"
                    value={formData.bike_model}
                    onChange={(e) => setFormData({ ...formData, bike_model: e.target.value })}
                    placeholder="例: CBR1000RR, YZF-R1"
                  />
                </div>
                 {/* 希望ジャンル (Optional for Rider) */}
                 {/* <div>
                   <Label>希望する撮影ジャンル (任意)</Label>
                   <div className="flex flex-wrap gap-2 mt-2">
                     {GENRES.map((genre) => (
                       <Badge
                         key={`rider-${genre}`}
                         onClick={() => handleGenreToggle(genre)}
                         variant={formData.shooting_genres.includes(genre) ? "default" : "outline"}
                         className={`cursor-pointer px-3 py-1 text-sm transition-all ${
                             formData.shooting_genres.includes(genre) ? "bg-red-600 border-red-600 text-white hover:bg-red-700" : ""
                         }`}
                       >
                         {genre}
                       </Badge>
                     ))}
                   </div>
                 </div> */}
              </CardContent>
            </Card>
          )}

          {/* Photographer Specific Fields */}
          {formData.user_type === 'photographer' && (
            <>
              {/* フォトグラファー情報カード (募集状況、料金) */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>フォトグラファー設定</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   {/* Accepting Requests Checkbox */}
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <Checkbox
                      id="accepting-requests"
                      checked={formData.is_accepting_requests}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_accepting_requests: !!checked })} // Ensure boolean
                    />
                    <Label htmlFor="accepting-requests" className="text-sm font-medium cursor-pointer">
                      現在撮影依頼を募集する
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 -mt-4"> {/* Negative margin */}
                    ※ チェックを入れると、あなたのプロフィールが検索結果に表示され、ライダーからの依頼を受け付けられるようになります。
                  </p>

                  {/* Price Range */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="priceMin">料金目安（最小）</Label>
                      <Input
                        id="priceMin" type="number" min="0" step="1000" // Add min/step
                        value={formData.price_range_min}
                        onChange={(e) => setFormData({ ...formData, price_range_min: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        placeholder="¥ 10,000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="priceMax">料金目安（最大）</Label>
                      <Input
                        id="priceMax" type="number" min="0" step="1000"
                        value={formData.price_range_max}
                        onChange={(e) => setFormData({ ...formData, price_range_max: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                        placeholder="¥ 50,000"
                        className="mt-1"
                      />
                    </div>
                  </div>
                   <p className="text-xs text-gray-500">※ 省略可。目安として表示されます。実際の料金は依頼内容に応じて相談してください。</p>

                  {/* Equipment */}
                  <div>
                    <Label htmlFor="equipment">使用機材</Label>
                    <Textarea
                        id="equipment"
                        value={formData.equipment}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                        placeholder="カメラ、レンズ、ドローンなど..."
                        rows={3}
                        maxLength={300}
                        className="mt-1"
                    />
                     <p className="text-xs text-gray-500 mt-1 text-right">{formData.equipment?.length || 0} / 300 文字</p>
                  </div>
                </CardContent>
              </Card>

              {/* ポートフォリオカード */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-red-600" />
                      ポートフォリオ画像
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {portfolio.length} / {MAX_PORTFOLIO_IMAGES}枚
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.length >= MAX_PORTFOLIO_IMAGES && !isLoadingPortfolio && (
                    <Alert variant="destructive" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        ポートフォリオは最大{MAX_PORTFOLIO_IMAGES}枚です。追加するには既存の画像を削除してください。
                      </AlertDescription>
                    </Alert>
                  )}

                  {isLoadingPortfolio ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          {[...Array(3)].map((_, i) => <Skeleton key={`skel-port-${i}`} className="w-full aspect-square rounded-lg" />)}
                      </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {portfolio.map((item) => (
                        <div key={item.id} className="relative group aspect-square"> {/* Ensure aspect ratio */}
                          {item.image_key && ( // Display image only if key exists
                              <img
                              // Use Storage.get to fetch URL - ideally use state managed URLs
                              // For simplicity here, assuming a way to get URL or handle keys directly
                              src={item.imageUrl || `https://via.placeholder.com/150?text=Loading...`} // Placeholder while URL loads
                              alt={item.title || "ポートフォリオ画像"}
                              className="w-full h-full object-cover rounded-lg bg-gray-100" // Add bg for loading
                              // onLoad={(e) => { /* Handle loaded state if \ */ }}
                              onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }} // Simple error placeholder
                              />
                          )}
                           {/* Add loading state for Storage.get if needed */}
                           {/* {!item.imageUrl && <Skeleton className="absolute inset-0 rounded-lg" />} */}

                          <button
                            type="button"
                            onClick={() => !deletePortfolioMutation.isPending && deletePortfolioMutation.mutate(item.id)}
                            disabled={deletePortfolioMutation.isPending && deletePortfolioMutation.variables === item.id} // Disable only the specific button being deleted
                            className={`absolute top-1.5 right-1.5 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed`}
                            aria-label="画像を削除"
                          >
                             {deletePortfolioMutation.isPending && deletePortfolioMutation.variables === item.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                             ) : (
                                <X className="w-4 h-4" />
                             )}
                          </button>
                        </div>
                      ))}
                      {/* Upload Slot */}
                      {portfolio.length < MAX_PORTFOLIO_IMAGES && (
                        <label className={`flex items-center justify-center aspect-square border-2 border-dashed rounded-lg transition-colors bg-gray-50 ${uploadingPortfolio ? 'cursor-not-allowed opacity-50 border-gray-300' : 'cursor-pointer border-gray-300 hover:border-red-500'}`}>
                          <input
                            type="file"
                            accept="image/jpeg, image/png, image/webp, image/gif"
                            onChange={handlePortfolioUpload}
                            className="hidden"
                            disabled={uploadingPortfolio}
                            multiple
                          />
                          <div className="flex flex-col items-center text-center">
                            {uploadingPortfolio ? (
                                <>
                                 <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-400 mb-1"></div>
                                 <span className="text-xs text-gray-500">アップロード中</span>
                                </>
                            ) : (
                                <>
                                  <Plus className="w-8 h-8 text-gray-400 mb-1" />
                                  <span className="text-xs text-gray-500 px-2">画像を追加</span>
                                </>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    ※ クリックして画像を追加・削除できます。最大{MAX_PORTFOLIO_IMAGES}枚まで。
                  </p>
                </CardContent>
              </Card>

               {/* こだわり条件カード */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>こだわり条件・対応可能サービス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2"> {/* Reduced gap */}
                    {SPECIAL_CONDITIONS.map((condition) => (
                      <Badge
                        key={condition}
                        onClick={() => handleConditionToggle(condition)}
                         variant={formData.special_conditions.includes(condition) ? "default" : "outline"}
                         className={`cursor-pointer px-3 py-1.5 text-sm transition-all rounded-full ${ // rounded-full
                             formData.special_conditions.includes(condition) ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                         }`}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    ※ 提供可能なサービスや対応可能な条件を選択してください (複数選択可)。
                  </p>
                </CardContent>
              </Card>

              {/* 得意ジャンルカード */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>得意な撮影ジャンル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2"> {/* Reduced gap */}
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        variant={formData.shooting_genres.includes(genre) ? "default" : "outline"}
                         className={`cursor-pointer px-3 py-1.5 text-sm transition-all rounded-full ${ // rounded-full
                             formData.shooting_genres.includes(genre) ? "bg-red-600 border-red-600 text-white hover:bg-red-700" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                         }`}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                   <p className="text-xs text-gray-500 mt-4">
                     ※ 得意な撮影ジャンルを選択してください (複数選択可)。
                   </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Save Button - 自分のプロフィールの場合のみ表示 */}
          {isOwnProfile && (
            <div className="mt-8 space-y-4">
              {/* 初回プロフィール登録時の特別なメッセージ */}
              {isFirstTimeProfileSetup && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        初回プロフィール登録
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>プロフィール情報を入力して保存してください。保存後、BikeMatchのメイン機能をご利用いただけます。</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-lg font-semibold"
                disabled={updateProfileMutation.isPending || uploadingImage || uploadingPortfolio}
              >
                <Save className="w-5 h-5 mr-2" />
                {updateProfileMutation.isPending ? "保存中..." : "プロフィールを保存"}
              </Button>
              
              {/* 初回プロフィール登録時はログアウトボタンのみ表示 */}
              {isFirstTimeProfileSetup && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // ログアウト処理
                    window.location.href = '/logout';
                  }}
                >
                  ログアウト
                </Button>
              )}
            </div>
          )}
        </form>

      </div>
    </div>
  );
}