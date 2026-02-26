'use client';

import { useEffect } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import { Sparkles, X } from 'lucide-react';

export default function AIPromptOverlay() {
  const { aiNudges, clearAiNudges } = useInterviewStore();

  useEffect(() => {
    if (aiNudges.length > 0) {
      const timer = setTimeout(() => clearAiNudges(), 5000);
      return () => clearTimeout(timer);
    }
  }, [aiNudges, clearAiNudges]);

  if (aiNudges.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {aiNudges.map((nudge, index) => (
        <div key={index} className="neu-sm r-neu p-5 anim-slide-right">
          <div className="flex items-start gap-3">
            <div className="neu-inset-sm rounded-lg p-1.5 flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#6c5ce7]" />
            </div>
            <p className="text-sm text-[#2d3436] flex-1 font-medium">{nudge}</p>
            <button onClick={clearAiNudges} className="text-[#b2bec3] hover:text-[#636e72] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
