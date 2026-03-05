import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Eye, Plus, BookOpen, Loader2, Tag, Filter } from 'lucide-react';
import type { SavedTrace } from '../types';
import { getSavedTraces, deleteTrace } from '../lib/storage';
import './LibraryPage.css';

export function LibraryPage() {
  const [traces, setTraces] = useState<SavedTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');

  const loadTraces = useCallback(async () => {
    setLoading(true);
    const data = await getSavedTraces();
    setTraces(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getSavedTraces().then((data) => {
      if (!cancelled) {
        setTraces(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este algoritmo?')) return;
    await deleteTrace(id);
    await loadTraces();
  };

  const categories = useMemo(() => {
    const cats = new Set<string>();
    traces.forEach(t => cats.add(t.category || 'Sem categoria'));
    return Array.from(cats).sort((a, b) => {
      if (a === 'Sem categoria') return 1;
      if (b === 'Sem categoria') return -1;
      return a.localeCompare(b);
    });
  }, [traces]);

  const filteredTraces = useMemo(() => {
    if (!filterCategory) return traces;
    return traces.filter(t => (t.category || 'Sem categoria') === filterCategory);
  }, [traces, filterCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, SavedTrace[]>();
    filteredTraces.forEach(t => {
      const cat = t.category || 'Sem categoria';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    });
    return map;
  }, [filteredTraces]);

  return (
    <div className="library-page">
      <div className="library-header">
        <div>
          <h1><BookOpen size={28} /> Biblioteca</h1>
          <p>Seus algoritmos salvos para consulta e revisão.</p>
        </div>
        <Link to="/" className="btn btn-primary">
          <Plus size={16} /> Novo Algoritmo
        </Link>
      </div>

      {loading ? (
        <div className="empty-state">
          <Loader2 size={48} className="spinner" />
          <p>Carregando algoritmos...</p>
        </div>
      ) : traces.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} strokeWidth={1} />
          <h2>Nenhum algoritmo salvo</h2>
          <p>Comece gerando a partir de código ou importando um JSON para visualizar algoritmos passo a passo.</p>
          <Link to="/" className="btn btn-primary btn-lg">
            <Plus size={16} /> Novo Algoritmo
          </Link>
        </div>
      ) : (
        <>
          {categories.length > 1 && (
            <div className="category-filter">
              <Filter size={14} />
              <button
                className={`filter-chip ${!filterCategory ? 'active' : ''}`}
                onClick={() => setFilterCategory('')}
              >
                Todos ({traces.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
                  onClick={() => setFilterCategory(filterCategory === cat ? '' : cat)}
                >
                  {cat} ({traces.filter(t => (t.category || 'Sem categoria') === cat).length})
                </button>
              ))}
            </div>
          )}

          {Array.from(grouped.entries()).map(([cat, items]) => (
            <div key={cat} className="category-group">
              <h2 className="category-group-title">
                <Tag size={16} />
                {cat}
                <span className="category-count">{items.length}</span>
              </h2>
              <div className="library-grid">
                {items.map((t) => (
                  <div key={t.id} className="trace-card">
                    <div className="card-body">
                      <h3 className="card-title">{t.title}</h3>
                      <div className="card-meta">
                        <span className="card-steps">{t.trace.steps.length} passos</span>
                        <span className="card-lang">{t.trace.language}</span>
                        {t.category && <span className="card-category"><Tag size={10} /> {t.category}</span>}
                      </div>
                      <p className="card-date">
                        Salvo em {new Date(t.savedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="card-actions">
                      <Link to={`/view/${t.id}`} className="btn btn-primary btn-sm">
                        <Eye size={14} /> Visualizar
                      </Link>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

