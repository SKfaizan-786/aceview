'use client';

import { useState } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';

export default function DevDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { triggerSlouch, triggerFillerWord, triggerNudge } = useInterviewStore();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="neu-sm r-neu flex items-center gap-2 px-4 py-2.5 text-[#636e72] transition-all"
      >
        <Bug className="w-4 h-4" />
        <span className="text-sm font-semibold">Dev Debug</span>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-3 w-64 neu r-neu-lg p-5 anim-slide-up">
          <h3 className="text-sm font-bold text-[#2d3436] mb-4">Mock Triggers</h3>
          <div className="space-y-3">
            <button onClick={triggerSlouch} className="w-full neu-xs r-neu px-4 py-2.5 text-[#e17055] text-sm font-semibold transition-all">
              Trigger Slouch
            </button>
            <button onClick={triggerFillerWord} className="w-full neu-xs r-neu px-4 py-2.5 text-[#fdcb6e] text-sm font-semibold transition-all">
              Trigger Filler Word
            </button>
            <button onClick={triggerNudge} className="w-full neu-xs r-neu px-4 py-2.5 text-[#00b894] text-sm font-semibold transition-all">
              Trigger AI Nudge
            </button>
          </div>
          <p className="text-xs text-[#b2bec3] mt-4 font-medium">Use these to demo features</p>
        </div>
      )}
    </div>
  );
}
