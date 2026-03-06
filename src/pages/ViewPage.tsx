import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Pencil, Check, X, Tag, Plus } from 'lucide-react';
import type { SavedTrace } from '../types';
import { getTraceById, updateTrace } from '../lib/storage';
import { TracePlayer } from '../components/TracePlayer';
import './ViewPage.css';

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const [saved, setSaved] = useState<SavedTrace | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState(false);
  const [editCategory, setEditCategory] = useState('');
  const [editingTags, setEditingTags] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getTraceById(id).then((data) => {
      setSaved(data);
      setLoading(false);
    });
  }, [id]);

  const handleSaveTitle = async () => {
    if (!saved || !editTitle.trim()) return;
    try {
      const updated = await updateTrace(saved.id, { title: editTitle.trim() });
      setSaved(updated);
      setEditingTitle(false);
    } catch { /* silently fail */ }
  };

  const handleSaveCategory = async () => {
    if (!saved) return;
    try {
      const updated = await updateTrace(saved.id, { category: editCategory.trim() || undefined });
      setSaved(updated);
      setEditingCategory(false);
    } catch { /* silently fail */ }
  };

  const handleAddTag = async () => {
    if (!saved || !newTag.trim()) {
      setEditingTags(false);
      return;
    }
    const currentTags = saved.tags || [];
    const tagToAdd = newTag.trim();
    if (currentTags.includes(tagToAdd)) {
      setNewTag('');
      setEditingTags(false);
      return;
    }
    
    try {
      const updatedTags = [...currentTags, tagToAdd];
      const updated = await updateTrace(saved.id, { tags: updatedTags });
      setSaved(updated);
      setNewTag('');
      setEditingTags(false);
    } catch { /* silently fail */ }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!saved) return;
    const currentTags = saved.tags || [];
    const updatedTags = currentTags.filter(t => t !== tagToRemove);
    try {
      const updated = await updateTrace(saved.id, { tags: updatedTags });
      setSaved(updated);
    } catch { /* silently fail */ }
  };

  if (loading) {
    return (
      <div className="view-page">
        <div className="not-found">
          <Loader2 size={48} className="spinner" />
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!saved) {
    return (
      <div className="view-page">
        <div className="not-found">
          <h2>Algoritmo não encontrado</h2>
          <p>O algoritmo solicitado não existe ou foi removido.</p>
          <Link to="/library" className="btn btn-primary">Voltar à Biblioteca</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="view-page">
      <div className="view-nav">
        <Link to="/library" className="btn btn-secondary">
          <ArrowLeft size={16} /> Biblioteca
        </Link>
        <div className="view-meta">
          {editingTitle ? (
            <div className="edit-inline">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-input"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              />
              <button className="edit-btn save" onClick={handleSaveTitle} title="Salvar"><Check size={14} /></button>
              <button className="edit-btn cancel" onClick={() => setEditingTitle(false)} title="Cancelar"><X size={14} /></button>
            </div>
          ) : (
            <div className="view-title-row">
              <h2 className="view-title">{saved.title}</h2>
              <button
                className="edit-btn"
                onClick={() => { setEditTitle(saved.title); setEditingTitle(true); }}
                title="Editar nome"
              >
                <Pencil size={14} />
              </button>
            </div>
          )}

          {editingCategory ? (
            <div className="edit-inline edit-category-inline">
              <input
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="edit-input edit-input-sm"
                placeholder="Categoria"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              />
              <button className="edit-btn save" onClick={handleSaveCategory} title="Salvar"><Check size={14} /></button>
              <button className="edit-btn cancel" onClick={() => setEditingCategory(false)} title="Cancelar"><X size={14} /></button>
            </div>
          ) : (
            <button
              className="category-badge-btn"
              onClick={() => { setEditCategory(saved.category || ''); setEditingCategory(true); }}
              title="Editar categoria"
            >
              <Tag size={12} />
              {saved.category || 'Sem categoria'}
              <Pencil size={10} className="badge-edit-icon" />
            </button>
          )}

          <div className="tags-list">
            {(saved.tags || []).map(tag => (
              <span key={tag} className="tag-badge">
                {tag}
                <button
                  className="tag-remove-btn"
                  onClick={() => handleRemoveTag(tag)}
                  title="Remover tag"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            
            {editingTags ? (
              <div className="edit-inline edit-tag-inline">
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="edit-input edit-input-xs"
                  placeholder="Nova tag"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') { setNewTag(''); setEditingTags(false); }
                  }}
                  onBlur={() => {
                    if (!newTag.trim()) setEditingTags(false);
                  }}
                />
                <button className="edit-btn save" onClick={handleAddTag} title="Adicionar"><Check size={12} /></button>
              </div>
            ) : (
              <button
                className="add-tag-btn"
                onClick={() => setEditingTags(true)}
                title="Adicionar tag"
              >
                <Plus size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
      <TracePlayer trace={saved.trace} />
    </div>
  );
}

