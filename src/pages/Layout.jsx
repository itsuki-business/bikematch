

import React from "react";
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
import { base44 } from "@/api/base44Client";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLoginModal(false);
    // ログイン後に自動更新
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setShowRegisterModal(false);
    // 登録後に自動更新
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // ログイン前のナビゲーションアイテム
  const publicNavigationItems = [
    {
      title: "ホーム",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "利用規約",
      url: createPageUrl("Terms"),
      icon: FileText,
    },
  ];

  // ログイン後のナビゲーションアイテム
  const authenticatedNavigationItems = [
    {
      title: "ホーム",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "プロフィール",
      url: createPageUrl("Profile"),
      icon: User,
    },
    {
      title: "メッセージ",
      url: createPageUrl("Messages"),
      icon: MessageSquare,
    },
    {
      title: "評価・口コミ",
      url: createPageUrl("Reviews"),
      icon: Star,
    },
    {
      title: "利用規約",
      url: createPageUrl("Terms"),
      icon: FileText,
    },
  ];

  const navigationItems = user ? authenticatedNavigationItems : publicNavigationItems;

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Home"));
  };

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --primary-black: #0a0a0a;
          --accent-red: #dc2626;
          --metallic-silver: #e5e7eb;
          --dark-gray: #1f2937;
          --light-gray: #f9fafb;
        }
      `}</style>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="border-b border-gray-200 p-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
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
          
          <SidebarContent className="p-3">
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
                          location.pathname === item.url ? 'bg-red-50 text-red-700 shadow-sm' : ''
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
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">タイプ:</span>
                      <span className={`font-semibold ${user.user_type === 'photographer' ? 'text-red-600' : user.user_type === 'rider' ? 'text-blue-600' : 'text-gray-600'}`}>
                        {user.user_type === 'photographer' ? 'フォトグラファー' : user.user_type === 'rider' ? 'ライダー' : '未設定'}
                      </span>
                    </div>
                    {user.user_type === 'photographer' && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">募集状況:</span>
                        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${
                          user.is_accepting_requests 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {user.is_accepting_requests ? '募集中' : '募集停止'}
                        </span>
                      </div>
                    )}
                    {user.average_rating && (
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

          <SidebarFooter className="border-t border-gray-200 p-4">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center">
                    <span className="text-gray-700 font-semibold text-sm">
                      {user.nickname?.[0] || user.full_name?.[0] || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {user.nickname || user.full_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
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

      {/* Authentication Modals */}
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

