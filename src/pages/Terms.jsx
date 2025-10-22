import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Shield, FileText, Users } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">利用規約</h1>

        <Alert className="mb-8 bg-red-50 border-red-200">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900 font-medium">
            重要なお知らせ：BikeMatchは無料のマッチングサービスです。
            金銭取引はすべてユーザー間で直接行っていただきます。
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-red-600" />
                サービスの概要
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                BikeMatch（以下「本サービス」）は、バイク乗り（ライダー）とバイク専門フォトグラファーを
                マッチングさせるプラットフォームです。
              </p>
              <p>
                本サービスは完全無料で提供され、ユーザー間の連絡を円滑にするための場を提供します。
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                金銭取引に関する重要事項
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                <h4 className="font-bold text-gray-900 mb-2">免責事項</h4>
                <ul className="space-y-2 list-disc list-inside">
                  <li>本サービスは決済機能を提供しません</li>
                  <li>料金の交渉、合意、支払いはすべてユーザー間で行ってください</li>
                  <li>支払い方法（銀行振込、現金手渡し、外部サービス利用等）はユーザー間で決定してください</li>
                  <li>金銭トラブルが発生した場合、運営者は一切の責任を負いません</li>
                  <li>取引に関する紛争はユーザー間で解決してください</li>
                </ul>
              </div>
              <p className="font-medium text-gray-900">
                契約内容、料金、支払い方法については、メッセージ機能を通じて
                事前に十分な確認と合意を行うことを強く推奨します。
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="w-5 h-5 text-red-600" />
                ユーザーの責任
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <h4 className="font-semibold text-gray-900">ライダー（依頼者）の責任</h4>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>正確な情報を登録し、誠実に対応すること</li>
                <li>撮影内容、料金について事前に明確な合意を行うこと</li>
                <li>約束した支払いを確実に履行すること</li>
                <li>撮影後は速やかに評価を投稿すること</li>
              </ul>

              <h4 className="font-semibold text-gray-900 mt-6">フォトグラファー（撮影者）の責任</h4>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>正確な情報を登録し、ポートフォリオを最新に保つこと</li>
                <li>料金体系を明確に提示すること</li>
                <li>約束した撮影サービスを確実に提供すること</li>
                <li>撮影データの納品を確実に行うこと</li>
                <li>撮影後は速やかに評価を投稿すること</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-5 h-5 text-red-600" />
                禁止事項
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>虚偽の情報を登録すること</li>
                <li>他のユーザーを誹謗中傷すること</li>
                <li>不当な料金を請求すること</li>
                <li>約束を守らない行為</li>
                <li>撮影データの無断転用や著作権侵害</li>
                <li>本サービスを商業目的以外で利用すること</li>
                <li>法令に違反する行為</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-red-600" />
                評価・レビューシステム
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                本サービスでは、取引完了後にユーザー間で相互に評価を行うことができます。
                この評価は他のユーザーに公開され、信頼性の指標となります。
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>評価は5段階で行います</li>
                <li>評価とコメントは公開されます</li>
                <li>虚偽の評価や誹謗中傷は禁止されています</li>
                <li>評価の削除や変更は原則として行いません</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="w-5 h-5 text-red-600" />
                プライバシーポリシー
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                本サービスは、ユーザーの個人情報を適切に管理し、第三者に開示することはありません。
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>登録情報は暗号化して保存されます</li>
                <li>メールアドレスは他のユーザーに公開されません</li>
                <li>メッセージ内容は当事者以外閲覧できません</li>
                <li>広告配信のためにクッキーを使用する場合があります</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="w-5 h-5 text-red-600" />
                サービスの変更・終了
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                運営者は、事前の通知なくサービス内容を変更、または終了することができます。
                サービス終了時には、可能な限り事前に通知を行います。
              </p>
            </CardContent>
          </Card>

          <div className="bg-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-600">
              最終更新日：2024年1月1日
            </p>
            <p className="text-sm text-gray-600 mt-2">
              本規約は予告なく変更される場合があります。
              定期的にご確認ください。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}