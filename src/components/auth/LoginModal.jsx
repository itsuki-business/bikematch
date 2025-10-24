import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";
// --- Amplify ---
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import { mockHub } from '@/mockAmplify';
import { signIn, signOut } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
// ---------------
// import { bikematch } from "@/api/bikematchClient"; // 不要

export default function LoginModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: "", // Cognitoでは通常emailをusernameとして使用
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Email validation remains the same
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // バリデーション (変更なし)
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = "メールアドレスを入力してください";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "正しいメールアドレス形式で入力してください";
    }
    if (!formData.password) {
      newErrors.password = "パスワードを入力してください";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Mockまたは本番の認証サービスを使用
      let result;
      if (useMock) {
        result = await mockAuthService.signIn({
          username: formData.email,
          password: formData.password
        });
      } else {
        // --- Amplify Auth ---
        result = await signIn({
          username: formData.email,
          password: formData.password
        });
        // --------------------
      }
      
      console.log('Sign in result:', result);
      
      // Amplify v6では、signInの戻り値が異なります
      // 成功時は認証されたユーザー情報を取得
      const userInfo = {
        username: formData.email,
        userId: result.userId,
        isSignedIn: result.isSignedIn,
        nextStep: result.nextStep
      };

      // Hubイベントを発火して認証状態の変更を通知
      if (useMock) {
        mockHub.dispatch('auth', {
          event: 'signedIn',
          data: { user: userInfo }
        });
      } else {
        Hub.dispatch('auth', {
          event: 'signedIn',
          data: { user: userInfo }
        });
      }

      onSuccess(userInfo);
      onClose();
      setFormData({ email: "", password: "" });
    } catch (error) {
      console.error('Error signing in:', error);
      
      // 既にログイン済みのユーザーがいる場合は、ログアウトしてから再試行
      if (error.message && error.message.includes('already a signed in user')) {
        console.warn('⚠️ Already signed in user detected. Signing out and retrying...');
        try {
          if (useMock) {
            await mockAuthService.signOut();
          } else {
            await signOut();
          }
          console.log('✅ Signed out successfully. Please try logging in again.');
          setErrors({ general: '既存のセッションをクリアしました。もう一度ログインしてください。' });
          setIsLoading(false);
          return;
        } catch (signOutError) {
          console.error('Error signing out:', signOutError);
        }
      }
      
      // Amplifyからのエラーメッセージを整形して表示
      let errorMessage = "ログインに失敗しました。";
      if (error.code === 'UserNotFoundException' || error.code === 'NotAuthorizedException') {
          errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (error.code === 'UserNotConfirmedException') {
          errorMessage = 'アカウントが有効化されていません。確認メールをご確認ください。';
          // ここで確認コード再送信のUIを出すことも検討
      } else {
          errorMessage = error.message || errorMessage;
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // handleChange remains the same
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーがあればクリア (変更なし)
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (errors.general) {
        setErrors(prev => ({...prev, general: ""}));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            ログイン
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              メールアドレス
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`pl-10 ${errors.email ? "border-red-300 focus:border-red-500" : ""}`}
                placeholder="example@email.com"
                required // HTML5 validation
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              パスワード
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                className={`pl-10 pr-10 ${errors.password ? "border-red-300 focus:border-red-500" : ""}`}
                placeholder="パスワードを入力"
                required // HTML5 validation
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
             {/* Add Forgot Password link if needed */}
             {/* <div className="text-right">
               <Button variant="link" size="sm" className="h-auto p-0 text-sm text-blue-600 hover:underline">
                 パスワードをお忘れですか？
               </Button>
             </div> */}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </div>

           {/* Add link to registration if needed */}
           {/* <div className="text-center text-sm text-gray-600 pt-2">
             アカウントをお持ちでないですか？{' '}
             <Button variant="link" size="sm" className="h-auto p-0 text-blue-600 hover:underline">
               新規登録はこちら
             </Button>
           </div> */}
        </form>
      </DialogContent>
    </Dialog>
  );
}