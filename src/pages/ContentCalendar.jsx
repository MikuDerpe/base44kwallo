import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/components/common/ProfileProvider';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Check, Edit2, Trash2, MoveRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function ContentCalendarPage() {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarPosts, setCalendarPosts] = useState([]);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [addMethod, setAddMethod] = useState('write'); // 'write' or 'existing'
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    content_type: 'social_media'
  });
  const [selectedExistingPost, setSelectedExistingPost] = useState('');

  // Reschedule state
  const [reschedulingPost, setReschedulingPost] = useState(null);
  const [newDateForPost, setNewDateForPost] = useState(null);

  const loadData = useCallback(async () => {
    if (!activeProfile) return;
    
    setIsLoading(true);
    try {
      const [posts, generated] = await Promise.all([
        base44.entities.CalendarPost.filter({ business_profile_id: activeProfile.id }),
        base44.entities.GeneratedContent.filter({ business_profile_id: activeProfile.id }, '-created_date')
      ]);
      
      // Filter generated content to only social_post and youtube_script
      const contentPosts = generated.filter(g => 
        g.content_type === 'social_post' || g.content_type === 'youtube_script'
      );
      
      setCalendarPosts(posts);
      setGeneratedContent(contentPosts);
    } catch (error) {
      console.error("Error loading calendar data:", error);
    }
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getPostsForDate = (date) => {
    // Format the date to YYYY-MM-DD in local time for comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateString = `${year}-${month}-${day}`;
    
    return calendarPosts.filter(post => post.date === localDateString);
  };

  const handleDateClick = (day) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowDialog(true);
    setAddMethod('write');
    setNewPost({ title: '', content: '', content_type: 'social_media' });
    setSelectedExistingPost('');
  };

  const handleAddPost = async () => {
    if (!selectedDate || !activeProfile) return;
    
    let contentToAdd = '';
    let titleToAdd = '';
    let typeToAdd = newPost.content_type;
    
    if (addMethod === 'write') {
      if (!newPost.content.trim()) return;
      contentToAdd = newPost.content;
      titleToAdd = newPost.title || `Post for ${selectedDate.toLocaleDateString()}`;
    } else {
      if (!selectedExistingPost) return;
      const selected = generatedContent.find(g => g.id === selectedExistingPost);
      if (!selected) return;
      
      contentToAdd = selected.content;
      titleToAdd = selected.title;
      typeToAdd = selected.content_type === 'youtube_script' ? 'youtube' : 'social_media';
    }
    
    try {
      // Fix: Format date as YYYY-MM-DD in local timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      await base44.entities.CalendarPost.create({
        business_profile_id: activeProfile.id,
        date: localDateString,
        content: contentToAdd,
        content_type: typeToAdd,
        status: 'scheduled',
        title: titleToAdd
      });
      
      await loadData();
      setShowDialog(false);
      setNewPost({ title: '', content: '', content_type: 'social_media' });
      setSelectedExistingPost('');
    } catch (error) {
      console.error("Error adding post:", error);
    }
  };

  const handleMarkAsPosted = async (postId) => {
    try {
      const post = calendarPosts.find(p => p.id === postId);
      await base44.entities.CalendarPost.update(postId, {
        status: post.status === 'posted' ? 'scheduled' : 'posted'
      });
      await loadData();
    } catch (error) {
      console.error("Error updating post status:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await base44.entities.CalendarPost.delete(postId);
      await loadData();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handleReschedulePost = async (postId) => {
    if (!newDateForPost) return;
    
    try {
      const year = newDateForPost.getFullYear();
      const month = String(newDateForPost.getMonth() + 1).padStart(2, '0');
      const day = String(newDateForPost.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      await base44.entities.CalendarPost.update(postId, {
        date: localDateString
      });
      
      await loadData();
      setReschedulingPost(null);
      setNewDateForPost(null);
    } catch (error) {
      console.error("Error rescheduling post:", error);
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isProfileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Profile Selected</h2>
            <p className="text-slate-600 mb-6">
              Select a business profile from the orb above to access your content calendar.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const postsForSelectedDate = selectedDate ? getPostsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-3 sm:px-0"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Content Calendar
            </h1>
            <p className="text-slate-600 text-sm">
              Plan and track your content for {activeProfile.business_name}
            </p>
          </div>
        </div>
      </motion.div>

      <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              {monthName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-semibold text-slate-600 text-sm py-2">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before month starts */}
            {Array(startingDayOfWeek).fill(null).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}
            
            {/* Day cells */}
            {Array(daysInMonth).fill(null).map((_, index) => {
              const day = index + 1;
              const date = new Date(year, month, day);
              const posts = getPostsForDate(date);
              const isToday = new Date().toDateString() === date.toDateString();
              
              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square border rounded-lg p-2 cursor-pointer transition-all ${
                    isToday 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-sm font-semibold text-slate-900 mb-1">{day}</div>
                  <div className="space-y-1">
                    {posts.slice(0, 2).map((post, idx) => (
                      <div
                        key={post.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          post.content_type === 'youtube' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {post.status === 'posted' && '✓ '}{post.title}
                      </div>
                    ))}
                    {posts.length > 2 && (
                      <div className="text-xs text-slate-500">+{posts.length - 2} more</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add/View Posts Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && `Content for ${selectedDate.toLocaleDateString()}`}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Existing posts for this date */}
            {postsForSelectedDate.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Scheduled Posts</h3>
                {postsForSelectedDate.map(post => (
                  <Card key={post.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={post.content_type === 'youtube' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}>
                              {post.content_type === 'youtube' ? 'YouTube' : 'Social Media'}
                            </Badge>
                            {post.status === 'posted' && (
                              <Badge className="bg-green-100 text-green-700">
                                <Check className="w-3 h-3 mr-1" /> Posted
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-slate-900 mb-2">{post.title}</h4>
                          
                          {/* Full content with scroll */}
                          <div className="max-h-60 overflow-y-auto bg-slate-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{post.content}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsPosted(post.id)}
                        >
                          {post.status === 'posted' ? 'Unmark' : 'Mark Posted'}
                        </Button>
                        
                        {/* Reschedule Button */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoveRight className="w-4 h-4 mr-1" />
                              Reschedule
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={newDateForPost}
                              onSelect={(date) => {
                                setNewDateForPost(date);
                                setReschedulingPost(post.id);
                              }}
                              initialFocus
                            />
                            {newDateForPost && reschedulingPost === post.id && (
                              <div className="p-3 border-t">
                                <Button 
                                  size="sm" 
                                  className="w-full"
                                  onClick={() => handleReschedulePost(post.id)}
                                >
                                  Move to {format(newDateForPost, 'MMM d, yyyy')}
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Add new post */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-slate-900 mb-4">Add New Post</h3>
              
              <Tabs value={addMethod} onValueChange={setAddMethod}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="write">Write New</TabsTrigger>
                  <TabsTrigger value="existing">Choose Existing</TabsTrigger>
                </TabsList>
                
                <TabsContent value="write" className="space-y-4">
                  <div>
                    <Label>Title (optional)</Label>
                    <Input
                      value={newPost.title}
                      onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                      placeholder="Post title..."
                    />
                  </div>
                  
                  <div>
                    <Label>Content Type</Label>
                    <Select value={newPost.content_type} onValueChange={(v) => setNewPost({...newPost, content_type: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="social_media">Social Media Post</SelectItem>
                        <SelectItem value="youtube">YouTube Script</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Content</Label>
                    <Textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                      placeholder="Write your content here..."
                      rows={8}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="existing" className="space-y-4">
                  <div>
                    <Label>Select from your generated content</Label>
                    <Select value={selectedExistingPost} onValueChange={setSelectedExistingPost}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a post..." />
                      </SelectTrigger>
                      <SelectContent>
                        {generatedContent.map(content => (
                          <SelectItem key={content.id} value={content.id}>
                            [{content.content_type === 'youtube_script' ? 'YT' : 'SM'}] {content.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedExistingPost && (
                    <div className="p-4 bg-slate-50 rounded-lg max-h-48 overflow-y-auto">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap">
                        {generatedContent.find(g => g.id === selectedExistingPost)?.content}
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddPost}
                  className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Calendar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}