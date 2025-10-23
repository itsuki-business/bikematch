import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, User, MessageSquare, FileText, LogOut, Camera, Bike, Star, UserPlus } from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";
import RegisterModal from "@/components/auth/RegisterModal";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
// --- Amplify ---
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { getUser } from '@/graphql/queries';
// ---------------

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cognitoUser, setCognitoUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  useEffect(() => {
    setIsLoadingUser(true);
    const unsubscribe = Hub.listen('auth', ({ payload: { event, data } }) => {
      console.log('Hub event:', event, 'data:', data);
      switch (event) {
        case 'signedIn':
        case 'autoSignIn':
           console.log('Setting cognitoUser from Hub:', data);
           // dataがユーザー情報を含む場合と、data.userを含む場合がある
           const userData = data.user || data;
           setCognitoUser(userData);
           fetchAppUserData(userData.username || userData.userId || userData.attributes?.sub);
           break;
        case 'signedOut':
        case 'signOut':
           console.log('Signing out, clearing user data');
           setCognitoUser(null);
           setAppUser(null);
           setUser(null);
           setIsLoadingUser(false);
           break;
        default:
          break;
      }
    });

    checkCurrentUser();
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (cognitoUser) {
      // cognitoUserが存在すれば、appUserの有無に関わらずuserをセット
      setUser({
        id: cognitoUser.username || cognitoUser.userId || cognitoUser.attributes?.sub,
        username: cognitoUser.username || cognitoUser.userId,
        email: cognitoUser.attributes?.email,
        ...appUser, // appUserがあれば追加情報をマージ
      });
      setIsLoadingUser(false);
    } else {
      setUser(null);
      setIsLoadingUser(false);
    }
  }, [cognitoUser, appUser]);

  const checkCurrentUser = async () => {
    try {
      const current = await getCurrentUser();
      console.log('checkCurrentUser - current user:', current);
      setCognitoUser(current);
      await fetchAppUserData(current.username || current.userId);
    } catch (error) {
      console.log('checkCurrentUser - not authenticated:', error);
      setCognitoUser(null);
      setAppUser(null);
      setUser(null);
      setIsLoadingUser(false);
    }
  };

  const fetchAppUserData = async (userId) => {
    if (!userId) {
      console.log('fetchAppUserData - no userId provided');
      setAppUser({});
      return;
    }
    try {
      const client = generateClient();
      const result = await client.graphql({ query: getUser, variables: { id: userId }, authMode: 'userPool' });
      const fetchedUser = result.data.getUser;
      console.log('fetchAppUserData - fetched user:', fetchedUser);
      if (fetchedUser) {
        setAppUser(fetchedUser);
      } else {
        console.log('fetchAppUserData - user not found in DB, setting empty object');
        setAppUser({});
      }
    } catch (error) {
      console.error("Error fetching application user data:", error);
      // エラーでも空オブジェクトをセットして、ログイン状態は維持
      setAppUser({});
    }
  };

  const handleLoginSuccess = async () => {
    console.log('Layout - Login success, closing modal and navigating to home-for-register');
    setShowLoginModal(false);
    
    // 認証状態を再チェック
    await checkCurrentUser();
    
    // ログイン成功後、登録者専用のHomeページ（src/pages/HomeForRegister.jsx）に直接遷移
    navigate('/home-for-register');
  };

  const handleRegisterSuccess = async () => {
    console.log('Layout - Register success, closing modal and navigating to profile');
    setShowRegisterModal(false);
    
    // 認証状態を再チェック
    await checkCurrentUser();
    
    // 登録成功後、プロフィール編集ページに直接遷移（初回登録）
    // userIdを取得するため少し待つ
    setTimeout(async () => {
      try {
        const currentUser = await getCurrentUser();
        navigate(`/profile/${currentUser.userId}`);
      } catch (error) {
        console.error('Error getting userId:', error);
        navigate('/home-for-register');
      }
    }, 500);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/home-for-non-register');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const publicNavigationItems = [
    { title: "ホーム", url: "/home-for-non-register", icon: Home },
    { title: "利用規約", url: "/terms", icon: FileText },
  ];
  const authenticatedNavigationItems = [
    { title: "ホーム", url: "/home-for-register", icon: Home },
    { title: "プロフィール", url: user?.id ? `/profile/${user.id}` : "/profile", icon: User },
    { title: "メッセージ", url: user?.id ? `/messages/${user.id}` : "/messages", icon: MessageSquare },
    { title: "評価・口コミ", url: "/reviews", icon: Star },
    { title: "利用規約", url: "/terms", icon: FileText },
  ];
  const navigationItems = user ? authenticatedNavigationItems : publicNavigationItems;

  if (isLoadingUser) {
      return (
          <div className="min-h-screen flex items-center justify-center">
              <div>Loading...</div>
          </div>
      );
  }

  return (
    <SidebarProvider>
      <style>{``}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-white">
        <Sidebar className="border-r border-gray-200 bg-white shadow-lg">
          <SidebarHeader className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-white">
            <Link to={user ? "/home-for-register" : "/home-for-non-register"} className="flex items-center gap-3 group">
               <div className="relative">
                 <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
                   <Bike className="w-7 h-7 text-white" />
                 </div>
                 <Camera className="w-5 h-5 text-red-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
               </div>
               <div>
                 <h2 className="font-bold text-xl text-gray-900">BikeMatch</h2>
                 <p className="text-xs text-gray-500">バイク×フォトグラファー</p>
               </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-3 bg-white">
             <SidebarGroup>
               <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                 メニュー
               </SidebarGroupLabel>
               <SidebarGroupContent>
                 <SidebarMenu>
                   {navigationItems.map((item) => (
                     <SidebarMenuItem key={item.title}>
                       <SidebarMenuButton
                         asChild
                         className={`hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-xl mb-1 ${
                           location.pathname.toLowerCase() === item.url.toLowerCase() ? 'bg-red-50 text-red-700 shadow-sm' : ''
                         }`}
                       >
                         <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                           <item.icon className="w-5 h-5" />
                           <span className="font-medium">{item.title}</span>
                         </Link>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   ))}
                 </SidebarMenu>
               </SidebarGroupContent>
             </SidebarGroup>

            {user && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider px-3 py-2">
                  ユーザー情報
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="px-4 py-3 space-y-2">
                    {user.user_type && (
                         <div className="flex items-center gap-2 text-sm">
                           <span className="text-gray-600">タイプ:</span>
                           <span className={`font-semibold ${user.user_type === 'photographer' ? 'text-red-600' : user.user_type === 'rider' ? 'text-blue-600' : 'text-gray-600'}`}>
                             {user.user_type === 'photographer' ? 'フォトグラファー' : user.user_type === 'rider' ? 'ライダー' : '未設定'}
                           </span>
                         </div>
                    )}
                    {user.user_type === 'photographer' && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">募集状況:</span>
                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          user.is_accepting_requests ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.is_accepting_requests ? '募集中' : '募集停止'}
                        </span>
                      </div>
                    )}
                    {user.average_rating !== undefined && user.average_rating !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">評価:</span>
                        <span className="font-semibold text-yellow-600">
                          ⭐ {user.average_rating.toFixed(1)} ({user.review_count || 0})
                        </span>
                      </div>
                    )}
                  </div>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="border-t border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-white">
            {console.log('Sidebar Footer - user:', user, 'cognitoUser:', cognitoUser, 'isLoadingUser:', isLoadingUser)}
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                   <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center overflow-hidden">
                       <span className="text-gray-700 font-semibold text-sm">
                       {user.nickname?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                       </span>
                   </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {user.nickname || user.name || user.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium text-sm">ログアウト</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm">ログイン</span>
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="font-medium text-sm">新規登録</span>
                </button>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <h1 className="text-xl font-bold text-gray-900">BikeMatch</h1>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          <footer className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="bg-gray-100 rounded-lg p-6 text-center">
                <p className="text-sm text-gray-500 mb-2">広告スペース</p>
                <p className="text-xs text-gray-400">ここに広告を掲載できます</p>
              </div>
            </div>
          </footer>
        </main>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={handleRegisterSuccess}
      />
    </SidebarProvider>
  );
}
