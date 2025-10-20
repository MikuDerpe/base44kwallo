import React, { useState } from 'react';
import { useProfile } from './ProfileProvider';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfileSelector() {
  const { profiles, activeProfile, switchProfile, isLoading, canCreateProfile, refreshProfiles } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl animate-pulse">
        <div className="text-white text-xs font-bold">...</div>
      </div>
    );
  }

  const displayName = activeProfile?.business_name || "Select Profile";
  const initials = displayName.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-2xl border-4 border-white p-0 transition-all duration-200 hover:scale-105"
        >
          <div className="text-white text-lg font-bold">{initials}</div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-64 mt-2">
        <DropdownMenuLabel className="text-center">Business Profiles</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <DropdownMenuItem
              key={profile.id}
              onClick={() => {
                switchProfile(profile.id);
                setIsOpen(false);
              }}
              className="cursor-pointer flex items-center justify-between"
            >
              <span>{profile.business_name}</span>
              {activeProfile?.id === profile.id && <Check className="w-4 h-4 text-indigo-600" />}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>
            <span className="text-slate-500">No profiles yet</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {canCreateProfile() ? (
          <DropdownMenuItem
            onClick={async () => {
              try {
                const user = await base44.auth.me();
                const newProfile = await base44.entities.BusinessProfile.create({
                  business_name: "New Profile",
                  business_type: "b2c",
                  niche: "General Online Business",
                  created_by: user.email
                });

                localStorage.setItem("activeProfileId", newProfile.id);
                switchProfile(newProfile.id);
                await refreshProfiles();
                setIsOpen(false);
              } catch (err) {
                console.error("Error creating new profile:", err);
                alert("Something went wrong creating a new profile.");
              }
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Profile</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <span className="text-slate-500 text-xs">Profile limit reached</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}