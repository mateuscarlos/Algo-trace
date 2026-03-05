import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wand2, Loader2, Code2, Tag } from 'lucide-react';
import type { AlgoTrace } from '../types';
import { saveTrace, generateTraceFromCode } from '../lib/storage';
import { TracePlayer } from '../components/TracePlayer';
import './GeneratePage.css';

const LANGUAGES = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
];

const CATEGORY_SUGGESTIONS = [
    'Arrays e Hashing',
    'Two Pointers',
    'Sliding Window',
    'Stack',
    'Binary Search',
    'Linked List',
    'Trees',
    'Graphs',
    'Dynamic Programming',
    'Greedy',
    'Backtracking',
    'Sorting',
];

const EXAMPLE_CODE = `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        hashmap = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in hashmap:
                return [hashmap[complement], i]
            hashmap[num] = i
        return []`;

export function GeneratePage() {
    const navigate = useNavigate();
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('python');
    const [generatedTrace, setGeneratedTrace] = useState<AlgoTrace | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [customTitle, setCustomTitle] = useState('');
    const [category, setCategory] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleGenerate = async () => {
        setError('');
        setGeneratedTrace(null);
        setPreviewMode(false);
        setLoading(true);

        try {
            const trace = await generateTraceFromCode(code, language);
            setGeneratedTrace(trace);
            setCustomTitle(trace.title);
            setCategory('');
            setPreviewMode(true);
        } catch (e) {
            setError((e as Error).message || 'Erro ao gerar o trace. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!generatedTrace) return;
        try {
            const titleToSave = customTitle.trim() || generatedTrace.title;
            const saved = await saveTrace(titleToSave, generatedTrace, category.trim() || undefined);
            navigate(`/view/${saved.id}`);
        } catch {
            setError('Erro ao salvar o algoritmo. Tente novamente.');
        }
    };

    const loadExample = () => {
        setCode(EXAMPLE_CODE);
        setLanguage('python');
        setError('');
        setGeneratedTrace(null);
        setPreviewMode(false);
    };

    const filteredSuggestions = CATEGORY_SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(category.toLowerCase())
    );

    if (previewMode && generatedTrace) {
        return (
            <div className="generate-page generate-preview">
                <div className="preview-header">
                    <button className="btn btn-secondary" onClick={() => setPreviewMode(false)}>
                        ← Voltar ao Editor
                    </button>
                    <button className="btn btn-primary" onClick={handleSave}>
                        Salvar Algoritmo
                    </button>
                </div>

                <div className="save-fields">
                    <div className="save-field">
                        <label htmlFor="trace-title">Nome do Algoritmo</label>
                        <input
                            id="trace-title"
                            type="text"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            placeholder="Ex: Two Sum"
                            className="save-input"
                        />
                    </div>
                    <div className="save-field category-field">
                        <label htmlFor="trace-category">
                            <Tag size={14} /> Categoria
                        </label>
                        <input
                            id="trace-category"
                            type="text"
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setShowSuggestions(true); }}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            placeholder="Ex: Arrays e Hashing"
                            className="save-input"
                        />
                        {showSuggestions && filteredSuggestions.length > 0 && (
                            <ul className="category-suggestions">
                                {filteredSuggestions.map(s => (
                                    <li key={s} onMouseDown={() => { setCategory(s); setShowSuggestions(false); }}>{s}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <TracePlayer trace={generatedTrace} />
            </div>
        );
    }

    return (
        <div className="generate-page">
            <div className="generate-hero">
                <div className="hero-icon-wrapper">
                    <Wand2 size={48} className="hero-icon hero-icon-wand" />
                </div>
                <h1>Gerar Passo a Passo</h1>
                <p>Cole seu código-fonte e deixe a IA gerar automaticamente a visualização passo a passo do algoritmo.</p>
            </div>

            <div className="generate-toolbar">
                <div className="language-select-wrapper">
                    <Code2 size={16} className="select-icon" />
                    <select
                        className="language-select"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                </div>
                <button className="btn btn-accent" onClick={loadExample}>
                    <Wand2 size={16} />
                    Carregar Exemplo
                </button>
            </div>

            <div className="code-editor-wrapper">
                <div className="code-editor-header">
                    <span className="editor-language-badge">{LANGUAGES.find(l => l.value === language)?.label}</span>
                    <span className="editor-hint">Cole seu código aqui</span>
                </div>
                <textarea
                    className="code-editor"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder={`# Cole seu código ${LANGUAGES.find(l => l.value === language)?.label} aqui...\n# Exemplo: algoritmo de ordenação, busca, etc.`}
                    spellCheck={false}
                />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="generate-footer">
                {loading ? (
                    <div className="loading-state">
                        <div className="loading-spinner">
                            <Loader2 size={24} className="spinner" />
                        </div>
                        <div className="loading-text">
                            <span className="loading-title">Gerando visualização...</span>
                            <span className="loading-subtitle">A IA está analisando seu código e criando o passo a passo</span>
                        </div>
                    </div>
                ) : (
                    <button
                        className="btn btn-primary btn-lg btn-generate"
                        onClick={handleGenerate}
                        disabled={!code.trim()}
                    >
                        <Wand2 size={20} />
                        Gerar Passo a Passo
                    </button>
                )}
            </div>
        </div>
    );
}

