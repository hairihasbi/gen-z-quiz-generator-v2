import React, { useState, useEffect, useLayoutEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';

export interface Step {
  targetId: string;
  title: string;
  content: string;
}

interface TourGuideProps {
  steps: Step[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({ steps, isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [windowSize, setWindowSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  // Reset step when opening
  useEffect(() => {
    if (isOpen) setCurrentStep(0);
  }, [isOpen]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calculate position
  useLayoutEffect(() => {
    if (!isOpen) return;
    
    const updatePosition = () => {
      const step = steps[currentStep];
      const element = document.getElementById(step.targetId);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      }
    };

    // Initial delay for any layout shifts
    const timer = setTimeout(updatePosition, 100);
    return () => clearTimeout(timer);

  }, [isOpen, currentStep, steps, windowSize]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Calculate Tooltip Position (Simple auto-flip)
  let tooltipStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  
  if (targetRect) {
      const spaceBelow = window.innerHeight - targetRect.bottom;
      
      // Default: Bottom Left aligned
      let top = targetRect.bottom + 12;
      let left = targetRect.left;

      // If too close to bottom, go top
      if (spaceBelow < 250 && targetRect.top > 250) {
          top = targetRect.top - 220; 
      }

      // If too close to right, align right
      if (window.innerWidth - left < 320) {
          left = window.innerWidth - 340;
      }
      
      // Ensure positive coords
      if (left < 20) left = 20;

      tooltipStyle = { top, left, width: 320, position: 'absolute' };
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
      {/* Dark Overlay with "Hole" using box-shadow */}
      {targetRect && (
          <div 
            className="absolute transition-all duration-500 ease-in-out border-2 border-brand-500/50"
            style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                borderRadius: '12px',
                boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)'
            }}
          />
      )}
      
      {/* Tooltip Card */}
      <div 
        className="absolute bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl animate-fade-in-up transition-all duration-300 border border-slate-100 dark:border-slate-700"
        style={tooltipStyle}
      >
        <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs">
                    {currentStep + 1}
                </span>
                {step.title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
        </div>
        
        <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
            {step.content}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
            <div className="flex gap-1">
                {steps.map((_, idx) => (
                    <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-brand-500' : 'w-1.5 bg-slate-200 dark:bg-slate-700'}`} />
                ))}
            </div>
            <div className="flex gap-2">
                {currentStep > 0 && (
                    <button 
                        onClick={() => setCurrentStep(prev => prev - 1)} 
                        className="px-3 py-2 text-slate-500 font-bold text-xs hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                    >
                        Back
                    </button>
                )}
                <button 
                    onClick={() => {
                        if (isLast) onComplete();
                        else setCurrentStep(prev => prev + 1);
                    }}
                    className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/30 flex items-center gap-1.5 hover:bg-brand-700 transition-all"
                >
                    {isLast ? 'Selesai' : 'Lanjut'} <ChevronRight size={14}/>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuide;
