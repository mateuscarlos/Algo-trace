import { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, SkipBack, SkipForward, Play, Pause, Zap, Activity, Cpu, Volume2, VolumeX } from 'lucide-react';
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
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Handle audio playback when step changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Stop current audio
    audioRef.current.pause();
    audioRef.current.currentTime = 0;

    if (!isMuted && step.audioUrl) {
      audioRef.current.src = step.audioUrl;
      audioRef.current.play().catch((err) => {
        // Autoplay policy might block it until user interaction
        console.warn("Audio autoplay blocked or failed:", err);
      });
    }
  }, [currentStep, step.audioUrl, isMuted]);

  // Handle mute toggle
  const toggleMute = () => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (newMuted && audioRef.current) {
        audioRef.current.pause();
      } else if (!newMuted && audioRef.current && step.audioUrl) {
        audioRef.current.play().catch(console.warn);
      }
      return newMuted;
    });
  };

  return (
    <div className="trace-player">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => {
         // Se estivermos em autoplay e o áudio terminar, e quisermos sicronizar, poderíamos avançar aqui.
         // Mas como o autoplay usa timer (1500ms), deixamos independente por enquanto.
      }} />

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
        
        {/* Toggle Vol */}
        <div className="volume-control-wrapper">
           <button 
             className={`ctrl-btn volume-btn ${isMuted ? 'muted' : ''}`} 
             onClick={toggleMute} 
             title={isMuted ? 'Ativar Narração' : 'Desativar Narração'}
           >
             {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
           </button>
        </div>
      </div>

      <p className="controls-hint">
        Use as setas do teclado ← → ou barra de espaço para navegar
      </p>

      {/* Analysis Section */}
      {(trace.complexity || trace.tradeoffs) && (
        <div className="trace-analysis-section">
          <div className="analysis-header">
            <Zap size={18} className="analysis-icon" />
            <h2>Análise do Algoritmo</h2>
          </div>
          
          <div className="analysis-grid">
            {trace.complexity && (
               <div className="analysis-card complexity-card">
                 <div className="card-header">
                   <Activity size={16} />
                   <h3>Complexidade (Big O)</h3>
                 </div>
                 <div className="complexity-badges">
                   <span className="badge badge-time" title="Complexidade de Tempo">
                     ⏳ O({trace.complexity.time.replace(/^O\((.*)\)$/, '$1')})
                   </span>
                   <span className="badge badge-space" title="Complexidade de Espaço">
                     💾 O({trace.complexity.space.replace(/^O\((.*)\)$/, '$1')})
                   </span>
                 </div>
                 <p className="analysis-details">{trace.complexity.details}</p>
               </div>
            )}

            {trace.tradeoffs && (
               <div className="analysis-card tradeoffs-card">
                 <div className="card-header">
                   <Cpu size={16} />
                   <h3>Tradeoffs & Alternativas</h3>
                 </div>
                 <p className="analysis-details">{trace.tradeoffs}</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
