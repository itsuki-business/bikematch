import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // 初期登録では不要かも
import { Eye, EyeOff, Mail, Lock, User, /*Camera, Bike,*/ AlertCircle, CheckCircle } from "lucide-react";
// --- Amplify ---
import { signUp, confirmSignUp, signIn, resendSignUpCode, getCurrentUser } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
// import { API, graphqlOperation } from 'aws-amplify'; // ユーザーDBに登録する場合
// import { createUser } from '@/graphql/mutations'; // ユーザーDB用Mutation
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
  const [showVerification, setShowVerification] = useState(false); // 確認コード入力表示用
  const [verificationCode, setVerificationCode] = useState(""); // 確認コード入力用

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
      // --- Amplify Auth ---
      const { userId, isSignUpComplete } = await signUp({
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
      
      // 登録成功、確認コード入力画面に進む
      // --------------------

      // メールアドレス確認が必要な場合のみ確認コード入力画面へ遷移
      if (!isSignUpComplete) {
        console.log('Email verification required, showing verification form');
        setShowVerification(true);
      } else {
        // 確認が不要な場合（通常は発生しない）
        console.warn('Sign up completed without verification - this should not happen with email verification enabled');
        setShowVerification(true); // 念のため確認画面を表示
      }
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

  // Handle verification code submission
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    if (!verificationCode.trim()) {
        setErrors({ verification: "確認コードを入力してください。" });
        setIsLoading(false);
        return;
    }

    try {
        // --- Amplify Auth ---
        await confirmSignUp({
          username: formData.email,
          confirmationCode: verificationCode.trim(),
        });
        console.log('Confirmation successful');
        // --------------------

        // 確認成功後、自動ログイン
        console.log('Starting auto-login after confirmation...');
        
        // 既にログイン済みかチェック
        let loginResult;
        try {
          const currentUser = await getCurrentUser();
          console.log('User is already signed in after confirmation:', currentUser);
          // 既にログイン済みの場合は、signInをスキップ
          loginResult = {
            userId: currentUser.userId,
            isSignedIn: true,
            nextStep: null
          };
        } catch (notSignedInError) {
          console.log('User is not signed in, proceeding with signIn...');
          // ログインしていない場合は、signInを実行
          try {
            loginResult = await signIn({
              username: formData.email,
              password: formData.password
            });
          } catch (signInError) {
            console.error('SignIn error:', signInError);
            if (signInError.code === 'NotAuthorizedException' && signInError.message.includes('already a signed in user')) {
              console.log('SignIn failed due to already signed in, getting current user...');
              // 既にログイン済みの場合は、現在のユーザー情報を取得
              const currentUser = await getCurrentUser();
              loginResult = {
                userId: currentUser.userId,
                isSignedIn: true,
                nextStep: null
              };
            } else {
              throw signInError; // 他のエラーは再スロー
            }
          }
        }

        console.log('Auto login result:', loginResult);

        // Amplify v6の構造に合わせてユーザー情報を整形
        const userInfo = {
          username: formData.email,
          userId: loginResult.userId,
          isSignedIn: loginResult.isSignedIn,
          nextStep: loginResult.nextStep
        };

      // Hubイベントを発火して認証状態の変更を通知
      Hub.dispatch('auth', {
        event: 'signedIn',
        data: { user: userInfo }
      });

      onSuccess(userInfo); // ログイン後のユーザー情報を渡す
        onClose(); // モーダルを閉じる
        // Reset form state if needed
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setVerificationCode("");
        setShowVerification(false);

    } catch (error) {
        console.error('Error confirming sign up:', error);
        let errorMessage = "確認コードの認証に失敗しました。";
         if (error.code === 'CodeMismatchException') {
             errorMessage = '確認コードが正しくありません。';
         } else if (error.code === 'ExpiredCodeException') {
             errorMessage = '確認コードの有効期限が切れています。再送信してください。';
             // ここで再送信ボタンを表示するUI制御
         } else if (error.code === 'NotAuthorizedException' && error.message.includes('already confirmed')) {
             errorMessage = 'このアカウントは既に確認済みです。ログインしてください。';
         } else if (error.code === 'NotAuthorizedException' && error.message.includes('already a signed in user')) {
             console.log('Already signed in user error detected, getting current user...');
             // 既にログイン済みの場合は、現在のユーザー情報を取得して成功として処理
             try {
               const currentUser = await getCurrentUser();
               console.log('Current user after already signed in error:', currentUser);
               const userInfo = {
                 username: formData.email,
                 userId: currentUser.userId,
                 isSignedIn: true,
                 nextStep: null
               };
               
      // Hubイベントを発火して認証状態の変更を通知
      Hub.dispatch('auth', {
        event: 'signedIn',
        data: { user: userInfo }
      });

      onSuccess(userInfo);
               onClose();
               setFormData({ name: "", email: "", password: "", confirmPassword: "" });
               setVerificationCode("");
               setShowVerification(false);
               return;
             } catch (getUserError) {
               console.error('Error getting current user:', getUserError);
               errorMessage = 'ログイン状態の確認に失敗しました。ページをリロードしてください。';
             }
         } else {
             errorMessage = error.message || errorMessage;
         }
        setErrors({ verification: errorMessage });
    } finally {
        setIsLoading(false);
    }
  };

    // 確認コード再送信処理
    const handleResendCode = async () => {
        setErrors({}); // エラーをクリア
        try {
            await resendSignUpCode({
              username: formData.email
            });
            alert("確認コードを再送信しました。メールをご確認ください。");
        } catch (error) {
            console.error('Error resending code:', error);
            setErrors({ verification: error.message || "コードの再送信に失敗しました。" });
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
     if (errors.verification) {
         setErrors(prev => ({...prev, verification: ""}));
     }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            {showVerification ? "メールアドレス確認" : "新規登録"}
          </DialogTitle>
        </DialogHeader>

        {/* Show Verification Form */}
        {showVerification ? (
           <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription>
                   <strong>{formData.email}</strong> 宛に送信された確認コードを入力してください。<br/>
                   <span className="text-sm text-blue-600 mt-1 block">
                     ※ メールが届かない場合は、迷惑メールフォルダもご確認ください。
                   </span>
                 </AlertDescription>
              </Alert>

              {errors.verification && (
                 <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                   <AlertCircle className="h-4 w-4" />
                   <AlertDescription>
                     {errors.verification}
                   </AlertDescription>
                 </Alert>
              )}

              <div className="space-y-2">
                 <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                   確認コード
                 </Label>
                 <Input
                   id="verificationCode"
                   type="text"
                   value={verificationCode}
                   onChange={(e) => setVerificationCode(e.target.value)}
                   className={`tracking-widest ${errors.verification ? "border-red-300 focus:border-red-500" : ""}`}
                   placeholder="------"
                   maxLength={6}
                   required
                   disabled={isLoading}
                 />
              </div>

               <div className="flex justify-between items-center pt-2">
                   <Button
                       type="button"
                       variant="link"
                       size="sm"
                       onClick={handleResendCode}
                       className="h-auto p-0 text-sm text-blue-600 hover:underline"
                       disabled={isLoading}
                   >
                       コードを再送信
                   </Button>
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
                   {isLoading ? "確認中..." : "確認して登録"}
                 </Button>
              </div>
           </form>
        ) : (
        /* Show Registration Form */
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
        )}
      </DialogContent>
    </Dialog>
  );
}