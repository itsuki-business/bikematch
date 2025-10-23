import React from "react";
import { Search, MapPin, Tag, DollarSign, CheckSquare, Star } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export default function SearchFilters({ filters, setFilters, onSearch }) {
  const handleConditionToggle = (condition) => {
    const newConditions = filters.specialConditions?.includes(condition)
      ? filters.specialConditions.filter(c => c !== condition)
      : [...(filters.specialConditions || []), condition];
    setFilters({ ...filters, specialConditions: newConditions });
  };

  const handleSearch = () => {
    // 検索実行（親コンポーネントのonSearchを呼び出す）
    if (onSearch) {
      onSearch();
    }
  };

  return (
    <Card className="mb-8 shadow-lg border-none">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900">検索条件</h3>
        </div>
        
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                地域
              </label>
              <Select
                value={filters.prefecture}
                onValueChange={(value) => setFilters({ ...filters, prefecture: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全国" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全国</SelectItem>
                  {PREFECTURES.map((pref) => (
                    <SelectItem key={pref} value={pref}>{pref}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 text-gray-500" />
                ジャンル
              </label>
              <Select
                value={filters.genre}
                onValueChange={(value) => setFilters({ ...filters, genre: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {GENRES.map((genre) => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Star className="w-4 h-4 text-gray-500" />
                評価
              </label>
              <Select
                value={filters.minRating}
                onValueChange={(value) => setFilters({ ...filters, minRating: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="指定なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">指定なし</SelectItem>
                  <SelectItem value="4.5">4.5以上</SelectItem>
                  <SelectItem value="4.0">4.0以上</SelectItem>
                  <SelectItem value="3.5">3.5以上</SelectItem>
                  <SelectItem value="3.0">3.0以上</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                料金（最小）
              </label>
              <Input
                type="number"
                placeholder="¥ 0"
                value={filters.priceMin}
                onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                料金（最大）
              </label>
              <Input
                type="number"
                placeholder="¥ 100,000"
                value={filters.priceMax}
                onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <CheckSquare className="w-4 h-4 text-gray-500" />
              こだわり条件
            </label>
            <div className="flex flex-wrap gap-2">
              {SPECIAL_CONDITIONS.map((condition) => (
                <Badge
                  key={condition}
                  onClick={() => handleConditionToggle(condition)}
                  className={`cursor-pointer px-3 py-1.5 text-sm transition-all ${
                    filters.specialConditions?.includes(condition)
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {condition}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleSearch}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 text-lg font-semibold"
            >
              <Search className="w-5 h-5 mr-2" />
              検索する
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}