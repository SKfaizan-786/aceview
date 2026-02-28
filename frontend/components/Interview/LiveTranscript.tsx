'use client';

import { useEffect, useRef } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import { MessageSquare } from 'lucide-react';

export default function LiveTranscript() {
  // Use selectors — only re-render when transcript or partialTranscript change,
  // not on every posture/eye-contact metrics tick.
  const transcript = useInterviewStore((s) => s.transcript);
  const partialTranscript = useInterviewStore((s) => s.partialTranscript);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [transcript, partialTranscript]);

  const highlightFillerWords = (text: string) => {
    const fillerWords = ['umm', 'hmm', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'right', 'so'];
    let result = text;
    fillerWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, `<span style="background:rgba(225,112,85,0.2);color:#e17055;padding:2px 6px;border-radius:8px;font-weight:600;">${word}</span>`);
    });
    return result;
  };

  return (
    <div className="neu r-neu-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4">
        <div className="neu-inset-sm rounded-xl p-2">
          <MessageSquare className="w-5 h-5 text-[#00b894]" />
        </div>
        <h3 className="font-bold text-[#2d3436] text-lg">Live Transcript</h3>
        <span className="ml-auto text-xs text-[#b2bec3] neu-inset-sm px-3 py-1 rounded-full font-medium">
          Filler words highlighted
        </span>
      </div>

      <div className="mx-6 h-px" style={{ background: 'linear-gradient(to right, transparent, #b8bec7, transparent)' }} />

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3 scroll-thin" style={{ scrollbarWidth: 'thin', scrollbarColor: '#b8bec7 transparent' }}>
        {transcript.length === 0 && !partialTranscript ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="neu-sm rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-[#b2bec3]" />
            </div>
            <p className="text-[#636e72] text-lg font-medium">Start speaking to see transcript...</p>
            <p className="text-[#b2bec3] text-sm mt-2">Filler words will be highlighted in real-time</p>
          </div>
        ) : (
          <>
            {transcript.map((line, index) => (
              <div key={index} className="neu-inset-sm r-neu p-4 text-[#2d3436] text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightFillerWords(line) }}
              />
            ))}
            {/* Live partial — greyed out "typing" preview */}
            {partialTranscript && (
              <div className="p-4 text-[#b2bec3] text-sm leading-relaxed italic border border-dashed border-[#b8bec7] rounded-2xl">
                {partialTranscript}
                <span className="inline-block w-1.5 h-3.5 bg-[#6c5ce7] ml-1 animate-pulse rounded-sm" />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
