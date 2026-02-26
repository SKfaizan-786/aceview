'use client';

import { useInterviewStore } from '@/store/interviewStore';
import { Activity, Eye, MessageCircle, Zap } from 'lucide-react';

export default function MetricsDisplay() {
  const { metrics } = useInterviewStore();

  const MetricCard = ({ icon: Icon, label, value, max = 100, color }: {
    icon: any; label: string; value: number; max?: number; color: string;
  }) => {
    const pct = (value / max) * 100;
    return (
      <div className="neu-sm r-neu p-5 transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="neu-inset-sm rounded-xl p-2">
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <span className="text-sm font-semibold text-[#636e72]">{label}</span>
          </div>
          <span className="text-2xl font-bold text-[#2d3436]">
            {value}{max === 100 && <span className="text-sm text-[#b2bec3] ml-1 font-medium">/100</span>}
          </span>
        </div>
        <div className="neu-inset-sm rounded-full h-3 p-0.5">
          <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    );
  };

  const stateColor = metrics.confidenceState === 'high' ? '#00b894'
    : metrics.confidenceState === 'medium' ? '#fdcb6e' : '#e17055';

  return (
    <div className="space-y-5">
      {/* Confidence */}
      <div className="neu r-neu-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#2d3436]">Confidence</h3>
          <div className="neu-inset-sm rounded-xl p-3">
            <Zap className="w-6 h-6 text-[#fdcb6e]" />
          </div>
        </div>
        <div className="flex items-end gap-2 mb-4">
          <span className="text-6xl font-extrabold text-[#2d3436] leading-none">{metrics.confidenceScore}</span>
          <span className="text-xl text-[#b2bec3] font-medium mb-1">/100</span>
        </div>
        <div className="neu-inset-sm rounded-full px-4 py-2 inline-flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: stateColor }} />
          <span className="text-sm font-semibold text-[#636e72] capitalize">{metrics.confidenceState} Confidence</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-4">
        <MetricCard icon={Activity} label="Posture" value={metrics.postureScore} color="#00b894" />
        <MetricCard icon={Eye} label="Eye Contact" value={metrics.eyeContactScore} color="#0984e3" />
        <MetricCard icon={MessageCircle} label="Speech Pace" value={metrics.speechPaceScore} color="#6c5ce7" />
      </div>

      {/* Filler Words */}
      <div className="neu-sm r-neu p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#636e72]">Filler Words</span>
          <span className="text-3xl font-bold" style={{ color: metrics.fillerWordCount > 5 ? '#e17055' : metrics.fillerWordCount > 2 ? '#fdcb6e' : '#00b894' }}>
            {metrics.fillerWordCount}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#b2bec3]">Target: &lt;5</span>
          <span className="font-semibold" style={{ color: metrics.fillerWordCount <= 5 ? '#00b894' : '#e17055' }}>
            {metrics.fillerWordCount <= 5 ? 'Good!' : 'Needs work'}
          </span>
        </div>
      </div>
    </div>
  );
}
