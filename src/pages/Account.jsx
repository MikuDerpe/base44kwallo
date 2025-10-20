
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, Rocket, ExternalLink } from 'lucide-react';

const TIER_INFO = {
  free: {
    name: "Free",
    icon: Zap,
    color: "text-slate-600",
    bgColor: "bg-slate-100",
    features: ["1 Business Profile", "15 Content Generations", "No AI Chat Access"]
  },
  starter: {
    name: "Starter",
    icon: Rocket,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    features: ["1 Business Profile", "Unlimited Generations", "AI Chat Access"],
    price: "€37.97/month"
  },
  pro: {
    name: "Pro",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    features: ["10 Business Profiles", "Unlimited Generations", "AI Chat Access", "Priority Support"],
    price: "€49.97/month"
  }
};

const WHOP_CHECKOUT_LINKS = {
  starter: "https://whop.com/checkout/plan_4dDSD6EbTHMwH?d2c=true",
  pro: "https://whop.com/checkout/plan_Xf2DbBhzFieK3?d2c=true"
};

const WHOP_MANAGE_URL = "https://whop.com/@me/settings/orders/";

const createPageUrl = (pageName) => {
  if (pageName === "Landing") {
    return "/";
  }
  return `/${pageName.toLowerCase()}`;
};

export default function AccountPage() {
  const [user, setUser] = React.useState(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (e) {
      console.error("Not logged in");
    }
  };

  React.useEffect(() => {
    fetchUser();

    // Check if user just returned from Whop checkout
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('whop_return') === 'true') {
      // User returned from Whop, refresh their account data
      setIsRefreshing(true);
      setTimeout(() => {
        fetchUser();
        setIsRefreshing(false);
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
      }, 2000); // Wait 2 seconds for webhook to process
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Track logout
      if (window.fbq) {
        window.fbq('trackCustom', 'UserLogout');
      }
      
      await User.logout();
      window.location.href = createPageUrl("Landing");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpgrade = (tier) => {
    // Track upgrade initiation
    if (window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: tier === 'starter' ? 'Starter Plan' : 'Pro Plan',
        value: tier === 'starter' ? 19.97 : 49.97,
        currency: 'EUR'
      });
    }
    
    // Open Whop in new tab with return URL
    const returnUrl = encodeURIComponent(window.location.origin + window.location.pathname + '?whop_return=true');
    const checkoutUrl = WHOP_CHECKOUT_LINKS[tier] + `&return_url=${returnUrl}`;
    window.open(checkoutUrl, '_blank');
  };

  const currentTier = user?.subscription_tier || 'free';
  const tierInfo = TIER_INFO[currentTier];
  const TierIcon = tierInfo.icon;

  if (isRefreshing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Updating your subscription...</p>
        </div>
      </div>);

  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">My Account</h1>
      
      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ?
            <div className="space-y-2">
                <p><strong>Full Name:</strong> {user.full_name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role}</p>
              </div> :

            <p>Loading user information...</p>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription & Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${tierInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                <TierIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${tierInfo.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{tierInfo.name} Plan</h3>
                {tierInfo.price &&
                <p className="text-slate-600 text-sm sm:text-base">{tierInfo.price}</p>
                }
                {currentTier === 'free' && user &&
                <p className="text-sm text-slate-600 mt-1">
                    {user.generations_used || 0}/15 generations used
                  </p>
                }
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <h4 className="font-semibold text-slate-700">Plan Features:</h4>
              <ul className="space-y-1">
                {tierInfo.features.map((feature, idx) =>
                <li key={idx} className="flex items-center gap-2 text-sm sm:text-base text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                    {feature}
                  </li>
                )}
              </ul>
            </div>

            {currentTier !== 'free' &&
            <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Manage Subscription</h4>
                <p className="text-xs sm:text-sm text-slate-600 mb-3">
                  Update payment method, view invoices, or cancel your subscription
                </p>
                <Button
                variant="outline"
                className="w-full sm:w-auto text-sm"
                onClick={() => window.open(WHOP_MANAGE_URL, '_blank')}>

                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Billing
                </Button>
              </div>
            }

            {currentTier === 'free' &&
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 sm:p-6 border border-indigo-100">
                <h4 className="font-semibold text-slate-900 mb-3 text-sm sm:text-base">Upgrade to unlock more features</h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Rocket className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Starter</h5>
                    </div>
                    <p className="text-lg sm:text-xl font-bold mb-2">€19.97/mo</p>
                    <ul className="space-y-1 text-xs sm:text-sm text-slate-600 mb-4">
                      <li>• Unlimited generations</li>
                      <li>• AI Chat access</li>
                      <li>• 1 business profile</li>
                    </ul>
                    <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                    onClick={() => handleUpgrade('starter')}>

                      Upgrade to Starter
                    </Button>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-2 border-purple-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-purple-600 flex-shrink-0" />
                      <h5 className="font-semibold text-slate-900 text-sm sm:text-base">Pro</h5>
                      <Badge className="ml-auto bg-purple-100 text-purple-700 text-xs">Popular</Badge>
                    </div>
                    <p className="text-lg sm:text-xl font-bold mb-2">€49.97<span className="text-sm font-normal text-slate-600">/mo</span></p>
                    <ul className="space-y-1 text-xs sm:text-sm text-slate-600 mb-4">
                      <li>• Everything in Starter</li>
                      <li>• 10 business profiles</li>
                      <li>• Priority support</li>
                    </ul>
                    <Button
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm"
                    onClick={() => handleUpgrade('pro')}>

                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            }

            {currentTier === 'starter' &&
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 sm:p-6 border border-indigo-100">
                <div className="flex items-start gap-3">
                  <Crown className="w-6 h-6 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Upgrade to Pro</h4>
                    <p className="text-xs sm:text-sm text-slate-600 mb-3">Get 10 business profiles and priority support</p>
                    <Button
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-sm"
                    onClick={() => handleUpgrade('pro')}>

                      Upgrade to Pro - €49.97/mo
                    </Button>
                  </div>
                </div>
              </div>
            }
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full md:w-auto">

              Log Out
            </Button>
            <p className="text-sm text-slate-500 mt-2">
              You'll be redirected to the landing page after logging out.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>);

}
