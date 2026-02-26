import Link from 'next/link';
import { ArrowLeft, TrendingUp, Clock, Award, Target, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const sessions = [
    { id: 1, date: '2024-02-26', duration: '15 min', score: 87, improvement: '+12' },
    { id: 2, date: '2024-02-25', duration: '12 min', score: 75, improvement: '+8' },
    { id: 3, date: '2024-02-24', duration: '18 min', score: 67, improvement: '-' },
  ];

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
          <StatCard icon={Award} label="Average Score" value="76" suffix="/100" color="#00b894" />
          <StatCard icon={TrendingUp} label="Improvement" value="+20" suffix="pts" color="#0984e3" />
          <StatCard icon={Clock} label="Total Practice" value="45" suffix="min" color="#6c5ce7" />
          <StatCard icon={Target} label="Sessions" value="3" suffix="" color="#fdcb6e" />
        </div>

        {/* Sessions */}
        <div className="neu r-neu-lg p-8 mb-10">
          <h2 className="text-xl font-bold text-[#2d3436] mb-6">Recent Sessions</h2>
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="neu-sm r-neu p-6 transition-all">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-6">
                    <div className="neu-inset rounded-full w-16 h-16 flex items-center justify-center">
                      <span className="text-2xl font-extrabold text-[#2d3436]">{s.score}</span>
                    </div>
                    <div>
                      <div className="text-[#2d3436] font-bold text-lg mb-1">Practice Session #{s.id}</div>
                      <div className="text-sm text-[#636e72]">{s.date} • {s.duration}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {s.improvement !== '-' && <span className="text-[#00b894] font-bold text-lg">{s.improvement}</span>}
                    <button className="neu-xs r-neu px-5 py-2.5 text-[#636e72] text-sm font-semibold transition-all">View Report</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="neu r-neu-lg p-8">
            <h3 className="text-lg font-bold text-[#2d3436] mb-6">Top Strengths</h3>
            <ul className="space-y-4">
              {['Excellent posture maintenance', 'Good speech pace control', 'Clear and structured answers'].map((item, i) => (
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
              {['Reduce filler words (target: <5)', 'Maintain eye contact longer', 'Add more specific examples'].map((item, i) => (
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
