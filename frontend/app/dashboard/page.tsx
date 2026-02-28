'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Clock, Award, Target, ArrowRight } from 'lucide-react';

interface SessionRecord {
  id: number;
  date: string;
  score: number;
  posture: number;
  eye: number;
  pace: number;
  fillerWords: number;
}

const MOCK_SESSIONS: SessionRecord[] = [
  { id: 1, date: '26/02/2024', score: 87, posture: 90, eye: 85, pace: 86, fillerWords: 2 },
  { id: 2, date: '25/02/2024', score: 75, posture: 78, eye: 72, pace: 75, fillerWords: 5 },
  { id: 3, date: '24/02/2024', score: 67, posture: 65, eye: 68, pace: 68, fillerWords: 8 },
];

export default function DashboardPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('aceview_sessions') ?? '[]') as SessionRecord[];
      setSessions(stored.length > 0 ? stored : MOCK_SESSIONS);
    } catch {
      setSessions(MOCK_SESSIONS);
    }
    setLoaded(true);
  }, []);

  // Compute stats
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length)
    : 0;

  const firstScore = sessions[sessions.length - 1]?.score ?? 0;
  const latestScore = sessions[0]?.score ?? 0;
  const improvement = sessions.length > 1 ? latestScore - firstScore : 0;
  const totalMins = sessions.length * 5; // ~5 min per session

  // Aggregate strengths / improvements from all sessions
  const latestSession = sessions[0];
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (latestSession) {
    if (latestSession.posture >= 75) strengths.push(`Posture avg ${latestSession.posture}/100`);
    else improvements.push(`Improve posture (avg ${latestSession.posture}/100)`);

    if (latestSession.eye >= 75) strengths.push(`Eye contact avg ${latestSession.eye}/100`);
    else improvements.push(`Maintain eye contact (avg ${latestSession.eye}/100)`);

    if (latestSession.pace >= 75) strengths.push(`Good speech pace ${latestSession.pace}/100`);
    else improvements.push(`Work on speech pace (avg ${latestSession.pace}/100)`);

    if (latestSession.fillerWords <= 3) strengths.push('Minimal filler words used');
    else improvements.push(`Reduce filler words (used ${latestSession.fillerWords})`);
  }

  // Make sure we always show at least 3 items, pad with generic ones
  const GENERIC_STRENGTHS = ['Showed up and practised', 'Completed a full session', 'Engaged with AI coach'];
  const GENERIC_IMPROVEMENTS = ['Structure answers with STAR method', 'Add more specific examples', 'Pause before answering'];
  while (strengths.length < 3) strengths.push(GENERIC_STRENGTHS[strengths.length] ?? 'Keep practising consistently');
  while (improvements.length < 3) improvements.push(GENERIC_IMPROVEMENTS[improvements.length] ?? 'Review session recordings');

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <header className="sticky top-0 z-40 bg-[#e0e5ec]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="neu-sm r-neu flex items-center gap-2 p-3 text-[#636e72] hover:text-[#2d3436] transition-all">
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-medium">Back</span>
            </Link>
            <h1 className="text-2xl font-bold text-[#2d3436]">Dashboard</h1>
            <Link href="/interview" className="group neu r-neu flex items-center gap-2 px-6 py-3 text-[#00b894] font-bold transition-all">
              New Session <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={Award} label="Average Score" value={loaded ? String(avgScore) : '–'} suffix="/100" color="#00b894" />
          <StatCard icon={TrendingUp} label="Improvement" value={loaded ? (improvement >= 0 ? `+${improvement}` : String(improvement)) : '–'} suffix="pts" color="#0984e3" />
          <StatCard icon={Clock} label="Total Practice" value={loaded ? String(totalMins) : '–'} suffix="min" color="#6c5ce7" />
          <StatCard icon={Target} label="Sessions" value={loaded ? String(sessions.length) : '–'} suffix="" color="#fdcb6e" />
        </div>

        {/* Sessions */}
        <div className="neu r-neu-lg p-8 mb-10">
          <h2 className="text-xl font-bold text-[#2d3436] mb-6">Recent Sessions</h2>
          <div className="space-y-4">
            {sessions.map((s, idx) => {
              const prev = sessions[idx + 1];
              const delta = prev ? s.score - prev.score : null;
              return (
                <div key={s.id} className="neu-sm r-neu p-6 transition-all">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-6">
                      <div className="neu-inset rounded-full w-16 h-16 flex items-center justify-center">
                        <span className="text-2xl font-extrabold text-[#2d3436]">{s.score}</span>
                      </div>
                      <div>
                        <div className="text-[#2d3436] font-bold text-lg mb-1">Practice Session #{sessions.length - idx}</div>
                        <div className="text-sm text-[#636e72]">{s.date} • ~5 min</div>
                        <div className="text-xs text-[#b2bec3] mt-1">
                          Posture {s.posture} · Eye {s.eye} · Pace {s.pace} · Fillers {s.fillerWords}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {delta !== null && (
                        <span className={`font-bold text-lg ${delta >= 0 ? 'text-[#00b894]' : 'text-[#e17055]'}`}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </span>
                      )}
                      <Link
                        href="/interview"
                        className="neu-xs r-neu px-5 py-2.5 text-[#636e72] text-sm font-semibold transition-all"
                      >
                        Practice Again
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="neu r-neu-lg p-8">
            <h3 className="text-lg font-bold text-[#2d3436] mb-6">Top Strengths</h3>
            <ul className="space-y-4">
              {strengths.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-[#00b894] rounded-full flex-shrink-0" />
                  <span className="text-[#636e72] text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="neu r-neu-lg p-8">
            <h3 className="text-lg font-bold text-[#2d3436] mb-6">Areas to Improve</h3>
            <ul className="space-y-4">
              {improvements.slice(0, 3).map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 bg-[#fdcb6e] rounded-full flex-shrink-0" />
                  <span className="text-[#636e72] text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color }: {
  icon: any; label: string; value: string; suffix: string; color: string;
}) {
  return (
    <div className="neu r-neu p-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="neu-inset-sm rounded-xl p-3">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-[#2d3436] mb-1">
        {value}<span className="text-lg text-[#b2bec3] ml-1 font-medium">{suffix}</span>
      </div>
      <div className="text-sm text-[#636e72] font-semibold">{label}</div>
    </div>
  );
}
