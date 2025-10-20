
import React, { useState, useEffect } from 'react';
import { AppKnowledge } from '@/api/entities';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import KnowledgeForm from '../components/knowledge/KnowledgeForm';

export default function KnowledgeManager() {
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const user = await User.me();
        if (user.role === 'admin') {
          setIsAdmin(true);
          loadKnowledge();
        } else {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        navigate(createPageUrl("Dashboard"));
      }
      setIsLoading(false);
    };
    checkAdmin();
  }, [navigate]);

  const loadKnowledge = async () => {
    const items = await AppKnowledge.list('-created_date');
    setKnowledgeItems(items);
  };

  const handleSave = async (data) => {
    if (selectedItem) {
      await AppKnowledge.update(selectedItem.id, data);
    } else {
      await AppKnowledge.create(data);
    }
    setIsFormOpen(false);
    setSelectedItem(null);
    loadKnowledge();
  };
  
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this knowledge item?")) {
      await AppKnowledge.delete(id);
      loadKnowledge();
    }
  };

  const openFormForNew = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };
  
  const openFormForEdit = (item) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }

  if (!isAdmin) {
    return <div className="p-8 text-center text-slate-500">Access Denied. Redirecting...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Creator Knowledge Base</h1>
        <Button onClick={openFormForNew}><Plus className="w-4 h-4 mr-2" /> Add Knowledge</Button>
      </div>

      {isFormOpen ? (
        <KnowledgeForm
          item={selectedItem}
          onSave={handleSave}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedItem(null);
          }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {knowledgeItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No knowledge items yet. Click "Add Knowledge" to get started.
                </div>
              ) : (
                knowledgeItems.map(item => (
                  <div key={item.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.knowledge_name}</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Type: <span className="font-medium">{item.knowledge_type.replace('_', ' ')}</span> | 
                        Target: <span className="font-medium">{item.target_generator.replace('_', ' ')}</span>
                      </p>
                      {item.niche_tags && item.niche_tags.length > 0 && (
                        <p className="text-xs text-indigo-600 mt-1 font-medium">Niches: {item.niche_tags.join(', ')}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openFormForEdit(item)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
