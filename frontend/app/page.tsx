import Link from 'next/link';
import { Sparkles, Video, MessageSquare, Zap, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center gap-5 mb-10 anim-fade">
            <div className="neu r-neu-lg p-5">
              <Sparkles className="w-14 h-14 text-[#6c5ce7]" />
            </div>
            <h1 className="text-6xl sm:text-7xl font-extrabold text-[#2d3436] tracking-tight">
              AceView
            </h1>
          </div>

          {/* Tagline */}
          <p className="text-2xl font-semibold text-[#2d3436] mb-3 anim-fade">
            Your AI Interview Coach
          </p>
          <p className="text-lg text-[#636e72] mb-14 max-w-2xl mx-auto leading-relaxed anim-fade">
            Real-time body language & speech analysis powered by Vision Agents.
            Practice, improve, and ace your interviews with instant AI feedback.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-28 anim-fade">
            <Link
              href="/interview"
              className="group neu r-neu px-10 py-5 text-[#6c5ce7] text-lg font-bold transition-all flex items-center justify-center gap-3"
            >
              Start Practice Session
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/dashboard"
              className="neu r-neu px-10 py-5 text-[#636e72] text-lg font-bold transition-all flex items-center justify-center hover:text-[#2d3436]"
            >
              View Dashboard
            </Link>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-10 mt-8">
            <FeatureCard
              icon={Video}
              title="Confidence Ring"
              description="Dynamic glowing ring that changes color based on your confidence level in real-time"
              accentColor="#00b894"
            />
            <FeatureCard
              icon={MessageSquare}
              title="Filler Word Highlighter"
              description="Live transcript with automatic highlighting of filler words like 'umm' and 'like'"
              accentColor="#e17055"
            />
            <FeatureCard
              icon={Zap}
              title="Invisible AI Nudges"
              description="Minimalist overlay with smart suggestions to improve your answers on the fly"
              accentColor="#6c5ce7"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor,
}: {
  icon: any;
  title: string;
  description: string;
  accentColor: string;
}) {
  return (
    <div className="neu r-neu-lg p-8 transition-all anim-fade">
      <div className="neu-inset r-neu p-4 inline-block mb-6">
        <Icon className="w-10 h-10" style={{ color: accentColor }} />
      </div>
      <h3 className="text-xl font-bold text-[#2d3436] mb-3">{title}</h3>
      <p className="text-[#636e72] text-sm leading-relaxed">{description}</p>
    </div>
  );
}
