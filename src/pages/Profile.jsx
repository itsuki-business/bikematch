
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Plus, Save, Camera, AlertCircle, Link as LinkIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

const GENRES = ["ツーリング", "サーキット", "ポートレート", "風景", "アクション", "スタジオ", "カスタム", "レース"];

const SPECIAL_CONDITIONS = [
  "遠征可能", "1日付き添い可能", "レタッチ可能", "データのみ",
  "印刷可能", "大判印刷対応", "即日納品可能", "夜間撮影可能"
];

const MAX_PORTFOLIO_IMAGES = 10;

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData({
        user_type: userData.user_type || "",
        nickname: userData.nickname || "",
        prefecture: userData.prefecture || "",
        bike_maker: userData.bike_maker || "",
        bike_model: userData.bike_model || "",
        shooting_genres: userData.shooting_genres || [],
        price_range_min: userData.price_range_min || "",
        price_range_max: userData.price_range_max || "",
        equipment: userData.equipment || "",
        bio: userData.bio || "",
        profile_image: userData.profile_image || "",
        portfolio_website: userData.portfolio_website || "",
        instagram_url: userData.instagram_url || "",
        twitter_url: userData.twitter_url || "",
        youtube_url: userData.youtube_url || "",
        special_conditions: userData.special_conditions || [],
        is_accepting_requests: userData.is_accepting_requests || false
      });
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: portfolio = [] } = useQuery({
    queryKey: ['my-portfolio', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const result = await base44.entities.Portfolio.filter({ photographer_id: user.id });
        return result || [];
      } catch (error) {
        console.error('Portfolio fetch error:', error);
        return [];
      }
    },
    enabled: !!user && user.user_type === 'photographer',
    staleTime: 0, // 常に最新データを取得
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: async (updatedUser) => {
      setSuccessMessage("プロフィールを更新しました");
      // 即座にユーザー情報を更新
      setUser(updatedUser);
      // クエリを無効化して再取得
      await queryClient.invalidateQueries(['user']);
      await queryClient.invalidateQueries(['my-portfolio']);
      await queryClient.invalidateQueries(['photographers']);
      // サイドバー更新のため、短い遅延後にリロード
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
  });

  const addPortfolioMutation = useMutation({
    mutationFn: (data) => base44.entities.Portfolio.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-portfolio']);
    },
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: (id) => base44.entities.Portfolio.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-portfolio']);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, profile_image: file_url });
    setUploadingImage(false);
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (portfolio.length >= MAX_PORTFOLIO_IMAGES) {
      alert(`ポートフォリオは最大${MAX_PORTFOLIO_IMAGES}枚までです`);
      return;
    }

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    addPortfolioMutation.mutate({
      photographer_id: user.id,
      image_url: file_url,
      title: "",
      description: ""
    });
  };

  const handleGenreToggle = (genre) => {
    const newGenres = formData.shooting_genres.includes(genre)
      ? formData.shooting_genres.filter(g => g !== genre)
      : [...formData.shooting_genres, genre];
    setFormData({ ...formData, shooting_genres: newGenres });
  };

  const handleConditionToggle = (condition) => {
    const newConditions = formData.special_conditions.includes(condition)
      ? formData.special_conditions.filter(c => c !== condition)
      : [...formData.special_conditions, condition];
    setFormData({ ...formData, special_conditions: newConditions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">プロフィール編集</h1>

        {successMessage && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>ユーザータイプ *</Label>
                <Select
                  value={formData.user_type || ""}
                  onValueChange={(value) => {
                    // ユーザータイプ変更時に即座にformDataを更新
                    setFormData({ ...formData, user_type: value });
                    // userステートも更新してリアルタイム反映
                    setUser({ ...user, user_type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rider">ライダー（撮影を依頼する側）</SelectItem>
                    <SelectItem value="photographer">フォトグラファー（撮影する側）</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">
                  {formData.user_type === 'rider'
                    ? '※ ライダーはフォトグラファーを探して撮影を依頼できます'
                    : formData.user_type === 'photographer'
                    ? '※ フォトグラファーはライダーからの依頼を受けることができます'
                    : '※ ユーザータイプを選択してください'}
                </p>
              </div>

              <div>
                <Label>ニックネーム *</Label>
                <Input
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  placeholder="ニックネームを入力"
                />
              </div>

              <div>
                <Label>都道府県 *</Label>
                <Select
                  value={formData.prefecture}
                  onValueChange={(value) => setFormData({ ...formData, prefecture: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((pref) => (
                      <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>プロフィール画像</Label>
                <div className="mt-2">
                  {formData.profile_image ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={formData.profile_image}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-lg border-4 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, profile_image: "" })}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 shadow-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors bg-gray-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="text-gray-400 text-sm">アップロード中...</div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">画像を選択</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label>自己紹介</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="自己紹介を入力"
                  rows={4}
                  spellCheck={false}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle>SNSアカウント</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram URL
                </Label>
                <Input
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="https://instagram.com/username"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  X URL
                </Label>
                <Input
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                  placeholder="https://x.com/username"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube URL
                </Label>
                <Input
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                  placeholder="https://youtube.com/@username"
                />
              </div>

              <p className="text-xs text-gray-500">
                ※ SNSアカウントを設定すると、プロフィールページに表示されます
              </p>
            </CardContent>
          </Card>

          {formData.user_type === 'rider' && (
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle>ライダー情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>バイクメーカー</Label>
                  <Input
                    value={formData.bike_maker}
                    onChange={(e) => setFormData({ ...formData, bike_maker: e.target.value })}
                    placeholder="例: Honda, Yamaha"
                  />
                </div>

                <div>
                  <Label>バイクモデル</Label>
                  <Input
                    value={formData.bike_model}
                    onChange={(e) => setFormData({ ...formData, bike_model: e.target.value })}
                    placeholder="例: CBR1000RR, YZF-R1"
                  />
                </div>

                <div>
                  <Label>希望する撮影ジャンル</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`cursor-pointer px-4 py-2 text-sm ${
                          formData.shooting_genres.includes(genre)
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {formData.user_type === 'photographer' && (
            <>
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>フォトグラファー情報</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <Checkbox
                      id="accepting-requests"
                      checked={formData.is_accepting_requests}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_accepting_requests: checked })}
                    />
                    <Label htmlFor="accepting-requests" className="text-sm font-medium cursor-pointer">
                      現在撮影依頼を募集する
                    </Label>
                  </div>
                  <p className="text-xs text-gray-600 -mt-2">
                    ※ チェックを入れると、ライダーからの撮影依頼を受け付けることができます。チェックを外すと検索結果に表示されません。
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label>料金目安（最小）</Label>
                      <Input
                        type="number"
                        value={formData.price_range_min}
                        onChange={(e) => setFormData({ ...formData, price_range_min: parseFloat(e.target.value) })}
                        placeholder="¥ 10,000"
                      />
                    </div>

                    <div>
                      <Label>料金目安（最大）</Label>
                      <Input
                        type="number"
                        value={formData.price_range_max}
                        onChange={(e) => setFormData({ ...formData, price_range_max: parseFloat(e.target.value) })}
                        placeholder="¥ 50,000"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      ポートフォリオサイトURL
                    </Label>
                    <Input
                      type="url"
                      value={formData.portfolio_website}
                      onChange={(e) => setFormData({ ...formData, portfolio_website: e.target.value })}
                      placeholder="https://example.com"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      ※ 外部のポートフォリオサイトやSNSのリンクを設定できます
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Camera className="w-5 h-5 text-red-600" />
                      ポートフォリオ画像
                    </div>
                    <Badge variant="outline" className="text-sm">
                      {portfolio?.length || 0} / {MAX_PORTFOLIO_IMAGES}枚
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio?.length >= MAX_PORTFOLIO_IMAGES && (
                    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        ポートフォリオは最大{MAX_PORTFOLIO_IMAGES}枚までです。追加する場合は既存の画像を削除してください。
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    {portfolio?.map((item) => (
                      <div key={item.id} className="relative group">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="w-full aspect-square object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => deletePortfolioMutation.mutate(item.id)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {portfolio?.length < MAX_PORTFOLIO_IMAGES && (
                      <label className="flex items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 transition-colors bg-gray-50">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePortfolioUpload}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center">
                          <Plus className="w-8 h-8 text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">画像を追加</span>
                        </div>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    ※ ポートフォリオ画像は検索結果やプロフィールで表示されます
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>こだわり条件</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {SPECIAL_CONDITIONS.map((condition) => (
                      <Badge
                        key={condition}
                        onClick={() => handleConditionToggle(condition)}
                        className={`cursor-pointer px-4 py-2 text-sm ${
                          formData.special_conditions.includes(condition)
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    ※ 提供可能なサービスや対応可能な条件を選択してください
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>得意な撮影ジャンル</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {GENRES.map((genre) => (
                      <Badge
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={`cursor-pointer px-4 py-2 text-sm ${
                          formData.shooting_genres.includes(genre)
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-6 text-lg"
            disabled={updateProfileMutation.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {updateProfileMutation.isPending ? "保存中..." : "プロフィールを保存"}
          </Button>
        </form>
      </div>
    </div>
  );
}
