
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Plus, // Used for "New Profile" AND "Complete Profile"
  MessageSquare, // Used for "AI Chat"
  Zap, // New icon for "Create Content"
  BookOpen // New icon for "View Library"
} from "lucide-react";
import { motion } from "framer-motion";

export default function QuickActions({ profile, profileComplete }) {
  const navigate = useNavigate(); // Declared but not directly used in the provided JSX fragment, keeping it as per outline.

  const actions = [
  {
    title: "Create Content",
    description: "Generate new content with AI",
    icon: Zap,
    color: "from-indigo-500 to-purple-600",
    link: createPageUrl("Generators"),
    disabled: !profile || !profileComplete
  },
  {
    title: "Complete Profile",
    description: "Finish setting up your business profile",
    icon: Plus,
    color: "from-orange-500 to-red-600",
    link: createPageUrl("BusinessProfile"),
    disabled: false,
    hidden: profileComplete // Hide this action if profile is complete
  },
  {
    title: "View Library",
    description: "Browse all generated content",
    icon: BookOpen,
    color: "from-pink-500 to-rose-600",
    link: createPageUrl("Library"),
    disabled: !profile
  },
  {
    title: "AI Chat",
    description: "Get strategy help from AI",
    icon: MessageSquare,
    color: "from-emerald-500 to-teal-600",
    link: createPageUrl("Chat"),
    disabled: !profile || !profileComplete
  }].
  filter((action) => !action.hidden); // Remove hidden actions

  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, idx) =>
        <motion.div
          key={idx}
          whileHover={{ scale: action.disabled ? 1 : 1.02 }}
          whileTap={{ scale: action.disabled ? 1 : 0.98 }}>

            {/* The Link component will only navigate if the button is not disabled */}
            <Link to={action.link} className={action.disabled ? "pointer-events-none" : ""}>
              <Button
              variant="outline"
              className={`w-full justify-start h-auto p-4 border border-slate-200 ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-300'}`}
              disabled={action.disabled}>

                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 flex-shrink-0">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-slate-900">{action.title}</div>
                  <div className="text-xs text-slate-600">{action.description}</div>
                </div>
              </Button>
            </Link>
          </motion.div>
        )}
      </CardContent>
    </Card>);

}