
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useProfile } from "@/components/common/ProfileProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, UserIcon } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

import ProfileForm from "../components/profile/ProfileForm";

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeProfile, refreshProfiles, canCreateProfile, switchProfile } = useProfile();
  const [profileToEdit, setProfileToEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
  const urlParams = new URLSearchParams(location.search);
  const profileId = urlParams.get('id');
  const isNewProfile = urlParams.get('new') === 'true';

  if (isNewProfile) {
    // Always reset editing state for new profile
    setProfileToEdit(null);
    setIsNew(true);
    setIsLoading(false);
    return; // 👈 this stops further logic from running
  }

  if (profileId) {
    setIsNew(false);
    loadProfile(profileId);
    return;
  }

  if (activeProfile) {
    setIsNew(false);
    setProfileToEdit(activeProfile);
    setIsLoading(false);
  } else {
    setProfileToEdit(null);
    setIsNew(true);
    setIsLoading(false);
  }
}, [location.search, activeProfile]); // Added activeProfile to dependency array for completeness

  const loadProfile = async (id) => {
    setIsLoading(true);
    try {
      const fetchedProfile = await base44.entities.BusinessProfile.get(id);
      setProfileToEdit(fetchedProfile);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async (profileData) => {
    if (isNew && !canCreateProfile()) {
      alert("You've reached your profile limit. Please upgrade to create more profiles.");
      return;
    }

    setIsSaving(true);
    try {
      if (!isNew && profileToEdit) {
  await base44.entities.BusinessProfile.update(profileToEdit.id, profileData);
} else {
  const newProfile = await base44.entities.BusinessProfile.create(profileData);
  localStorage.setItem('activeProfileId', newProfile.id);
  
  // Automatically set new profile as active
  switchProfile(newProfile.id); // Fix: changed 'created.id' to 'newProfile.id'

  // Track business profile completion
  if (window.fbq) {
    window.fbq('track', 'CompleteRegistration', {
      content_name: 'Business Profile Setup',
      status: 'completed'
    });
  }
}
await refreshProfiles();
navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving profile:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      <div className="p-6 md:p-8 max-w-4xl mx-auto pt-24 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <Link to={createPageUrl("Dashboard")}>
              <Button variant="ghost" size="icon" className="hover:bg-white/50">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                KWALLO Profile
              </h1>
              <p className="text-slate-600 mt-1">
                Help KWALLO understand your business to create perfect content.
              </p>
            </div>
          </div>
        </motion.div>

        {isNew && !canCreateProfile() ? (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Profile Limit Reached</h2>
              <p className="text-slate-600 mb-6">
                You've reached your profile limit. Upgrade to create more business profiles!
              </p>
              <Link to={createPageUrl("Account")}>
                <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Upgrade Plan
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 p-8">
                <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                  {isNew ? "Create New Profile" : "Edit Your Profile"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <ProfileForm
  key={isNew ? 'new-profile' : (profileToEdit?.id || 'edit-profile')}
  profile={isNew ? null : profileToEdit}
  isLoading={isLoading}
  onSave={handleSave}
  isSaving={isSaving}
/>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
