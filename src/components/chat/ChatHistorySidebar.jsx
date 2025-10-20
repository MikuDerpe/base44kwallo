import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export default function ChatHistorySidebar({ history, activeChatId, onSelectChat, onNewChat, onDeleteChat, disabled }) {
  return (
    <aside className="w-80 md:w-64 lg:w-80 h-full border-r border-slate-200/80 bg-white/60 backdrop-blur-sm flex flex-col">
      <div className="p-3 md:p-4 border-b border-slate-200">
        <Button onClick={onNewChat} className="w-full" disabled={disabled} size="sm">
          <Plus className="w-4 h-4 mr-2" /> New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {history.map(chat => (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center justify-between p-2 md:p-3 rounded-lg cursor-pointer group mb-1 ${activeChatId === chat.id ? 'bg-indigo-100' : 'hover:bg-slate-100'}`}
            onClick={() => onSelectChat(chat)}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-slate-800 text-sm">{chat.title}</p>
              <p className="text-xs text-slate-500">
                {formatDistanceToNow(new Date(chat.updated_date), { addSuffix: true })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
            >
              <Trash2 className="w-3 h-3 text-red-500" />
            </Button>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}