
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { GeneratedContent } from "@/api/entities";
import { AppKnowledge } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import GeneratedResult from "./GeneratedResult";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { NICHES } from '../profile/ProfileForm';

const generatorConfigs = {
  social_post: { title: "Social Media Post" },
  instagram_story: { title: "Instagram Story Sequence" },
  email: { title: "Funnel Strategy" }, // Changed from "Email Campaign"
  ad_copy: { title: "Advertisement Copy" },
  sales_page: { title: "Sales Page" },
  youtube_script: { title: "YouTube Script" }
};

const FormField = ({ label, children }) => (
  <div className="space-y-3">
    <Label className="font-semibold text-slate-700">{label}</Label>
    {children}
  </div>
);

export default function ContentGenerator({ type, profile, onGenerate, onBack }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [formState, setFormState] = useState({
    request: '',
    inspiration_script: '',
    platforms: [],
    selected_niche: profile?.niche || '',
    post_format: 'video', // Always video for social_post, but hidden from user
    custom_hooks: '',
    length: 'medium',
  });

  const config = generatorConfigs[type];

  const handleFormChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const loadHistory = useCallback(async () => {
    if (!profile) return;
    const recentGenerations = await GeneratedContent.filter({ content_type: type, business_profile_id: profile.id }, "-created_date", 10);
    setHistory(recentGenerations);
  }, [type, profile]);

  useEffect(() => {
    setFormState({
      request: '',
      inspiration_script: '',
      platforms: [],
      selected_niche: profile?.niche || '',
      post_format: 'video', // Reset to default video
      custom_hooks: '', // Reset custom_hooks here as well
      length: 'medium', // Reset length here as well
    });
    setResult(null);
    loadHistory();
  }, [type, loadHistory, profile]);

  const handleGenerate = async () => {
    if (!formState.request?.trim()) return;
    
    // Validate platforms for social_post
    if (type === 'social_post' && (!formState.platforms || formState.platforms.length === 0)) {
      alert("Please select at least one platform for your social media post.");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedContent = await onGenerate(config, formState);
      setResult(generatedContent);
      loadHistory();
    } catch (error) {
      console.error("Error generating content:", error);
    }
    setIsGenerating(false);
  };
  
  const renderForm = () => {
    switch(type) {
      case 'social_post':
        return <div className="space-y-6">
          <FormField label="Main Idea/Prompt *">
            <Textarea 
              value={formState.request || ''} 
              onChange={(e) => handleFormChange('request', e.target.value)} 
              required
              rows={4}
            />
          </FormField>

          {/* Post Format selector removed */}

          <FormField label="Length *">
            <Select value={formState.length || 'medium'} onValueChange={(v) => handleFormChange('length', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="very_short">Very Short (text post)</SelectItem>
                <SelectItem value="short">Short (~15 seconds)</SelectItem>
                <SelectItem value="medium">Medium (~30 seconds)</SelectItem>
                <SelectItem value="long">Long (~1 minute)</SelectItem>
                <SelectItem value="very_long">Very Long (~2 minutes)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 mt-2">Select the desired length for your content</p>
          </FormField>

          <FormField label="Platforms *">
            <div className="flex flex-wrap gap-4">
              {['Instagram', 'TikTok', 'Facebook'].map(p => (
                <div key={p} className="flex items-center gap-2">
                  <Checkbox id={`platform-${p}`} checked={formState.platforms?.includes(p)} onCheckedChange={(checked) => {
                    const current = formState.platforms || [];
                    const newPlatforms = checked ? [...current, p] : current.filter(item => item !== p);
                    handleFormChange('platforms', newPlatforms);
                  }}/>
                  <Label htmlFor={`platform-${p}`}>{p}</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Select at least one platform so AI can tailor the content appropriately</p>
          </FormField>

          <FormField label="Call-to-Action (Optional)">
            <Input value={formState.cta || ''} onChange={(e) => handleFormChange('cta', e.target.value)} />
          </FormField>

          <FormField label="Inspiration Script (Optional)">
            <Textarea 
              value={formState.inspiration_script || ''} 
              onChange={(e) => handleFormChange('inspiration_script', e.target.value)} 
              placeholder="Paste any existing scripts or text that the AI should use as a style reference." 
              rows={4} 
            />
          </FormField>
        </div>;
        
      case 'instagram_story':
      case 'email':
        return <div className="space-y-6">
          <FormField label="Main Idea/Prompt *">
             <Textarea value={formState.request || ''} onChange={(e) => handleFormChange('request', e.target.value)} required rows={4} />
          </FormField>
          {type === 'email' && <FormField label="Email Type">
            <Select value={formState.email_type || ''} onValueChange={(v) => handleFormChange('email_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select email type..." /></SelectTrigger>
              <SelectContent>{['Single', 'Welcome Sequence', 'Promo Sequence', 'Re-engagement', 'Newsletter'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>}
          <FormField label="Goal of the Sequence (Optional)">
            <Input value={formState.goal || ''} onChange={(e) => handleFormChange('goal', e.target.value)} />
          </FormField>
          <FormField label="Number of Stories/Emails (Optional)">
            <Input type="number" value={formState.num_items || ''} onChange={(e) => handleFormChange('num_items', e.target.value)} />
          </FormField>
          <FormField label="Inspiration Script (Optional)">
            <Textarea 
              value={formState.inspiration_script || ''} 
              onChange={(e) => handleFormChange('inspiration_script', e.target.value)} 
              placeholder="Paste any existing scripts or text that the AI should use as a structural or tonal reference." 
              rows={4} 
            />
          </FormField>
        </div>;
        
      case 'ad_copy':
        return <div className="space-y-6">
          <FormField label="Main Idea/Prompt *">
            <Textarea value={formState.request || ''} onChange={(e) => handleFormChange('request', e.target.value)} required rows={4} />
          </FormField>
          <FormField label="Ad Format">
            <Select value={formState.ad_type || ''} onValueChange={(v) => handleFormChange('ad_type', v)}>
              <SelectTrigger><SelectValue placeholder="Select ad format..." /></SelectTrigger>
              <SelectContent>
                {['Image Ad', 'Video Ad', 'Video Sales Letter'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Desired Length in Minutes (Optional)">
            <Input type="number" value={formState.length || ''} onChange={(e) => handleFormChange('length', e.target.value)} placeholder="e.g., 5" />
          </FormField>
          <FormField label="Objections to Address (Optional)">
            <Textarea value={formState.objections || ''} onChange={(e) => handleFormChange('objections', e.target.value)} placeholder="e.g., It's too expensive, I don't have time, Will this work for me?" />
          </FormField>
          <FormField label="Testimonials to Include (Optional)">
            <Textarea value={formState.testimonials || ''} onChange={(e) => handleFormChange('testimonials', e.target.value)} placeholder="Paste testimonials or success stories here." />
          </FormField>
          <FormField label="Inspiration Script (Optional)">
            <Textarea 
              value={formState.inspiration_script || ''} 
              onChange={(e) => handleFormChange('inspiration_script', e.target.value)} 
              placeholder="Paste any existing scripts or text that the AI should use as a structural or tonal reference." 
              rows={4} 
            />
          </FormField>
        </div>;
        
      case 'sales_page':
        return <div className="space-y-6">
          <FormField label="Main Idea/Prompt *">
            <Textarea value={formState.request || ''} onChange={(e) => handleFormChange('request', e.target.value)} required rows={4} />
          </FormField>
          <FormField label="Desired Length (Optional)">
            <Select value={formState.length || ''} onValueChange={(v) => handleFormChange('length', v)}>
              <SelectTrigger><SelectValue placeholder="Select desired length..." /></SelectTrigger>
              <SelectContent>{['Short', 'Medium', 'Long'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </FormField>
          <FormField label="Headline Ideas (Optional)">
            <Textarea value={formState.headline_ideas || ''} onChange={(e) => handleFormChange('headline_ideas', e.target.value)} />
          </FormField>
          <FormField label="Objections to Address (Optional)">
            <Textarea value={formState.objections || ''} onChange={(e) => handleFormChange('objections', e.target.value)} />
          </FormField>
          <FormField label="Testimonials to Include (Optional)">
            <Textarea value={formState.testimonials || ''} onChange={(e) => handleFormChange('testimonials', e.target.value)} />
          </FormField>
          <FormField label="Inspiration Script (Optional)">
            <Textarea 
              value={formState.inspiration_script || ''} 
              onChange={(e) => handleFormChange('inspiration_script', e.target.value)} 
              placeholder="Paste any existing scripts or text that the AI should use as a structural or tonal reference." 
              rows={4} 
            />
          </FormField>
        </div>;
        
      case 'youtube_script':
        return <div className="space-y-6">
          <FormField label="Main Idea/Prompt *">
            <Textarea value={formState.request || ''} onChange={(e) => handleFormChange('request', e.target.value)} required rows={4} />
          </FormField>
          <FormField label="Video Length in Minutes (5-40) *">
            <Input type="number" min="5" max="40" value={formState.video_length || ''} onChange={(e) => handleFormChange('video_length', e.target.value)} placeholder="e.g., 15" required />
          </FormField>
          <FormField label="Custom Hook (Optional)">
            <Textarea 
              value={formState.custom_hooks || ''} 
              onChange={(e) => handleFormChange('custom_hooks', e.target.value)} 
              placeholder="Write a hook you want the AI to use for this video" 
              rows={4} 
            />
          </FormField>
          <FormField label="All the Points You Want to Include (Optional)">
            <Textarea value={formState.key_points || ''} onChange={(e) => handleFormChange('key_points', e.target.value)} placeholder="List all the key points, topics, or sections you want covered in the video." rows={6} />
          </FormField>
          <FormField label="Inspiration Script (Optional)">
            <Textarea 
              value={formState.inspiration_script || ''} 
              onChange={(e) => handleFormChange('inspiration_script', e.target.value)} 
              placeholder="Paste any existing scripts or text that the AI should use as a structural or tonal reference." 
              rows={4} 
            />
          </FormField>
        </div>;
        
      default: return null;
    }
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="border-b border-slate-100 p-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></Button>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900 flex items-center gap-3"><Sparkles className="w-6 h-6 text-indigo-500" />{config.title}</CardTitle>
                <p className="text-slate-600 mt-1">The AI will generate text-based scripts and copy. It does not create visuals.</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {!result ? (
              <div className="space-y-6">
                {/* Niche Selector - Available for ALL generators */}
                <FormField label="Content Style/Niche">
                  <Select value={formState.selected_niche} onValueChange={(v) => handleFormChange('selected_niche', v)}>
                    <SelectTrigger><SelectValue placeholder="Select niche..." /></SelectTrigger>
                    <SelectContent>
                      {NICHES.map(n => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500 mt-2">
                    Override your profile's default niche to explore different content styles and examples
                  </p>
                </FormField>

                {renderForm()}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={!formState.request?.trim() || isGenerating} 
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8"
                  >
                    {isGenerating ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Content</>}
                  </Button>
                </div>
              </div>
            ) : (
              <GeneratedResult content={result} onNewContent={() => { setResult(null); setFormState({ request: '', inspiration_script: '', platforms: [], selected_niche: profile?.niche || '', post_format: 'video', custom_hooks: '', length: 'medium' }); }} />
            )}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-lg font-semibold">Recent Generations</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.length > 0 ? history.map(item => (
                <Dialog key={item.id}>
                  <DialogTrigger asChild>
                    <div className="p-3 rounded-lg bg-slate-50 text-sm border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                      <p className="font-medium text-slate-800 truncate">{item.title}</p>
                      <p className="text-slate-500 text-xs">{format(new Date(item.created_date), 'MMM d, yyyy')}</p>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{item.title}</DialogTitle>
                    </DialogHeader>
                    <div className="pr-4">
                      <GeneratedResult content={item.content} showActionsOnly />
                    </div>
                  </DialogContent>
                </Dialog>
              )) : <p className="text-slate-500 text-sm">No history for this generator yet.</p>}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
