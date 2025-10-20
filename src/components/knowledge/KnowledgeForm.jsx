
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

// NICHES array defined directly in this file as per the outline
const NICHES = [
  { value: "General Online Business", label: "General Online Business" },
  { value: "Info Products", label: "Info Products" },
  { value: "Startups & Tech", label: "Startups & Tech" },
  { value: "Fitness", label: "Fitness" },
  { value: "Mindset", label: "Mindset" },
  { value: "Health & Wellness", label: "Health & Wellness" },
  { value: "Lifestyle & Personal Brand", label: "Lifestyle & Personal Brand" }
];

export default function KnowledgeForm({ knowledge, onSave, onCancel }) { // Renamed 'item' to 'knowledge'
  const [formData, setFormData] = useState({
    knowledge_name: '',
    knowledge_type: 'examples', // New default as per outline
    example_type: 'full_script', // New field and default as per outline
    target_generator: 'social_post', // New default as per outline
    post_format: '', // New field
    niche_tags: [],
    content: ''
  });

  useEffect(() => {
    if (knowledge) {
      setFormData({
        knowledge_name: knowledge.knowledge_name || '',
        knowledge_type: knowledge.knowledge_type || 'examples', // Default
        example_type: knowledge.example_type || 'full_script', // New field and default
        target_generator: knowledge.target_generator || 'social_post', // Default
        post_format: knowledge.post_format || '', // New field
        niche_tags: knowledge.niche_tags || [],
        content: knowledge.content || ''
      });
    } else {
      // Initialize with default values for new knowledge item
      setFormData({
        knowledge_name: '',
        knowledge_type: 'examples',
        example_type: 'full_script',
        target_generator: 'social_post',
        post_format: '',
        niche_tags: [],
        content: ''
      });
    }
  }, [knowledge]); // Dependency on knowledge prop

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // Derived states for conditional rendering
  const isExample = formData.knowledge_type === 'examples';
  const showPostFormat = ['social_post', 'ad_copy'].includes(formData.target_generator);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>{knowledge ? 'Edit Knowledge' : 'Add New Knowledge'}</CardTitle> {/* Updated CardTitle */}
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-6"> {/* Form wraps CardContent and CardFooter, added space-y-6 */}
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="knowledge_name">Knowledge Name *</Label>
            <Input
              id="knowledge_name"
              value={formData.knowledge_name}
              onChange={(e) => setFormData({ ...formData, knowledge_name: e.target.value })}
              required
              placeholder="e.g., 'Viral Hook Example #1' or 'YouTube Structure Guidelines'"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="knowledge_type">Knowledge Type *</Label>
            <Select
              value={formData.knowledge_type}
              onValueChange={(value) => setFormData({ ...formData, knowledge_type: value })}
              required
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="examples">Examples (sample scripts/hooks)</SelectItem>
                <SelectItem value="guidelines">Guidelines (structure rules)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isExample && (
            <div className="space-y-2">
              <Label htmlFor="example_type">Example Type *</Label>
              <Select
                value={formData.example_type}
                onValueChange={(value) => setFormData({ ...formData, example_type: value })}
                required
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_script">Full Script</SelectItem>
                  <SelectItem value="hook">Hook Only (opening 1-2 sentences)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                Hooks are the critical opening sentences that grab attention
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="target_generator">Target Generator *</Label>
            <Select
              value={formData.target_generator}
              onValueChange={(value) => setFormData({ ...formData, target_generator: value })}
              required
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="social_post">Social Post</SelectItem>
                <SelectItem value="ad_copy">Ad Copy</SelectItem>
                <SelectItem value="sales_page">Sales Page</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="instagram_story">Instagram Story</SelectItem>
                <SelectItem value="youtube_script">YouTube Script</SelectItem>
                <SelectItem value="general_chat">General Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showPostFormat && (
            <div className="space-y-2">
              <Label htmlFor="post_format">Post Format</Label>
              <Select
                value={formData.post_format || ''} // Handle null case for "All Formats"
                onValueChange={(value) => setFormData({ ...formData, post_format: value === null ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional - leave empty for all formats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Formats</SelectItem> {/* Use empty string for 'null' logic */}
                  <SelectItem value="text">Text Post</SelectItem>
                  <SelectItem value="video">Video Script</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {isExample && (
            <div className="space-y-2">
              <Label>Niche Tags (Optional)</Label>
              <p className="text-xs text-slate-500 mb-2">
                Leave empty for universal examples, or select specific niches
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3"> {/* Adjusted for new grid styling */}
                {NICHES.map(niche => (
                  <div key={niche.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`niche-${niche.value}`}
                      checked={formData.niche_tags?.includes(niche.value) || false}
                      onCheckedChange={(checked) => {
                        const current = formData.niche_tags || [];
                        const updated = checked
                          ? [...current, niche.value]
                          : current.filter(tag => tag !== niche.value);
                        setFormData({ ...formData, niche_tags: updated });
                      }}
                    />
                    <Label htmlFor={`niche-${niche.value}`} className="text-sm font-normal cursor-pointer">
                      {niche.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={15} // Increased rows
              placeholder={isExample ?
                (formData.example_type === 'hook' ?
                  "Paste just the opening 1-2 sentences of a high-performing script here..." :
                  "Paste the full example script here...") :
                "Write the structural guidelines here..."}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 border-t pt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"> {/* Preserved original hover styling */}
            {knowledge ? 'Update' : 'Create'} Knowledge
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
