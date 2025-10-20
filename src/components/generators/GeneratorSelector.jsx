
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Image, 
  Mail, 
  Megaphone, 
  Target, 
  ArrowRight,
  Camera,
  Video,
  Lock,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";

const generators = [
  {
    id: "social_post",
    title: "Social Media Post",
    description: "Engaging posts for Instagram, TikTok, Facebook.",
    icon: Image,
    gradient: "from-indigo-500 to-purple-600",
    locked: false
  },
  {
    id: "youtube_script",
    title: "YouTube Script",
    description: "Long-form video scripts (5-40 minutes).",
    icon: Video,
    gradient: "from-indigo-500 to-purple-600",
    locked: false
  },
  {
    id: "instagram_story",
    title: "Instagram Story Sequence",
    description: "Create a sequence of engaging and interactive stories.",
    icon: Camera,
    gradient: "from-indigo-500 to-purple-600",
    locked: true
  },
  {
    id: "email",
    title: "Funnel Strategy",
    description: "Email sequences, telegram messages, and funnel copy.",
    icon: TrendingUp,
    gradient: "from-indigo-500 to-purple-600",
    locked: true
  },
  {
    id: "ad_copy",
    title: "Advertisement Copy",
    description: "High-converting ads for all formats including VSL.",
    icon: Megaphone,
    gradient: "from-indigo-500 to-purple-600",
    locked: true
  },
  {
    id: "sales_page",
    title: "Sales Page Copy",
    description: "Persuasive landing pages and sales copy.",
    icon: Target,
    gradient: "from-indigo-500 to-purple-600",
    locked: true
  }
];

export default function GeneratorSelector({ onSelect }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
      {generators.map((generator, index) => {
        const isLocked = generator.locked && !isAdmin;
        
        return (
          <motion.div
            key={generator.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isLocked ? { y: -4 } : {}}
          >
            <Card 
              className={`h-full border-0 shadow-lg bg-white/80 backdrop-blur-sm transition-all duration-300 group flex flex-col relative ${
                isLocked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-xl hover:shadow-purple-200/50'
              }`}
              onClick={() => !isLocked && onSelect(generator.id)}
            >
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/40 backdrop-blur-[2px] rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-slate-100 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Available Soon</p>
                  </div>
                </div>
              )}
              
              <CardHeader className="p-4 md:p-6">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-r ${generator.gradient} flex items-center justify-center mb-3 md:mb-4 ${!isLocked && 'group-hover:scale-110'} transition-transform duration-200 shadow-lg shadow-purple-300/30`}>
                  <generator.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <CardTitle className={`text-base sm:text-lg md:text-xl font-bold text-slate-900 transition-colors ${!isLocked && 'group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600'}`}>
                  {generator.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 md:p-6 md:pt-0 flex-grow flex flex-col justify-between">
                <p className="text-slate-600 mb-3 md:mb-4 leading-relaxed text-sm md:text-base">
                  {generator.description}
                </p>
                {!isLocked && (
                  <div className="flex items-center justify-between text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 font-medium group-hover:from-indigo-700 group-hover:to-purple-700 mt-auto text-sm md:text-base">
                    <span>Start Creating</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-purple-500" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
