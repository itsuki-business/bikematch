import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// --- Amplify v6 ---
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import mockAPIService from '@/services/mockAPIService';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUrl, uploadData } from 'aws-amplify/storage';
import { createUser } from '@/graphql/mutations';
// ---------------
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Upload, X, AlertCircle, CheckCircle } from "lucide-react";

// 都道府県リスト
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

// バイクメーカーリスト
const BIKE_MAKERS = [
  "Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", "BMW", "KTM", "Aprilia",
  "Triumph", "Harley-Davidson", "Indian", "Moto Guzzi", "MV Agusta", "その他"
];

// 撮影ジャンルリスト
const SHOOTING_GENRES = [
  "ポートレート", "風景", "ストリート", "スポーツ", "イベント", "商品撮影",
  "ウェディング", "ファッション", "料理", "建築", "その他"
];

// こだわり条件・対応可能サービス
const SPECIAL_CONDITIONS = [
  "早朝撮影対応", "夜間撮影対応", "雨天撮影対応", "屋内撮影対応",
  "屋外撮影対応", "移動撮影対応", "長時間撮影対応", "急な依頼対応",
  "編集・レタッチ込み", "RAWデータ提供", "即日納品対応", "その他"
];

export default function FirstTimeProfileSetup() {
  const navigate = useNavigate();
  const [cognitoSub, setCognitoSub] = useState(null);
  const [formData, setFormData] = useState({
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
    profile_image: null,
    portfolio_website: "",
    instagram_url: "",
    twitter_url: "",
    youtube_url: "",
    special_conditions: [],
    is_accepting_requests: true
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // ユーザー情報を取得
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        let cognitoUser, attributes;
        if (useMock) {
          cognitoUser = await mockAuthService.getCurrentUser();
          attributes = await mockAuthService.fetchUserAttributes();
          console.log('Mock user data:', cognitoUser, attributes);
          setCognitoSub(cognitoUser.generatedId || cognitoUser.userId);
          // Mock環境ではメールアドレスを正しく設定
          setUserEmail(attributes.email || cognitoUser.username || 'test@example.com');
        } else {
          cognitoUser = await getCurrentUser();
          attributes = await fetchUserAttributes();
          console.log('Production user data:', cognitoUser, attributes);
          setCognitoSub(cognitoUser.userId || cognitoUser.attributes?.sub);
          setUserEmail(attributes.email || '');
        }
        
        // フォームに初期値を設定
        setFormData(prev => ({
          ...prev,
          nickname: attributes.name || attributes.email?.split('@')[0] || ""
        }));
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Mock環境では認証エラーでも初回プロフィール登録ページに留まる
        if (useMock) {
          console.log('Mock environment: staying on first-time profile setup page');
          // Mock環境ではダミーのユーザーIDを設定
          setCognitoSub('mock-user-' + Date.now());
        } else {
          navigate('/');
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  // プロフィール保存処理
  const createProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      if (!cognitoSub) {
        throw new Error("User ID not available");
      }
      setErrorMessage("");

      const inputData = {
        id: cognitoSub,
        email: userEmail, // メールアドレスを追加
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
        is_accepting_requests: profileData.is_accepting_requests !== undefined ? profileData.is_accepting_requests : true,
        average_rating: 0,
        review_count: 0
      };
      
      console.log('FirstTimeProfileSetup - Creating user with inputData:', inputData);

       let result;
       if (useMock) {
         result = await mockAPIService.graphql({
           query: createUser,
           variables: { input: inputData },
           authMode: 'userPool'
         });
         return result.data.createUser;
       } else {
        const client = generateClient();
        result = await client.graphql({
          query: createUser,
          variables: { input: inputData },
          authMode: 'userPool'
        });
        return result.data.createUser;
      }
    },
    onSuccess: () => {
      setSuccessMessage("プロフィール登録が完了しました！");
      setErrorMessage("");
      
      // メール確認画面を表示
      setShowEmailVerification(true);
    },
    onError: (error) => {
      console.error("Profile creation failed:", error);
      setErrorMessage("プロフィール登録に失敗しました。もう一度お試しください。");
    }
  });

  // フォーム送信処理
  const handleSubmit = (e) => {
    e.preventDefault();
    
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
    
    createProfileMutation.mutate(formData);
  };

  // メール確認処理
  const handleEmailVerification = async () => {
    if (!verificationCode.trim()) {
      setErrorMessage("確認コードを入力してください。");
      return;
    }

    try {
      setErrorMessage("");
      
      // Mockまたは本番の認証サービスを使用
      if (useMock) {
        await mockAuthService.confirmSignUp({
          username: userEmail,
          confirmationCode: verificationCode.trim(),
        });
      } else {
        const { confirmSignUp } = await import('aws-amplify/auth');
        await confirmSignUp({
          username: userEmail,
          confirmationCode: verificationCode.trim(),
        });
      }
      
      console.log('Email verification successful');
      setSuccessMessage("メールアドレスの確認が完了しました！");
      
      // メール確認後、自動ログインを実行
      try {
        console.log('Starting auto-login after email verification...');
        if (useMock) {
          await mockAuthService.signIn({
            username: userEmail,
            password: 'mock-password' // Mock環境ではパスワードは不要
          });
        } else {
          // 本番環境では実際のパスワードが必要
          // ここでは一時的にログイン状態を設定
          console.log('Production auto-login would require password');
        }
        console.log('Auto-login successful');
      } catch (loginError) {
        console.error('Auto-login failed:', loginError);
        // ログインに失敗しても続行
      }
      
      // 確認完了後、ホームページに遷移
      console.log('Navigating to /home-for-register after email verification');
      setTimeout(() => {
        // ユーザーIDをパラメータとして渡す
        const userId = useMock ? mockAuthService.currentUser?.userId : cognitoSub;
        navigate(`/home-for-register?userId=${userId}`);
      }, 2000);
      
    } catch (error) {
      console.error('Email verification failed:', error);
      let errorMessage = "確認コードの認証に失敗しました。";
      if (error.code === 'CodeMismatchException') {
        errorMessage = '確認コードが正しくありません。';
      } else if (error.code === 'ExpiredCodeException') {
        errorMessage = '確認コードの有効期限が切れています。';
      } else if (error.code === 'NotAuthorizedException' && error.message.includes('already confirmed')) {
        errorMessage = 'このアカウントは既に確認済みです。';
        // 既に確認済みの場合は成功として処理
        console.log('Account already confirmed, navigating to /home-for-register');
        setTimeout(() => {
          // ユーザーIDをパラメータとして渡す
          const userId = useMock ? mockAuthService.currentUser?.userId : cognitoSub;
          navigate(`/home-for-register?userId=${userId}`);
        }, 2000);
        return;
      }
      setErrorMessage(errorMessage);
    }
  };

  // ジャンル選択処理
  const handleGenreToggle = (genre) => {
    setFormData(prev => ({
      ...prev,
      shooting_genres: prev.shooting_genres.includes(genre)
        ? prev.shooting_genres.filter(g => g !== genre)
        : [...prev.shooting_genres, genre]
    }));
  };

  // 条件選択処理
  const handleConditionToggle = (condition) => {
    setFormData(prev => ({
      ...prev,
      special_conditions: prev.special_conditions.includes(condition)
        ? prev.special_conditions.filter(c => c !== condition)
        : [...prev.special_conditions, condition]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BikeMatchへようこそ！
          </h1>
          <p className="text-gray-600">
            プロフィール情報を入力して、BikeMatchを始めましょう
          </p>
        </div>

        {/* 成功・エラーメッセージ */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ユーザータイプ */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  ユーザータイプ <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.user_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, user_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ユーザータイプを選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rider">ライダー</SelectItem>
                    <SelectItem value="photographer">フォトグラファー</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ニックネーム */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  ニックネーム <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                  placeholder="ニックネームを入力してください"
                />
              </div>

              {/* 都道府県 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  都道府県 <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.prefecture}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, prefecture: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((prefecture) => (
                      <SelectItem key={prefecture} value={prefecture}>
                        {prefecture}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* バイク情報（ライダーの場合） */}
          {formData.user_type === 'rider' && (
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>バイク情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* バイクメーカー */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">バイクメーカー</Label>
                  <Select
                    value={formData.bike_maker}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, bike_maker: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="バイクメーカーを選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {BIKE_MAKERS.map((maker) => (
                        <SelectItem key={maker} value={maker}>
                          {maker}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* バイクモデル */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">バイクモデル</Label>
                  <Input
                    value={formData.bike_model}
                    onChange={(e) => setFormData(prev => ({ ...prev, bike_model: e.target.value }))}
                    placeholder="バイクモデルを入力してください"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* フォトグラファー情報 */}
          {formData.user_type === 'photographer' && (
            <>
              {/* 撮影ジャンル */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>得意な撮影ジャンル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {SHOOTING_GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        variant={formData.shooting_genres.includes(genre) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1.5 text-sm transition-all rounded-full ${
                          formData.shooting_genres.includes(genre) 
                            ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" 
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* こだわり条件・対応可能サービス */}
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>こだわり条件・対応可能サービス</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {SPECIAL_CONDITIONS.map((condition) => (
                      <Badge
                        key={condition}
                        onClick={() => handleConditionToggle(condition)}
                        variant={formData.special_conditions.includes(condition) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-1.5 text-sm transition-all rounded-full ${
                          formData.special_conditions.includes(condition) 
                            ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700" 
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* 自己紹介 */}
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>自己紹介</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="自己紹介を入力してください"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* メール確認画面 */}
          {showEmailVerification && (
            <Card className="shadow-lg border-none bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  メールアドレス確認
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-blue-200 bg-blue-100 text-blue-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{userEmail}</strong> 宛に送信された確認コードを入力してください。<br/>
                    <span className="text-sm text-blue-600 mt-1 block">
                      ※ メールが届かない場合は、迷惑メールフォルダもご確認ください。
                    </span>
                    {useMock && (
                      <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                        <strong>Mock環境:</strong> 確認コードは <strong>123456</strong> です
                      </div>
                    )}
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                    確認コード
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="tracking-widest"
                    placeholder="------"
                    maxLength={6}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEmailVerification(false)}
                    className="flex-1"
                  >
                    戻る
                  </Button>
                  <Button
                    type="button"
                    onClick={handleEmailVerification}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    確認して完了
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 保存ボタン */}
          {!showEmailVerification && (
            <div className="text-center">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 text-lg font-semibold"
                disabled={createProfileMutation.isPending}
              >
                <Save className="w-5 h-5 mr-2" />
                {createProfileMutation.isPending ? "登録中..." : "プロフィールを登録"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
