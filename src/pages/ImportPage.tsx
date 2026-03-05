import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileJson, Sparkles } from 'lucide-react';
import type { AlgoTrace } from '../types';
import { saveTrace } from '../lib/storage';
import { TracePlayer } from '../components/TracePlayer';
import './ImportPage.css';

const EXAMPLE_JSON: AlgoTrace = {
  title: "Contains Duplicate - Hash Set",
  steps: [
    {
      description: "Initialize an empty hash set 'seen' to store unique numbers encountered so far.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [], pointers: {} },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: {} }
      ],
      codeLineHighlight: 6
    },
    {
      description: "Iterate through the array. First element is n = 1.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [0], pointers: { n: 0 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: {} }
      ],
      codeLineHighlight: 7
    },
    {
      description: "Check if n = 1 is already in the 'seen' set. It is not.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [0], pointers: { n: 0 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: {} }
      ],
      codeLineHighlight: 9
    },
    {
      description: "Add 1 to the 'seen' set.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [0], pointers: { n: 0 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "" } }
      ],
      codeLineHighlight: 11
    },
    {
      description: "Move to the next element, n = 2.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [1], pointers: { n: 1 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "" } }
      ],
      codeLineHighlight: 7
    },
    {
      description: "Check if n = 2 is in 'seen'. It is not.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [1], pointers: { n: 1 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "" } }
      ],
      codeLineHighlight: 9
    },
    {
      description: "Add 2 to the 'seen' set.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [1], pointers: { n: 1 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "" } }
      ],
      codeLineHighlight: 11
    },
    {
      description: "Move to the next element, n = 3.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [2], pointers: { n: 2 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "" } }
      ],
      codeLineHighlight: 7
    },
    {
      description: "Check if n = 3 is in 'seen'. It is not.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [2], pointers: { n: 2 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "" } }
      ],
      codeLineHighlight: 9
    },
    {
      description: "Add 3 to the 'seen' set.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [2], pointers: { n: 2 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "", "3": "" } }
      ],
      codeLineHighlight: 11
    },
    {
      description: "Move to the last element, n = 3.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [3], pointers: { n: 3 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "", "3": "" } }
      ],
      codeLineHighlight: 7
    },
    {
      description: "Check if n = 3 is in 'seen'. It IS already present!",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [3], pointers: { n: 3 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "", "3": "" } }
      ],
      codeLineHighlight: 9
    },
    {
      description: "Since n = 3 was found in the set, a duplicate exists. Return True.",
      structures: [
        { id: "nums", type: "array", label: "nums", data: [1, 2, 3, 3], highlights: [3], pointers: { n: 3 } },
        { id: "seen", type: "hash-map", label: "seen (Set)", data: { "1": "", "2": "", "3": "" } },
        { id: "result", type: "variable", label: "Return Value", data: true }
      ],
      codeLineHighlight: 10
    }
  ],
  code: "from typing import List\n\nclass Solution:\n    def hasDuplicate(self, nums: List[int]) -> bool:\n        #hash set vazio\n        seen = set()\n        for n in nums:\n            if n in nums:\n                if n in seen:\n                    return True\n                seen.add(n)\n        return False",
  language: "python"
};

export function ImportPage() {
  const navigate = useNavigate();
  const [jsonText, setJsonText] = useState('');
  const [parsedTrace, setParsedTrace] = useState<AlgoTrace | null>(null);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const handleParse = () => {
    setError('');
    setParsedTrace(null);
    setPreviewMode(false);

    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.title || !parsed.steps || !parsed.code) {
        setError('JSON inválido: campos obrigatórios "title", "steps" e "code" são necessários.');
        return;
      }
      setParsedTrace(parsed as AlgoTrace);
      setPreviewMode(true);
    } catch (e) {
      setError('JSON inválido: ' + (e as Error).message);
    }
  };

  const handleSave = async () => {
    if (!parsedTrace) return;
    try {
      const saved = await saveTrace(parsedTrace.title, parsedTrace);
      navigate(`/view/${saved.id}`);
    } catch {
      setError('Erro ao salvar o algoritmo. Tente novamente.');
    }
  };

  const loadExample = () => {
    setJsonText(JSON.stringify(EXAMPLE_JSON, null, 2));
    setError('');
    setParsedTrace(null);
    setPreviewMode(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setJsonText(text);
      setError('');
      setParsedTrace(null);
      setPreviewMode(false);
    };
    reader.readAsText(file);
  };

  if (previewMode && parsedTrace) {
    return (
      <div className="import-page">
        <div className="preview-header">
          <button className="btn btn-secondary" onClick={() => setPreviewMode(false)}>
            ← Voltar ao Editor
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar Algoritmo
          </button>
        </div>
        <TracePlayer trace={parsedTrace} />
      </div>
    );
  }

  return (
    <div className="import-page">
      <div className="import-hero">
        <FileJson size={48} className="hero-icon" />
        <h1>Importar Algo-Trace</h1>
        <p>Cole um JSON no formato algo-trace ou carregue um arquivo para visualizar e salvar o passo a passo do algoritmo.</p>
      </div>

      <div className="import-actions">
        <label className="btn btn-secondary upload-btn">
          <Upload size={16} />
          Carregar Arquivo
          <input type="file" accept=".json" onChange={handleFileUpload} hidden />
        </label>
        <button className="btn btn-accent" onClick={loadExample}>
          <Sparkles size={16} />
          Carregar Exemplo
        </button>
      </div>

      <div className="json-editor-wrapper">
        <textarea
          className="json-editor"
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='Cole seu JSON algo-trace aqui...'
          spellCheck={false}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="import-footer">
        <button className="btn btn-primary btn-lg" onClick={handleParse} disabled={!jsonText.trim()}>
          Visualizar Passo a Passo
        </button>
      </div>
    </div>
  );
}
