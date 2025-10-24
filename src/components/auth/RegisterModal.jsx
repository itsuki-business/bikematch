import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // 初期登録では不要かも
import { Eye, EyeOff, Mail, Lock, User, /*Camera, Bike,*/ AlertCircle, CheckCircle } from "lucide-react";
// --- Amplify ---
import { useMock } from '@/config/environment';
import mockAuthService from '@/services/mockAuthService';
import mockAPIService from '@/services/mockAPIService';
import { mockHub } from '@/mockAmplify';
import { signIn, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';
import { createUser } from '@/graphql/mutations';
// ---------------
// import { bikematch } from "@/api/bikematchClient"; // 不要

export default function RegisterModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "", // Cognitoでは 'name' 属性として保存
    email: "", // Cognitoでは 'email' 属性および username として使用
    password: "",
    confirmPassword: ""
    // user_type はCognitoのカスタム属性か、別途DBに保存
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Email/Password validation remains the same
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password) => password.length >= 6; // Cognitoのポリシーに合わせる必要あり

  // Handle initial registration
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // バリデーション (変更なし)
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "お名前を入力してください";
    if (!formData.email) newErrors.email = "メールアドレスを入力してください";
    else if (!validateEmail(formData.email)) newErrors.email = "正しいメールアドレス形式で入力してください（例: example@email.com）";
    if (!formData.password) newErrors.password = "パスワードを入力してください";
    else if (!validatePassword(formData.password)) newErrors.password = "パスワードは6文字以上で入力してください"; // Adjust based on Cognito policy
    if (!formData.confirmPassword) newErrors.confirmPassword = "パスワード（確認）を入力してください";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "パスワードが一致しません";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      // Mockまたは本番の認証サービスを使用
      const { userId, isSignUpComplete } = useMock 
        ? await mockAuthService.signUp({
            username: formData.email,
            password: formData.password,
            options: {
              userAttributes: {
                email: formData.email,
                name: formData.name.trim(),
              },
            },
          })
        : await signUp({
            username: formData.email,
            password: formData.password,
            options: {
              userAttributes: {
                email: formData.email,
                name: formData.name.trim(),
              },
            },
          });
      
      console.log('Sign up successful:', userId, 'isSignUpComplete:', isSignUpComplete);
      
      // 登録成功、直接FirstTimeProfileSetupページに遷移
      console.log('Registration successful, redirecting to profile setup...');
      
      // モーダルを閉じる
      onClose();
      
      // フォーム状態をリセット
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      
      // FirstTimeProfileSetupページに遷移
      setTimeout(() => {
        console.log('Navigating to /first-time-profile-setup');
        window.location.pathname = '/first-time-profile-setup';
      }, 500);
    } catch (error) {
      console.error('Error signing up:', error);
      let errorMessage = "登録に失敗しました。";
      if (error.code === 'UsernameExistsException') {
          errorMessage = 'このメールアドレスは既に登録されています。';
      } else if (error.code === 'InvalidPasswordException') {
          // Cognitoのパスワードポリシーに基づいた具体的なメッセージを表示すると良い
          errorMessage = 'パスワードが要件を満たしていません。';
      } else {
          errorMessage = error.message || errorMessage;
      }
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };



  // handleChange remains mostly the same
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
     if (errors.general) {
         setErrors(prev => ({...prev, general: ""}));
     }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            新規登録
          </DialogTitle>
        </DialogHeader>

        {/* Show Registration Form */}
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {errors.general && (
            <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errors.general}
              </AlertDescription>
            </Alert>
          )}

          {/* Name Input (変更なし) */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
              お名前
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={`pl-10 ${errors.name ? "border-red-300 focus:border-red-500" : ""}`}
                placeholder="山田太郎"
                required
                disabled={isLoading}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email Input (変更なし) */}
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
                required
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password Input (変更なし) */}
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
                placeholder="6文字以上のパスワード" // Cognitoのポリシーに合わせる
                required
                disabled={isLoading}
                // Add pattern or minLength based on Cognito policy if needed
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
             <p className="text-xs text-gray-500">※ 6文字以上で入力してください。</p> {/* Adjust based on Cognito policy */}
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Input (変更なし) */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              パスワード（確認）
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-300 focus:border-red-500" : ""}`}
                placeholder="パスワードを再入力"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showConfirmPassword ? "パスワードを隠す" : "パスワードを表示"}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600">{errors.confirmPassword}</p>
            )}
            {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && ( // エラーがない場合のみ一致表示
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>パスワードが一致しています</span>
              </div>
            )}
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
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "登録中..." : "登録する"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}