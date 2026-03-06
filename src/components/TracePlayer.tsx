import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Play, Pause } from 'lucide-react';
import type { AlgoTrace } from '../types';
import { CodeViewer } from './CodeViewer';
import { StructureRenderer } from './structures';
import { translateDescription } from '../lib/translate';
import './TracePlayer.css';

interface Props {
  trace: AlgoTrace;
}

export function TracePlayer({ trace }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const step = trace.steps[currentStep];
  const totalSteps = trace.steps.length;

  const goNext = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goPrev = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goFirst = () => setCurrentStep(0);
  const goLast = () => setCurrentStep(totalSteps - 1);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStep >= totalSteps - 1) {
      const id = requestAnimationFrame(() => setIsPlaying(false));
      return () => cancelAnimationFrame(id);
    }
    const timer = setTimeout(goNext, 1500);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps, goNext]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea, or select
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev]);

  return (
    <div className="trace-player">
      <div className="trace-header">
        <h1 className="trace-title">{trace.title}</h1>
        <span className="trace-step-counter">
          Passo {currentStep + 1} de {totalSteps}
        </span>
      </div>

      {/* Description */}
      <div className="step-description" key={currentStep}>
        <p>{translateDescription(step.description)}</p>
      </div>

      {/* Main content: structures + code */}
      <div className="trace-content">
        <div className="structures-panel">
          <div className="structures-grid">
            {step.structures.map((s) => (
              <StructureRenderer key={s.id} structure={s} />
            ))}
          </div>
        </div>
        <div className="code-panel">
          <CodeViewer
            code={trace.code}
            language={trace.language}
            highlightLine={step.codeLineHighlight}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
        <div className="progress-steps">
          {trace.steps.map((_, idx) => (
            <button
              key={idx}
              className={`progress-dot ${idx === currentStep ? 'active' : ''} ${idx < currentStep ? 'passed' : ''}`}
              onClick={() => setCurrentStep(idx)}
              title={`Passo ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <button className="ctrl-btn" onClick={goFirst} disabled={currentStep === 0} title="Primeiro passo">
          <SkipBack size={18} />
        </button>
        <button className="ctrl-btn" onClick={goPrev} disabled={currentStep === 0} title="Passo anterior">
          <ChevronLeft size={20} />
        </button>
        <button
          className="ctrl-btn ctrl-play"
          onClick={() => setIsPlaying((p) => !p)}
          title={isPlaying ? 'Pausar' : 'Reproduzir automaticamente'}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <button className="ctrl-btn" onClick={goNext} disabled={currentStep === totalSteps - 1} title="Próximo passo">
          <ChevronRight size={20} />
        </button>
        <button className="ctrl-btn" onClick={goLast} disabled={currentStep === totalSteps - 1} title="Último passo">
          <SkipForward size={18} />
        </button>
      </div>

      <p className="controls-hint">
        Use as setas do teclado ← → ou barra de espaço para navegar
      </p>
    </div>
  );
}
