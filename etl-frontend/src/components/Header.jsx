import React from 'react';
import { 
  Layers, 
  Cpu, 
  Workflow, 
  BookOpen, 
  Activity, 
  History, 
  Database,
  Home
} from 'lucide-react';
import { ScrollProgressBar } from './animations/ScrollProgressBar';

export const Header = ({
  currentStep,
  setCurrentStep,
  canNavigateToStep2,
  canNavigateToStep3,
  onOpenArchitecture,
  onOpenCaseStudy,
  onOpenBenchmark,
  onOpenHistory,
  onGoHome,
  backendOnline,
}) => {
  const steps = [
    { number: 1, label: '1. Ingestion Setup', desc: 'REST Stream Config' },
    { number: 2, label: '2. Schema & Mapper', desc: 'Recursive DFS Types' },
    { number: 3, label: '3. Analytics Canvas', desc: 'Live BI & DataGrid' },
  ];

  return (
    <>
      <ScrollProgressBar />
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-xl border-b border-[#dae2fd] shadow-sm px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand & Project Info */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onGoHome}
              className="flex items-center gap-2.5 focus:outline-none cursor-pointer border-none bg-transparent"
              title="Return to FlowForge Landing Page"
            >
              <div className="w-8 h-8 rounded-lg bg-[#004ac6] flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-[#131b2e] font-sans">
                    FlowForge
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#82f5c1]/30 text-[#00714e] font-mono text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006c4a] animate-pulse" />
                    v2.4 Live
                  </span>
                </div>
                <div className="text-[11px] text-[#434655]">
                  Dynamic API-to-Visualizer ETL Pipeline
                </div>
              </div>
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="flex items-center gap-1.5 bg-[#f2f3ff] p-1 rounded-xl border border-[#dae2fd]">
            {steps.map((s, index) => {
              const isActive = currentStep === s.number;
              const isPassed = currentStep > s.number;
              const canClick = s.number === 1 || (s.number === 2 && canNavigateToStep2) || (s.number === 3 && canNavigateToStep3);

              return (
                <button
                  key={s.number}
                  disabled={!canClick}
                  onClick={() => setCurrentStep(s.number)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-white text-[#004ac6] shadow-sm border border-[#c3c6d7]' 
                      : isPassed
                      ? 'text-[#131b2e] hover:bg-white/60'
                      : 'text-[#737686] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-[#004ac6] text-white' : isPassed ? 'bg-[#006c4a] text-white' : 'bg-[#dae2fd] text-[#434655]'
                  }`}>
                    {isPassed ? '✓' : s.number}
                  </span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Modals & Telemetry */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenArchitecture}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#434655] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#dae2fd] bg-white transition-colors cursor-pointer"
            >
              <Workflow size={14} />
              <span className="hidden sm:inline">Architecture</span>
            </button>

            <button
              onClick={onOpenCaseStudy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#434655] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#dae2fd] bg-white transition-colors cursor-pointer"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Case Study</span>
            </button>

            <button
              onClick={onOpenBenchmark}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#434655] hover:bg-[#eaedff] hover:text-[#004ac6] border border-[#dae2fd] bg-white transition-colors cursor-pointer"
            >
              <Activity size={14} />
              <span className="hidden sm:inline">Benchmarks</span>
            </button>

            <button
              onClick={onOpenHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#004ac6] bg-[#dbe1ff]/60 hover:bg-[#dbe1ff] border border-[#b4c5ff] transition-colors cursor-pointer"
            >
              <History size={14} />
              <span>History</span>
            </button>

            {/* Home / Return button */}
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#434655] hover:bg-[#eaedff] border border-[#dae2fd] bg-white transition-colors cursor-pointer"
              title="Back to Landing Page"
            >
              <Home size={14} />
            </button>
          </div>
        </div>
      </header>
    </>
  );
};
