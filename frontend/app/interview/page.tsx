'use client';

import { useInterviewStore } from '@/store/interviewStore';
import VideoPreview from '@/components/Interview/VideoPreview';
import LiveTranscript from '@/components/Interview/LiveTranscript';
import MetricsDisplay from '@/components/Interview/MetricsDisplay';
import AIPromptOverlay from '@/components/Interview/AIPromptOverlay';
import DevDebugPanel from '@/components/Interview/DevDebugPanel';
import StreamProvider from '@/components/StreamProvider';
import { ArrowLeft, Play, Square, Award, TrendingUp, Lightbulb } from 'lucide-react';
import Link from 'next/link';

export default function InterviewPage() {
  // Use individual selectors so the page only re-renders when these specific
  // values change — NOT on every posture/eye-contact metrics tick.
  const isSessionActive = useInterviewStore((s) => s.isSessionActive);
  const sessionSummary = useInterviewStore((s) => s.sessionSummary);
  const isFetchingSummary = useInterviewStore((s) => s.isFetchingSummary);
  const startSession = useInterviewStore((s) => s.startSession);
  const endSession = useInterviewStore((s) => s.endSession);

  return (
    <StreamProvider>
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

          {/* Post-session summary */}
          {!isSessionActive && isFetchingSummary && (
            <div className="mt-12 neu r-neu-lg p-8 max-w-3xl mx-auto text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6c5ce7] mx-auto mb-4" />
              <p className="text-[#636e72] font-medium">Generating your personalised report card…</p>
            </div>
          )}

          {!isSessionActive && !isFetchingSummary && sessionSummary && (
            <div className="mt-12 max-w-3xl mx-auto space-y-6">
              {/* Score banner */}
              <div className="neu r-neu-lg p-8 text-center">
                <div className="neu-inset rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <span className="text-4xl font-extrabold text-[#2d3436]">{sessionSummary.overall_score}</span>
                </div>
                <p className="text-2xl font-bold text-[#2d3436] mb-1">Grade: {sessionSummary.grade}</p>
                <p className="text-[#636e72]">{sessionSummary.summary}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="neu r-neu-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-[#00b894]" />
                    <h3 className="font-bold text-[#2d3436]">Strengths</h3>
                  </div>
                  <ul className="space-y-3">
                    {sessionSummary.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#636e72]">
                        <span className="text-[#00b894] font-bold mt-0.5">✓</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="neu r-neu-lg p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[#fdcb6e]" />
                    <h3 className="font-bold text-[#2d3436]">Areas to Improve</h3>
                  </div>
                  <ul className="space-y-3">
                    {sessionSummary.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#636e72]">
                        <span className="text-[#fdcb6e] font-bold mt-0.5">→</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tip */}
              <div className="neu r-neu-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-5 h-5 text-[#6c5ce7]" />
                  <h3 className="font-bold text-[#2d3436]">Tip of the Day</h3>
                </div>
                <p className="text-sm text-[#636e72]">{sessionSummary.tip_of_the_day}</p>
              </div>

              <button
                onClick={startSession}
                className="w-full neu r-neu py-4 font-bold text-[#00b894] text-lg transition-all"
              >
                Practice Again
              </button>
            </div>
          )}

          {/* How to use — only when no summary yet */}
          {!isSessionActive && !isFetchingSummary && !sessionSummary && (
            <div className="mt-12 neu r-neu-lg p-8 max-w-3xl mx-auto">
              <h3 className="text-xl font-bold text-[#2d3436] mb-5">How to Use</h3>
              <ul className="space-y-4 text-[#636e72]">
                {[
                  'Click "Start Session" to begin your practice interview',
                  'The AI Coach will join the call and start asking interview questions',
                  'Speak naturally — the AI listens, responds, and gives real-time coaching',
                  'Watch posture and eye-contact metrics update live on the right',
                  'End the session to receive your personalised AI report card',
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
    </StreamProvider>
  );
}

