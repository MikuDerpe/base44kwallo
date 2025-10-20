
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const ProfileContext = createContext();

export const useProfile = () => useContext(ProfileContext);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userTier, setUserTier] = useState('free');
  const [generationsUsed, setGenerationsUsed] = useState(0);

  const loadProfiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await base44.auth.me();
      if (user) {
        setUserTier(user.subscription_tier || 'free');
        setGenerationsUsed(user.generations_used || 0);
        
        const userProfiles = await base44.entities.BusinessProfile.filter({ created_by: user.email });
        setProfiles(userProfiles);

        if (userProfiles.length > 0) {
  const lastActiveProfileId = localStorage.getItem('activeProfileId');
  if (lastActiveProfileId) {
    const profileToActivate = userProfiles.find(p => p.id === lastActiveProfileId);
    if (profileToActivate) setActiveProfile(profileToActivate);
  }
} else {
  setActiveProfile(null);
}
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
      setProfiles([]);
      setActiveProfile(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const switchProfile = (profileId) => {
    const newActiveProfile = profiles.find(p => p.id === profileId);
    if (newActiveProfile) {
      setActiveProfile(newActiveProfile);
      localStorage.setItem('activeProfileId', profileId);
    }
  };

  const incrementGenerations = async () => {
    const newCount = generationsUsed + 1;
    setGenerationsUsed(newCount);
    try {
      await base44.auth.updateMe({ generations_used: newCount });
    } catch (error) {
      console.error("Error updating generation count:", error);
    }
  };

  const canCreateProfile = () => {
    if (userTier === 'free' || userTier === 'starter') return profiles.length < 1;
    if (userTier === 'pro') return profiles.length < 10;
    return false;
  };

  const canGenerate = () => {
    if (userTier === 'free') return generationsUsed < 15; // Changed from 10 to 15
    return true; // starter and pro have unlimited
  };

  const canUseChat = () => {
    return userTier !== 'free';
  };

  const value = {
    profiles,
    activeProfile,
    isLoading,
    userTier,
    generationsUsed,
    switchProfile,
    refreshProfiles: loadProfiles,
    incrementGenerations,
    canCreateProfile,
    canGenerate,
    canUseChat,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}
