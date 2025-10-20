
import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/components/common/ProfileProvider';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Trash2, ChevronDown, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { debounce } from 'lodash';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

export default function NotesPage() {
  const { activeProfile, isLoading: isProfileLoading } = useProfile();
  const [notes, setNotes] = useState([]);
  const [expandedNotes, setExpandedNotes] = useState({});
  const [editingNotes, setEditingNotes] = useState({});
  const [editingTitles, setEditingTitles] = useState({}); // New state for editing titles
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendarDialog, setShowCalendarDialog] = useState(false);
  const [selectedNoteForCalendar, setSelectedNoteForCalendar] = useState(null);
  const [calendarPost, setCalendarPost] = useState({
    date: new Date(),
    content: '',
    content_type: 'social_media',
    title: ''
  });

  const loadNotes = useCallback(async () => {
    if (!activeProfile) {
      setNotes([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const existingNotes = await base44.entities.ProfileNotes.filter({ 
        business_profile_id: activeProfile.id 
      }, '-created_date');
      
      setNotes(existingNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
    setIsLoading(false);
  }, [activeProfile]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Auto-save function for content
  const saveNote = async (noteId, newContent) => {
    try {
      await base44.entities.ProfileNotes.update(noteId, {
        content: newContent,
        // The title is now separately editable, so this auto-generation is less critical,
        // but can remain as a fallback or for initial titles.
        title: newContent.substring(0, 50) + (newContent.length > 50 ? '...' : '')
      });
    } catch (error) {
      console.error("Error saving note content:", error);
    }
  };

  // Auto-save function for title
  const saveNoteTitle = async (noteId, newTitle) => {
    try {
      await base44.entities.ProfileNotes.update(noteId, {
        title: newTitle
      });
      // Update local state for immediate visual feedback
      setNotes(prev => prev.map(n => n.id === noteId ? { ...n, title: newTitle } : n));
    } catch (error) {
      console.error("Error saving note title:", error);
    }
  };

  // Debounced save for content
  const debouncedSave = useCallback(
    debounce((noteId, newContent) => {
      saveNote(noteId, newContent);
    }, 1000),
    []
  );

  // Debounced save for title
  const debouncedSaveTitle = useCallback(
    debounce((noteId, newTitle) => {
      saveNoteTitle(noteId, newTitle);
    }, 500),
    []
  );

  const handleContentChange = (noteId, newContent) => {
    setEditingNotes(prev => ({ ...prev, [noteId]: newContent }));
    debouncedSave(noteId, newContent);
  };

  const handleTitleChange = (noteId, newTitle) => {
    setEditingTitles(prev => ({ ...prev, [noteId]: newTitle }));
    debouncedSaveTitle(noteId, newTitle);
  };

  const handleCreateNewNote = async () => {
    if (!activeProfile) return;
    
    try {
      const newNote = await base44.entities.ProfileNotes.create({
        business_profile_id: activeProfile.id,
        content: '',
        title: 'New Note'
      });
      
      setNotes(prev => [newNote, ...prev]);
      setExpandedNotes(prev => ({ ...prev, [newNote.id]: true }));
      setEditingNotes(prev => ({ ...prev, [newNote.id]: '' }));
      setEditingTitles(prev => ({ ...prev, [newNote.id]: newNote.title })); // Initialize new title
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await base44.entities.ProfileNotes.delete(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      
      // Clean up state
      setExpandedNotes(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
      setEditingNotes(prev => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
      setEditingTitles(prev => { // Clean up editingTitles state
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const toggleNote = (noteId) => {
    setExpandedNotes(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const openCalendarDialog = (note) => {
    setSelectedNoteForCalendar(note);
    setCalendarPost({
      date: new Date(),
      content: editingNotes[note.id] !== undefined ? editingNotes[note.id] : note.content,
      content_type: 'social_media',
      title: editingTitles[note.id] !== undefined ? editingTitles[note.id] : note.title || ''
    });
    setShowCalendarDialog(true);
  };

  const handleAddToCalendar = async () => {
    if (!calendarPost.content.trim() || !activeProfile) {
      alert('Content cannot be empty.');
      return;
    }
    
    try {
      // Fix: Format date as YYYY-MM-DD in local timezone
      const year = calendarPost.date.getFullYear();
      const month = String(calendarPost.date.getMonth() + 1).padStart(2, '0');
      const day = String(calendarPost.date.getDate()).padStart(2, '0');
      const localDateString = `${year}-${month}-${day}`;
      
      await base44.entities.CalendarPost.create({
        business_profile_id: activeProfile.id,
        date: localDateString,
        content: calendarPost.content,
        content_type: calendarPost.content_type,
        status: 'scheduled',
        title: calendarPost.title || `Post for ${format(calendarPost.date, 'MMM d, yyyy')}`
      });
      
      setShowCalendarDialog(false);
      setSelectedNoteForCalendar(null);
      setCalendarPost({
        date: new Date(),
        content: '',
        content_type: 'social_media',
        title: ''
      });
      
      alert('Post added to calendar successfully!');
    } catch (error) {
      console.error("Error adding to calendar:", error);
      alert('Error adding post to calendar');
    }
  };

  // Handle incoming content from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const incomingContent = urlParams.get('content');
    
    if (incomingContent && activeProfile) {
      // Create a new note with the incoming content
      (async () => {
        try {
          const timestamp = new Date().toLocaleString();
          const newNote = await base44.entities.ProfileNotes.create({
            business_profile_id: activeProfile.id,
            content: incomingContent,
            title: `[Added ${timestamp}] ${incomingContent.substring(0, 40)}...`
          });
          
          setNotes(prev => [newNote, ...prev]);
          setExpandedNotes(prev => ({ ...prev, [newNote.id]: true }));
          setEditingNotes(prev => ({ ...prev, [newNote.id]: incomingContent }));
          setEditingTitles(prev => ({ ...prev, [newNote.id]: newNote.title })); // Initialize new title from URL
          
          // Clean up URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (error) {
          console.error("Error creating note from URL:", error);
        }
      })();
    }
  }, [activeProfile]);

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
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">No Profile Selected</h2>
            <p className="text-slate-600 mb-6">
              Select a business profile from the orb above to access your notes.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              Your Notes
            </h1>
            <p className="text-slate-600 text-sm">
              A space for {activeProfile.business_name} to draft, edit, and store content
            </p>
          </div>
          <Button 
            onClick={handleCreateNewNote}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </motion.div>

      {/* The main notes list, without the outer Card wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">No notes yet. Create your first note!</p>
            <Button onClick={handleCreateNewNote} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Create Note
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {notes.map((note) => {
                const isExpanded = expandedNotes[note.id];
                const currentContent = editingNotes[note.id] !== undefined ? editingNotes[note.id] : note.content;
                const currentTitle = editingTitles[note.id] !== undefined ? editingTitles[note.id] : (note.title || 'Untitled Note');
                
                return (
                  <motion.div
                    key={note.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm"
                  >
                    {/* Note Header */}
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div 
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleNote(note.id)}
                      >
                        {isExpanded ? 
                          <ChevronDown className="w-5 h-5 text-slate-600 flex-shrink-0" /> : 
                          <ChevronRight className="w-5 h-5 text-slate-600 flex-shrink-0" />
                        }
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            value={currentTitle}
                            onChange={(e) => handleTitleChange(note.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Prevent toggling the note when editing title
                            className="font-medium text-slate-900 bg-transparent border-none outline-none w-full hover:bg-slate-100 px-2 py-1 rounded focus:bg-white focus:ring-2 focus:ring-indigo-500"
                          />
                          <p className="text-xs text-slate-500 px-2">
                            {new Date(note.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); openCalendarDialog(note); }}
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          Add to Calendar
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Note Content (Expanded) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-4 pt-0 border-t border-slate-200">
                            <Textarea
                              value={currentContent}
                              onChange={(e) => handleContentChange(note.id, e.target.value)}
                              placeholder="Start writing..."
                              rows={20} // Changed from 10 to 20 rows
                              className="border-slate-200 focus:border-indigo-500 text-base leading-relaxed resize-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Add to Calendar Dialog */}
      <Dialog open={showCalendarDialog} onOpenChange={setShowCalendarDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add to Content Calendar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="calendarDate">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(calendarPost.date, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={calendarPost.date}
                    onSelect={(date) => setCalendarPost({...calendarPost, date: date || new Date()})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label htmlFor="calendarTitle">Title (optional)</Label>
              <Input
                id="calendarTitle"
                value={calendarPost.title}
                onChange={(e) => setCalendarPost({...calendarPost, title: e.target.value})}
                placeholder="Post title..."
              />
            </div>
            
            <div>
              <Label htmlFor="contentType">Content Type</Label>
              <Select value={calendarPost.content_type} onValueChange={(v) => setCalendarPost({...calendarPost, content_type: v})}>
                <SelectTrigger id="contentType">
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social_media">Social Media Post</SelectItem>
                  <SelectItem value="youtube">YouTube Script</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="calendarContent">Content</Label>
              <Textarea
                id="calendarContent"
                value={calendarPost.content}
                onChange={(e) => setCalendarPost({...calendarPost, content: e.target.value})}
                placeholder="Paste your content here..."
                rows={8}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowCalendarDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddToCalendar} className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Add to Calendar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="text-sm text-slate-500 text-center">
        <p>Your notes are automatically saved as you type and synced to your profile.</p>
      </div>
    </div>
  );
}
