

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger } from
"@/components/ui/sidebar";
import {
  LayoutDashboard,
  Zap,
  MessageSquare,
  BookOpen,
  Settings,
  Brain,
  User as UserIcon,
  FileText } from
"lucide-react";
import { ProfileProvider } from "./components/common/ProfileProvider";
import { ProfileSelector } from "./components/common/ProfileSelector";
import SideChatPanel from "./components/chat/SideChatPanel";

const navigationItems = [
{
  title: "Dashboard",
  url: createPageUrl("Dashboard"),
  icon: LayoutDashboard
},
{
  title: "Business Profile",
  url: createPageUrl("BusinessProfile"),
  icon: UserIcon
},
{
  title: "Content Generators",
  url: createPageUrl("Generators"),
  icon: Zap
},
{
  title: "Content Calendar",
  url: createPageUrl("ContentCalendar"),
  icon: BookOpen
},
{
  title: "Notes",
  url: createPageUrl("Notes"),
  icon: FileText
},
{
  title: "AI Chat",
  url: createPageUrl("Chat"),
  icon: MessageSquare
},
{
  title: "Content Library",
  url: createPageUrl("Library"),
  icon: BookOpen
},
{
  title: "Account",
  url: createPageUrl("Account"),
  icon: Settings
}];


export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  // Initialize Meta Pixel
  React.useEffect(() => {
    // Check if pixel is already loaded
    if (window.fbq) return;

    // Meta Pixel Code
    (function(f,b,e,v,n,t,s) {
      if(f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if(!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', '31761051790176342');
    window.fbq('track', 'PageView');
  }, []); // Run once on component mount

  React.useEffect(() => {
    const fetchUser = async () => {
      setIsCheckingAuth(true);
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);

        if (currentPageName === 'Landing' && user && user.subscription_tier && user.subscription_tier !== 'free') {
          window.location.href = createPageUrl("Dashboard");
        }
      } catch (error) {
        setCurrentUser(null);
      }
      setIsCheckingAuth(false);
    };
    fetchUser();
  }, [currentPageName]);

  if (currentPageName === 'Landing') {
    return <>{children}</>;
  }

  return (
    <ProfileProvider>
      <SidebarProvider>
        <style>{`
          :root {
            --primary: 238 70% 56%;
            --primary-foreground: 224 71% 4%;
            --accent: 217 91% 60%;
            --accent-foreground: 224 71% 4%;
            --muted: 220 14% 96%;
            --muted-foreground: 220 9% 46%;
          }
          
          .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          .glass-effect {
            backdrop-filter: blur(10px);
            background: rgba(255, 255, 255, 0.8);
          }
          
          /* Modern card glow effect */
          [class*="shadow"] {
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05), 0 0 20px rgba(100, 116, 139, 0.08) !important;
          }
          
          .profile-selector-container {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
          }
          
          @media (max-width: 640px) {
            .space-y-6 > *:not(:last-child),
            .space-y-8 > *:not(:last-child) {
              margin-bottom: 0.75rem !important;
            }
            
            .gap-4, .gap-6, .gap-8 {
              gap: 0.5rem !important;
            }
          }
        `}</style>
        
        {/* Noscript fallback for Meta Pixel */}
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{display: 'none'}}
            src="https://www.facebook.com/tr?id=31761051790176342&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="profile-selector-container">
            <ProfileSelector />
          </div>

          <Sidebar className="w-64 border-r border-slate-200/50 glass-effect">
            <SidebarHeader className="border-b border-slate-200/50 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">KWALLO</h2>
                  <p className="text-xs text-slate-500 font-medium">AI Content Creator</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2 md:p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 py-2 md:py-3">
                  Workspace
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) =>
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                        asChild
                        className={`mb-1 rounded-xl transition-all duration-200 ${
                        location.pathname === item.url || item.title === 'Business Profile' && currentPageName === 'BusinessProfile' ?
                        'bg-indigo-100 text-indigo-700 shadow-sm' :
                        'hover:bg-slate-100 text-slate-700 hover:text-slate-900'}`}>

                          <Link to={item.url} className="flex items-center gap-3 px-3 md:px-4 py-2 md:py-3">
                            <item.icon className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="font-medium text-sm md:text-base">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-slate-200/50 p-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {currentUser?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{currentUser?.email || ''}</p>
                </div>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col min-w-0">
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-2 sm:px-4 md:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="lg:hidden" />
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900">{currentPageName}</h1>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="px-0 sm:px-3 md:px-6 lg:px-8 py-0 sm:py-4 md:py-6 lg:py-8 max-w-7xl mx-auto">
                {children}
              </div>
            </div>
          </main>

          {/* Side Chat Panel (Desktop Only) */}
          <SideChatPanel />
        </div>
      </SidebarProvider>
    </ProfileProvider>
  );
}

