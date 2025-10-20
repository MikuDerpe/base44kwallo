
import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/components/common/ProfileProvider';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, Trash2, Lock, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ChatMessage from '../components/chat/ChatMessage';

export default function ChatPage() {
  const { activeProfile, isLoading: isProfileLoading, canUseChat } = useProfile();
  const [appKnowledge, setAppKnowledge] = useState('');
  const [calendarContent, setCalendarContent] = useState({ social: [], youtube: [] });
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectChat = useCallback((chat) => {
    setActiveChat(chat);
    setMessages(chat.messages);
    setSidebarOpen(false);
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!activeProfile) {
      setChatHistory([]);
      setActiveChat(null);
      setMessages([]);
      setCalendarContent({ social: [], youtube: [] });
      return;
    }

    // Calculate date range: last 7 days to next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to start of day

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    // Format dates as YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // Load guidelines, chat history, AND calendar content (all posts in 14-day window)
    const [guidelines, history, allCalendarPosts] = await Promise.all([
      base44.entities.AppKnowledge.filter({ knowledge_type: 'guidelines' }),
      base44.entities.ChatHistory.filter({ business_profile_id: activeProfile.id }, '-updated_date'),
      base44.entities.CalendarPost.filter({ 
        business_profile_id: activeProfile.id
      }, '-date')
    ]);

    // Filter posts to only those in the 14-day window
    const postsInWindow = allCalendarPosts.filter(post => {
      // Ensure post.date is treated as a string for comparison with startDateStr/endDateStr
      return post.date >= startDateStr && post.date <= endDateStr;
    });

    // Combine all guidelines into a concise knowledge base
    const guidelinesText = guidelines.map(g => 
      `**${g.target_generator} Guidelines:**\n${g.content}`
    ).join('\n\n');
    
    setAppKnowledge(guidelinesText);
    
    // Separate content by type
    const socialPosts = postsInWindow
      .filter(p => p.content_type === 'social_media')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
    
    const youtubePosts = postsInWindow
      .filter(p => p.content_type === 'youtube')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sort by date descending
    
    setCalendarContent({ social: socialPosts, youtube: youtubePosts });
    setChatHistory(history);
    
    if (history.length > 0) {
      selectChat(history[0]);
    } else {
      setActiveChat(null);
      setMessages([]);
    }
  }, [activeProfile, selectChat]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const createNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setSidebarOpen(false);
  };
  
  const deleteChat = async (chatId) => {
    await base44.entities.ChatHistory.delete(chatId);
    setChatHistory(chatHistory.filter(c => c.id !== chatId));
    if (activeChat?.id === chatId) {
      createNewChat();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !activeProfile || !canUseChat()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsSending(true);

    // Get today's date for context
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const todayStr = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let prompt = `You are KWALLO AI, a helpful content strategy assistant specializing in social media content, personal branding, and digital marketing.

**CRITICAL INSTRUCTION: Do NOT include any visual descriptions, image suggestions, or calls for visual elements in your output. Focus ONLY on providing pure text content.**

**CURRENT DATE: ${todayStr}**
Use this date as a reference when discussing the user's content calendar and posting schedule.

**CONTEXT: Creator's Content Strategy Guidelines**
${appKnowledge}

**CONTEXT: User's Business Profile:**
- Business Name: ${activeProfile?.business_name || 'Not provided'}
- Business Type: ${activeProfile?.business_type || 'Not provided'}
- Niche: ${activeProfile?.niche || 'Not provided'}
- Offer Statement: ${activeProfile?.offer_statement || 'Not provided'}
- Content Interests: ${activeProfile?.content_interests || 'Not provided'}
- Target Audience: ${activeProfile?.target_audience || 'Not provided'}
- Audience Pains: ${activeProfile?.audience_pains || 'Not provided'}
- Business Story: ${activeProfile?.business_story || 'Not provided'}
- Desired Outcome: ${activeProfile?.desired_outcome || 'Not provided'}
- Customer Objections: ${activeProfile?.customer_objections || 'Not provided'}
- Offer Structure: ${activeProfile?.offer_structure || 'Not provided'}
- Unique Selling Proposition: ${activeProfile?.usp || 'Not provided'}
- Client Results: ${activeProfile?.client_results || 'Not provided'}
- Client Count: ${activeProfile?.client_count || 'Not provided'}
- Tone of Voice / Existing Content: ${activeProfile?.existing_content_scripts || 'Not provided'}`;

    // Add calendar content context (14-day window)
    if (calendarContent.social.length > 0 || calendarContent.youtube.length > 0) {
      prompt += `\n\n**CONTEXT: CONTENT CALENDAR (Last 7 Days + Next 7 Days)**
This is content from the user's content calendar. Pay close attention to the STATUS of each post:
- **[POSTED]** = Already published/went live (user marked it as "posted")
- **[SCHEDULED]** = Not yet published, planned for future
When user asks about "posted" content, ONLY consider items marked as [POSTED].`;

      if (calendarContent.social.length > 0) {
        prompt += `\n\n**Social Media Posts in Calendar (${calendarContent.social.length} total):**\n`;
        calendarContent.social.forEach((post, idx) => {
          const postDate = new Date(post.date + 'T00:00:00');
          postDate.setHours(0, 0, 0, 0);
          
          const isPosted = post.status === 'posted';
          const statusLabel = isPosted ? '[POSTED]' : '[SCHEDULED]';
          
          const preview = post.content.substring(0, 500);
          prompt += `\n${statusLabel} Post ${idx + 1} (${post.date})${post.title ? ` - ${post.title}` : ''}:\n${preview}${post.content.length > 500 ? '...' : ''}\n`;
        });
      }

      if (calendarContent.youtube.length > 0) {
        prompt += `\n\n**YouTube Scripts in Calendar (${calendarContent.youtube.length} total):**\n`;
        calendarContent.youtube.forEach((post, idx) => {
          const postDate = new Date(post.date + 'T00:00:00');
          postDate.setHours(0, 0, 0, 0);
          
          const isPosted = post.status === 'posted';
          const statusLabel = isPosted ? '[POSTED]' : '[SCHEDULED]';
          
          const preview = post.content.substring(0, 800);
          prompt += `\n${statusLabel} Script ${idx + 1} (${post.date})${post.title ? ` - ${post.title}` : ''}:\n${preview}${post.content.length > 800 ? '...' : ''}\n`;
        });
      }
    }

    prompt += `\n\n**Conversation History:**
${newMessages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')}

**Current User Message:**
${currentInput}

Please respond as a helpful AI content assistant. Provide specific, actionable advice based on the user's business profile, the content strategy guidelines, and their content calendar above. When user asks about "posted" content, only reference items marked as [POSTED]. When discussing dates, remember that today is ${todayStr}.`;

    const response = await base44.functions.invoke('invokeGemini', { prompt });
    const aiMessage = { role: 'assistant', content: response.data.response };
    const finalMessages = [...newMessages, aiMessage];
    setMessages(finalMessages);

    if (activeChat) {
      await base44.entities.ChatHistory.update(activeChat.id, { messages: finalMessages });
    } else {
      const newChat = await base44.entities.ChatHistory.create({
        title: currentInput.substring(0, 40),
        messages: finalMessages,
        business_profile_id: activeProfile.id,
      });
      setActiveChat(newChat);
    }
    
    const history = await base44.entities.ChatHistory.filter({ business_profile_id: activeProfile.id }, '-updated_date');
    setChatHistory(history);

    setIsSending(false);
  };
  
  if (isProfileLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>;
  }

  const chatDisabled = !canUseChat();
  
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-2 sm:gap-4">
      {/* Chat History Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 fixed md:relative z-50 h-full w-72 bg-white rounded-none sm:rounded-lg shadow-lg border-r sm:border border-slate-200`}>
        <div className="flex flex-col h-full">
          <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Chat History</h3>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="p-3 sm:p-4 border-b border-slate-200">
            <Button onClick={createNewChat} className="w-full" disabled={!activeProfile || isProfileLoading || chatDisabled} size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Chat
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {chatHistory.map(chat => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group mb-1 ${activeChat?.id === chat.id ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}
                onClick={() => selectChat(chat)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-slate-800 text-sm">{chat.title}</p>
                  <p className="text-xs text-slate-500">{new Date(chat.updated_date).toLocaleDateString()}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-none sm:rounded-lg shadow-lg border-0 sm:border border-slate-200 min-w-0">
        {/* Chat Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h2 className="font-semibold text-slate-900 text-sm sm:text-base">AI Chat Assistant</h2>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            {isSending && <ChatMessage message={{ role: 'assistant', content: '...' }} isLoading={true} />}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-slate-200">
          {chatDisabled && (
            <div className="mb-3 sm:mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center gap-3">
              <Lock className="w-5 h-5 text-orange-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-orange-900">AI Chat is locked on the free plan</p>
                <p className="text-xs text-orange-700">Upgrade to Starter or Pro to unlock AI Chat</p>
              </div>
              <Link to={createPageUrl("Account")}>
                <Button size="sm" className="bg-orange-600 hover:bg-orange-700 flex-shrink-0 text-xs">Upgrade</Button>
              </Link>
            </div>
          )}
          <div className="relative max-w-3xl mx-auto">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder={chatDisabled ? "Upgrade to unlock AI Chat..." : "Ask me anything about your content, strategy, or business..."}
              rows={2}
              className="pr-12 rounded-lg resize-none text-sm sm:text-base"
              disabled={chatDisabled || isSending}
            />
            <Button
              size="icon"
              className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
              onClick={handleSendMessage}
              disabled={isSending || !activeProfile || isProfileLoading || chatDisabled || !input.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
