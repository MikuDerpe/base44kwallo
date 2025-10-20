
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Copy, Download, Plus, Check, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

function SingleResult({ initialContent }) {
  const [editedContent, setEditedContent] = useState(initialContent);
  return <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={15} className="border-slate-200 focus:border-indigo-500 text-base leading-relaxed" />;
}

function SocialPostResult({ post }) {
  return (
    <div className="space-y-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
      <div>
        <Label className="text-xs font-semibold text-slate-600 mb-2 block">Caption</Label>
        <p className="text-slate-800 whitespace-pre-wrap">{post.caption}</p>
      </div>
      {post.hashtags && post.hashtags.length > 0 && (
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-2 block">Hashtags</Label>
          <p className="text-indigo-600">{post.hashtags.join(' ')}</p>
        </div>
      )}
      {post.call_to_action && (
        <div>
          <Label className="text-xs font-semibold text-slate-600 mb-2 block">Call to Action</Label>
          <p className="text-slate-800">{post.call_to_action}</p>
        </div>
      )}
    </div>
  );
}

function SequenceResult({ sequence }) {
  const renderContent = (item) => {
    let mainContent = item.body || item.content || item.text || item;
    if (typeof mainContent === 'object') {
      return JSON.stringify(mainContent, null, 2);
    }
    return mainContent;
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
      {sequence.map((item, index) => (
        <div key={index} className="p-4 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-indigo-600">Item {index + 1}</h4>
            {item.slide_type && <span className="text-xs font-medium text-slate-500 uppercase">{item.slide_type.replace('_', ' ')}</span>}
            {item.post_type && <span className="text-xs font-medium text-slate-500 uppercase">{item.post_type}</span>}
          </div>
          {item.subject && <p className="font-semibold mb-2">Subject: {String(item.subject)}</p>}
          {item.caption && <p className="font-semibold mb-2">Caption: {String(item.caption)}</p>}
          {item.image_suggestion && <p className="text-slate-600 text-sm mb-2">Image Suggestion: {String(item.image_suggestion)}</p>}
          <pre className="text-slate-700 whitespace-pre-wrap font-sans">{renderContent(item)}</pre>
        </div>
      ))}
    </div>
  );
}

export default function GeneratedResult({ content, onNewContent, showActionsOnly = false }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  let contentType = 'text'; // 'text', 'social_post', 'sequence'
  let parsedContent = content;

  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (Array.isArray(parsed)) {
      contentType = 'sequence';
      parsedContent = parsed;
    } else if (parsed && typeof parsed === 'object') {
      // Check if it's a social post structure
      if (parsed.caption) {
        contentType = 'social_post';
        parsedContent = parsed;
      } else {
        parsedContent = parsed;
      }
    }
  } catch (e) {
    // Not JSON, treat as plain text
    parsedContent = content;
  }

  const handleCopy = async () => {
    let textToCopy;
    if (contentType === 'social_post') {
      textToCopy = `${parsedContent.caption}\n\n${parsedContent.hashtags?.join(' ') || ''}\n\n${parsedContent.call_to_action || ''}`;
    } else if (typeof content === 'string') {
      textToCopy = content;
    } else {
      textToCopy = JSON.stringify(content, null, 2);
    }
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleCopyToNotes = () => {
    let textToCopy;
    if (contentType === 'social_post') {
      textToCopy = `${parsedContent.caption}\n\n${parsedContent.hashtags?.join(' ') || ''}\n\n${parsedContent.call_to_action || ''}`;
    } else if (typeof content === 'string') {
      textToCopy = content;
    } else {
      textToCopy = JSON.stringify(content, null, 2);
    }
    
    // Navigate to Notes page with content as URL parameter
    const encodedContent = encodeURIComponent(textToCopy);
    navigate(createPageUrl("Notes") + `?content=${encodedContent}`);
  };
  
  const handleDownload = () => {
    let textToDownload;
    if (contentType === 'social_post') {
      textToDownload = `${parsedContent.caption}\n\n${parsedContent.hashtags?.join(' ') || ''}\n\n${parsedContent.call_to_action || ''}`;
    } else if (typeof content === 'string') {
      textToDownload = content;
    } else {
      textToDownload = JSON.stringify(content, null, 2);
    }
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated-content.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {!showActionsOnly && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2"><Check className="w-5 h-5" />Content Generated!</div>
          <p className="text-emerald-600 text-sm">{contentType === 'sequence' ? "Your content sequence is ready." : "Your AI-powered content is ready."}</p>
        </div>
      )}

      <div>
        {!showActionsOnly && <Label className="block font-semibold text-slate-700 mb-3">Generated Content</Label>}
        {contentType === 'social_post' ? (
          <SocialPostResult post={parsedContent} />
        ) : contentType === 'sequence' ? (
          <SequenceResult sequence={parsedContent} />
        ) : (
          <SingleResult initialContent={typeof parsedContent === 'string' ? parsedContent : JSON.stringify(parsedContent, null, 2)} />
        )}
      </div>

      <div className="flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleCopy} variant="outline" className="flex items-center gap-2">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Content'}
          </Button>
          <Button onClick={handleCopyToNotes} variant="outline" className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border-indigo-200">
            <FileText className="w-4 h-4 text-indigo-600" />
            Copy to Notes
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2"><Download className="w-4 h-4" />Download</Button>
        </div>
        {!showActionsOnly && (
          <Button onClick={onNewContent} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />New Content
          </Button>
        )}
      </div>
    </motion.div>
  );
}
