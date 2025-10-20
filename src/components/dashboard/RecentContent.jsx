import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  FileText, 
  ExternalLink,
  Clock,
  Brain,
  Heart
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { motion } from "framer-motion";

const contentTypeColors = {
  social_post: "bg-indigo-100 text-indigo-700 border-indigo-200",
  instagram_story: "bg-purple-100 text-purple-700 border-purple-200",
  ad_copy: "bg-indigo-100 text-indigo-700 border-indigo-200",
  sales_page: "bg-purple-100 text-purple-700 border-purple-200",
  email: "bg-indigo-100 text-indigo-700 border-indigo-200",
  campaign: "bg-purple-100 text-purple-700 border-purple-200",
  youtube_script: "bg-indigo-100 text-indigo-700 border-indigo-200"
};

export default function RecentContent({ content, isLoading, hasProfile }) {
  return (
    <Card className="border border-slate-200 bg-white">
      <CardHeader className="border-b border-slate-100 p-3 sm:p-4 md:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg md:text-xl font-bold text-slate-900">Recent Content</CardTitle>
          <Link to={createPageUrl("Library")}>
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 text-xs md:text-sm">
              View All <ExternalLink className="w-3 h-3 md:w-4 md:h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3 sm:space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Card key={i} className="border border-slate-200">
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-3" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !hasProfile ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">Select a Profile</h3>
            <p className="text-slate-500 mb-4 text-xs sm:text-sm">Choose a business profile from the orb above to see your content.</p>
            <Link to={createPageUrl("BusinessProfile")}>
              <Button className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm">
                Or Create a New One
              </Button>
            </Link>
          </div>
        ) : content.length === 0 ? (
          <div className="text-center py-6 sm:py-8">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2 text-sm sm:text-base">No content yet</h3>
            <p className="text-slate-500 mb-4 text-xs sm:text-sm">Start creating amazing content with AI</p>
            <Link to={createPageUrl("Generators")}>
              <Button className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-sm">
                Create Content
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {content.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{item.title}</h4>
                      {item.is_favorite && <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0 ml-2" />}
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm line-clamp-2 mb-3">
                      {item.content.substring(0, 120)}...
                    </p>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <Badge 
                        variant="secondary" 
                        className={`${contentTypeColors[item.content_type]} border text-xs`}
                      >
                        {item.content_type.replace('_', ' ')}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(item.created_date), 'MMM d')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}