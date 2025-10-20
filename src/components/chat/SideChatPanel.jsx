
import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/components/common/ProfileProvider';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Plus, Minimize2, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';

export default function SideChatPanel() {
  const { activeProfile, canUseChat } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [appKnowledge, setAppKnowledge] = useState('');
  const [calendarContent, setCalendarContent] = useState({ social: [], youtube: [] });

  const loadContext = useCallback(async () => {
    if (!activeProfile) return;

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 7);
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    const [guidelines, allCalendarPosts] = await Promise.all([
      base44.entities.AppKnowledge.filter({ knowledge_type: 'guidelines' }),
      base44.entities.CalendarPost.filter({ 
        business_profile_id: activeProfile.id
      }, '-date')
    ]);

    const postsInWindow = allCalendarPosts.filter(post => {
      return post.date >= startDateStr && post.date <= endDateStr;
    });

    const guidelinesText = guidelines.map(g => 
      `**${g.target_generator} Guidelines:**\n${g.content}`
    ).join('\n\n');
    
    setAppKnowledge(guidelinesText);
    
    const socialPosts = postsInWindow
      .filter(p => p.content_type === 'social_media')
      .sort((a, b) => b.date.localeCompare(a.date));
    
    const youtubePosts = postsInWindow
      .filter(p => p.content_type === 'youtube')
      .sort((a, b) => b.date.localeCompare(a.date));
    
    setCalendarContent({ social: socialPosts, youtube: youtubePosts });
  }, [activeProfile]);

  useEffect(() => {
    if (isOpen) {
      loadContext();
    }
  }, [isOpen, loadContext]);

  const handleSendMessage = async () => {
    if (!input.trim() || isSending || !activeProfile || !canUseChat()) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const currentInput = input;
    setInput('');
    setIsSending(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let prompt = `You are KWALLO AI, a helpful content strategy assistant.

**CRITICAL INSTRUCTION: Do NOT include any visual descriptions, image suggestions, or calls for visual elements in your output. Focus ONLY on providing pure text content.**

**CURRENT DATE: ${todayStr}**

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

    if (calendarContent.social.length > 0 || calendarContent.youtube.length > 0) {
      prompt += `\n\n**CONTEXT: CONTENT CALENDAR (Last 7 Days + Next 7 Days)**
Pay attention to STATUS:
- **[POSTED]** = Already published
- **[SCHEDULED]** = Not yet published
When user asks about "posted" content, ONLY consider [POSTED] items.`;

      if (calendarContent.social.length > 0) {
        prompt += `\n\n**Social Media Posts (${calendarContent.social.length} total):**\n`;
        calendarContent.social.forEach((post, idx) => {
          const statusLabel = post.status === 'posted' ? '[POSTED]' : '[SCHEDULED]';
          const preview = post.content.substring(0, 300);
          prompt += `\n${statusLabel} ${post.date}${post.title ? ` - ${post.title}` : ''}:\n${preview}${post.content.length > 300 ? '...' : ''}\n`;
        });
      }

      if (calendarContent.youtube.length > 0) {
        prompt += `\n\n**YouTube Scripts (${calendarContent.youtube.length} total):**\n`;
        calendarContent.youtube.forEach((post, idx) => {
          const statusLabel = post.status === 'posted' ? '[POSTED]' : '[SCHEDULED]';
          const preview = post.content.substring(0, 500);
          prompt += `\n${statusLabel} ${post.date}${post.title ? ` - ${post.title}` : ''}:\n${preview}${post.content.length > 500 ? '...' : ''}\n`;
        });
      }
    }

    prompt += `\n\n**Conversation:**
${newMessages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join('\n')}

**Current Message:**
${currentInput}

Respond helpfully and concisely.`;

    const response = await base44.functions.invoke('invokeGemini', { prompt });
    const aiMessage = { role: 'assistant', content: response.data.response };
    setMessages([...newMessages, aiMessage]);
    setIsSending(false);
  };

  const handleNewChat = () => {
    setMessages([]);
  };

  if (!canUseChat()) return null;

  return (
    <>
      {/* Toggle Button (Desktop Only) */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsOpen(true)}
          className="hidden lg:flex fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-2xl items-center justify-center z-50 transition-all hover:scale-110"
        >
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </motion.button>
      )}

      {/* Chat Panel (Desktop Only) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`hidden lg:flex fixed right-6 bottom-6 flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 ${
              isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="font-semibold text-slate-900">AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={handleNewChat}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-8">
                      <p className="text-sm">Ask me anything about your content!</p>
                    </div>
                  )}
                  {messages.map((msg, index) => (
                    <ChatMessage key={index} message={msg} />
                  ))}
                  {isSending && <ChatMessage message={{ role: 'assistant', content: '...' }} isLoading={true} />}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="relative">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      placeholder="Ask me anything..."
                      rows={2}
                      className="pr-12 resize-none text-sm"
                      disabled={isSending}
                    />
                    <Button
                      size="icon"
                      className="absolute right-2 top-2 w-8 h-8"
                      onClick={handleSendMessage}
                      disabled={isSending || !input.trim()}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
