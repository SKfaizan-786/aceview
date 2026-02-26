'use client';

import { useEffect } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import VideoPreview from '@/components/Interview/VideoPreview';
import LiveTranscript from '@/components/Interview/LiveTranscript';
import MetricsDisplay from '@/components/Interview/MetricsDisplay';
import AIPromptOverlay from '@/components/Interview/AIPromptOverlay';
import DevDebugPanel from '@/components/Interview/DevDebugPanel';
import { ArrowLeft, Play, Square } from 'lucide-react';
import Link from 'next/link';

export default function InterviewPage() {
  const { isSessionActive, startSession, endSession, updateMetrics } =
    useInterviewStore();

  useEffect(() => {
    if (isSessionActive) {
      const interval = setInterval(() => {
        updateMetrics({
          postureScore: Math.max(40, Math.min(100, 85 + Math.random() * 10 - 5)),
          eyeContactScore: Math.max(40, Math.min(100, 78 + Math.random() * 10 - 5)),
          speechPaceScore: Math.max(40, Math.min(100, 82 + Math.random() * 10 - 5)),
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isSessionActive, updateMetrics]);

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#e0e5ec]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="neu-sm r-neu flex items-center gap-2 p-3 text-[#636e72] hover:text-[#2d3436] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </Link>

            <h1 className="text-xl sm:text-2xl font-bold text-[#2d3436] text-center flex-1">
              Interview Practice
            </h1>

            <button
              onClick={isSessionActive ? endSession : startSession}
              className={`r-neu flex items-center justify-center gap-2 px-6 py-3 font-bold transition-all ${isSessionActive ? 'neu-pressed text-[#e17055]' : 'neu text-[#00b894]'
                }`}
            >
              {isSessionActive ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">End Session</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span className="hidden sm:inline">Start Session</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          <div className="space-y-6">
            <div className="w-full"><VideoPreview /></div>
            <div className="h-80"><LiveTranscript /></div>
          </div>
          <div className="lg:sticky lg:top-24 lg:self-start">
            <MetricsDisplay />
          </div>
        </div>

        {!isSessionActive && (
          <div className="mt-12 neu r-neu-lg p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold text-[#2d3436] mb-5">How to Use</h3>
            <ul className="space-y-4 text-[#636e72]">
              {[
                'Click "Start Session" to begin your practice interview',
                'The confidence ring around your video changes color based on performance',
                'Speak naturally and watch for filler words highlighted in the transcript',
                'AI nudges will appear with helpful suggestions to improve',
                'Use the Dev Debug panel (bottom-right) to trigger demo events',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 neu-xs rounded-full flex items-center justify-center text-xs font-bold text-[#6c5ce7]">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <AIPromptOverlay />
      <DevDebugPanel />
    </div>
  );
}
