
import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/components/common/ProfileProvider';
import { GeneratedContent } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import GeneratedResult from '../components/generators/GeneratedResult';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Search, FileText } from 'lucide-react';

const contentTypeColors = {
  social_post: "bg-pink-100 text-pink-700 border-pink-200",
  instagram_story: "bg-purple-100 text-purple-700 border-purple-200",
  ad_copy: "bg-orange-100 text-orange-700 border-orange-200",
  sales_page: "bg-green-100 text-green-700 border-green-200",
  email: "bg-blue-100 text-blue-700 border-blue-200",
  vsl: "bg-red-100 text-red-700 border-red-200",
};

export default function LibraryPage() {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const [content, setContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadContent = useCallback(async () => {
    if (!activeProfile) {
      setContent([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const items = await GeneratedContent.filter({ business_profile_id: activeProfile.id }, '-created_date');
    setContent(items);
    setFilteredContent(items);
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  useEffect(() => {
    const results = content.filter(item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContent(results);
  }, [searchTerm, content]);

  return (
    <div className="space-y-3 sm:space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-3 sm:px-0">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Content Library
        </h1>
        <p className="text-slate-600 text-sm md:text-base mb-4 sm:mb-6">
          Browse, manage, and reuse all your generated content.
        </p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            placeholder="Search content..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </motion.div>

      {isLoading || isProfileLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-0">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-5 bg-slate-200 rounded w-3/4"></div></CardHeader>
              <CardContent><div className="h-4 bg-slate-200 rounded w-full mb-2"></div><div className="h-4 bg-slate-200 rounded w-5/6"></div></CardContent>
            </Card>
          ))}
        </div>
      ) : filteredContent.length === 0 ? (
        <div className="text-center py-12 sm:py-16 px-3 sm:px-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
          </div>
          <h3 className="font-semibold text-lg sm:text-xl text-slate-900 mb-2">No Content Found</h3>
          <p className="text-slate-500 text-sm sm:text-base">
            {content.length === 0 ? "You haven't generated any content yet." : "Your search didn't match any content."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 px-3 sm:px-0">
          {filteredContent.map(item => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                  className="cursor-pointer"
                >
                  <Card className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="truncate text-base">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="line-clamp-3 text-slate-600 text-sm">{item.content}</p>
                    </CardContent>
                    <div className="p-4 pt-0 flex justify-between items-center">
                      <Badge variant="secondary" className={`${contentTypeColors[item.content_type]} text-xs`}>
                        {item.content_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-slate-500">{format(new Date(item.created_date), 'MMM d, yyyy')}</span>
                    </div>
                  </Card>
                </motion.div>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col mx-3 sm:mx-auto">
                <DialogHeader>
                  <DialogTitle>{item.title}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto pr-2">
                  <GeneratedResult content={item.content} showActionsOnly />
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      )}
    </div>
  );
}
