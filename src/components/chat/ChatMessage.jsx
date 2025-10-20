import React from 'react';
import { Brain, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function ChatMessage({ message, isLoading }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-4 my-6 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`max-w-2xl px-5 py-3 rounded-xl ${isUser ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200'}`}>
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-slate-600" />
        </div>
      )}
    </motion.div>
  );
}