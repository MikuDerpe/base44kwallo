
import React, { useState, useEffect, useCallback } from "react";
import { useProfile } from "@/components/common/ProfileProvider";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Brain, 
  TrendingUp, 
  BookOpen, 
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

import StatsCard from "../components/dashboard/StatsCard";
import RecentContent from "../components/dashboard/RecentContent";
import QuickActions from "../components/dashboard/QuickActions";

export default function Dashboard() {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const [recentContent, setRecentContent] = useState([]);
  const [stats, setStats] = useState({
    totalContent: 0,
    thisWeek: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check if profile is complete (all required fields filled)
  const isProfileComplete = (profile) => {
    if (!profile) return false;
    
    const requiredFields = [
      'business_name',
      'niche',
      'offer_statement',
      'content_interests',
      'target_audience',
      'audience_pains',
      'business_story',
      'desired_outcome',
      'customer_objections',
      'offer_structure',
      'usp',
      'client_results',
      'client_count'
    ];

    return requiredFields.every(field => 
      profile[field] && String(profile[field]).trim() !== ""
    );
  };

  const loadDashboardData = useCallback(async () => {
    if (!activeProfile) return;
    setIsLoading(true);
    try {
      const content = await base44.entities.GeneratedContent.filter({ business_profile_id: activeProfile.id }, '-created_date', 5);
      setRecentContent(content);
      
      const allContent = await base44.entities.GeneratedContent.filter({ business_profile_id: activeProfile.id });
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      setStats({
        totalContent: allContent.length,
        thisWeek: allContent.filter(item => new Date(item.created_date) > weekAgo).length
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    if (activeProfile) {
      loadDashboardData();
    } else if (!isProfileLoading) {
      setIsLoading(false);
      setRecentContent([]);
      setStats({ totalContent: 0, thisWeek: 0 });
    }
  }, [activeProfile, isProfileLoading, loadDashboardData]);

  const profileComplete = isProfileComplete(activeProfile);

  return (
    <div className="space-y-3 sm:space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-3 sm:px-0"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome back! 👋
            </h1>
            <p className="text-slate-600 text-sm md:text-base">
              {activeProfile ? `Ready to create amazing content for ${activeProfile.business_name}?` : "Select or create a business profile to get started."}
            </p>
          </div>
          
          {!activeProfile && !isProfileLoading && (
            <Link to={createPageUrl("BusinessProfile")}>
              <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Set Up Profile
              </Button>
            </Link>
          )}

          {activeProfile && !profileComplete && (
            <Link to={createPageUrl("BusinessProfile")}>
              <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg w-full md:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Complete Profile Setup
              </Button>
            </Link>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-0">
        <StatsCard
          title="Total Content"
          value={stats.totalContent}
          icon={BookOpen}
        />
        <StatsCard
          title="This Week"
          value={stats.thisWeek}
          icon={TrendingUp}
        />
        <StatsCard
          title="AI Ready"
          value={profileComplete ? "Yes" : "Setup Needed"}
          icon={Brain}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-3 sm:gap-6 md:gap-8">
        <div className="lg:col-span-2">
          <RecentContent 
            content={recentContent}
            isLoading={isLoading || isProfileLoading}
            hasProfile={!!activeProfile}
          />
        </div>
        
        <div>
          <QuickActions profile={activeProfile} profileComplete={profileComplete} />
        </div>
      </div>
    </div>
  );
}
