import Link from 'next/link';
import {
  Sparkles, Video, MessageSquare, Zap, ArrowRight,
  Eye, Activity, Brain, CheckCircle, Github
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#e0e5ec] flex flex-col">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-[#e0e5ec]/80 backdrop-blur-md border-b border-[#c8d0d8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="neu-sm r-neu p-2.5">
              <Sparkles className="w-5 h-5 text-[#6c5ce7]" />
            </div>
            <span className="text-xl font-extrabold text-[#2d3436] tracking-tight">AceView</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-semibold text-[#636e72] hover:text-[#2d3436] transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-semibold text-[#636e72] hover:text-[#2d3436] transition-colors">How It Works</a>
            <Link href="/dashboard" className="text-sm font-semibold text-[#636e72] hover:text-[#2d3436] transition-colors">Dashboard</Link>
          </nav>

          <Link
            href="/interview"
            className="group neu r-neu px-5 py-2.5 text-[#6c5ce7] text-sm font-bold transition-all flex items-center gap-2"
          >
            Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="flex-1 max-w-6xl mx-auto px-6 pt-20 pb-10 text-center">
        <div className="inline-flex items-center gap-2 neu-sm r-neu px-4 py-2 mb-8 text-sm text-[#6c5ce7] font-semibold">
          <Sparkles className="w-4 h-4" /> Powered by Vision Agents &amp; Gemini AI
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-[#2d3436] tracking-tight mb-6 leading-tight">
          Ace Every<br />
          <span className="text-[#6c5ce7]">Interview.</span>
        </h1>

        <p className="text-lg text-[#636e72] mb-12 max-w-2xl mx-auto leading-relaxed">
          Real-time body language &amp; speech analysis. Practice with an AI coach that sees you,
          hears you, and gives instant coaching — just like a real interview panel.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-20">
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

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto mb-20">
          {[
            { val: 'Real-time', label: 'YOLO Pose Analysis' },
            { val: 'Live STT', label: 'Deepgram Transcription' },
            { val: 'Gemini AI', label: 'Report Generation' },
          ].map((stat) => (
            <div key={stat.val} className="neu r-neu p-5 text-center">
              <div className="text-base font-extrabold text-[#2d3436]">{stat.val}</div>
              <div className="text-xs text-[#b2bec3] mt-1 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2d3436] mb-3">
            Everything You Need to Nail It
          </h2>
          <p className="text-[#636e72] max-w-xl mx-auto">
            Six real-time signals, four AI systems, one practice session.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Eye}
            title="Eye Contact Tracking"
            description="YOLO pose detection measures how consistently you maintain camera eye contact — scored live, every second."
            accentColor="#0984e3"
            badge="Computer Vision"
          />
          <FeatureCard
            icon={Activity}
            title="Posture Analysis"
            description="Shoulder alignment and body symmetry scored in real-time. AI nudges fire when your posture slips."
            accentColor="#00b894"
            badge="YOLO v11"
          />
          <FeatureCard
            icon={MessageSquare}
            title="Filler Word Detection"
            description="Live transcript highlights every 'um', 'like', 'you know' — helping you break the habit in real time."
            accentColor="#e17055"
            badge="Deepgram STT"
          />
          <FeatureCard
            icon={Zap}
            title="Invisible AI Nudges"
            description="Subtle popup coaching tips appear when your posture drops or eye contact fades — without breaking your flow."
            accentColor="#6c5ce7"
            badge="Real-time"
          />
          <FeatureCard
            icon={Video}
            title="AI Conversation Coach"
            description="An ElevenLabs-voiced AI coach conducts the interview, listens to your answers, and asks intelligent follow-ups."
            accentColor="#a29bfe"
            badge="ElevenLabs + Gemini"
          />
          <FeatureCard
            icon={Brain}
            title="AI Report Card"
            description="After every session, Gemini generates a personalised report with grade, strengths, improvements, and a coaching tip."
            accentColor="#fd79a8"
            badge="Gemini 2.0 Flash"
          />
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="max-w-4xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2d3436] mb-3">How It Works</h2>
          <p className="text-[#636e72]">Four steps from click to confidence.</p>
        </div>

        <div className="space-y-6">
          {[
            { step: '01', title: 'Join the Session', desc: 'Click Start Session — the AI Coach joins the video call instantly using Stream WebRTC.' },
            { step: '02', title: 'Get Interviewed', desc: 'The AI voices a greeting via ElevenLabs, asks real interview questions, and listens to your answers.' },
            { step: '03', title: 'See Live Metrics', desc: 'Posture, eye contact, filler words, and speech pace update every second on the right panel.' },
            { step: '04', title: 'Receive Your Report', desc: 'End the session — get a Gemini-generated Grade A-D report card with strengths, improvements, and a tip to download.' },
          ].map((item) => (
            <div key={item.step} className="neu r-neu-lg p-7 flex items-start gap-6">
              <div className="neu-inset rounded-xl p-3 min-w-[52px] text-center">
                <span className="text-lg font-extrabold text-[#6c5ce7]">{item.step}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#2d3436] mb-1">{item.title}</h3>
                <p className="text-[#636e72] text-sm leading-relaxed">{item.desc}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-[#00b894] flex-shrink-0 mt-1 ml-auto" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="neu r-neu-lg p-12 text-center">
          <h2 className="text-3xl font-extrabold text-[#2d3436] mb-3">Ready to Ace Your Interview?</h2>
          <p className="text-[#636e72] mb-8 max-w-lg mx-auto">
            Free to use. No sign-up required. Start your first AI-coached practice session in seconds.
          </p>
          <Link
            href="/interview"
            className="group inline-flex items-center gap-3 neu r-neu px-10 py-5 text-[#6c5ce7] text-lg font-bold transition-all"
          >
            Start Practice Session
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#c8d0d8] bg-[#e0e5ec]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="neu-sm r-neu p-2">
              <Sparkles className="w-4 h-4 text-[#6c5ce7]" />
            </div>
            <span className="font-extrabold text-[#2d3436]">AceView</span>
            <span className="text-[#b2bec3] text-sm">· Your AI Interview Coach</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#636e72]">
            <Link href="/interview" className="hover:text-[#2d3436] transition-colors font-medium">Practice</Link>
            <Link href="/dashboard" className="hover:text-[#2d3436] transition-colors font-medium">Dashboard</Link>
            <a
              href="https://github.com/SKfaizan-786/aceview"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-[#2d3436] transition-colors font-medium"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>

          <p className="text-xs text-[#b2bec3]">
            Built with Vision Agents · Deepgram · ElevenLabs · Gemini
          </p>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({
  icon: Icon, title, description, accentColor, badge,
}: {
  icon: any; title: string; description: string; accentColor: string; badge: string;
}) {
  return (
    <div className="neu r-neu-lg p-8 transition-all anim-fade flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="neu-inset r-neu p-4 inline-block">
          <Icon className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: accentColor + '18', color: accentColor }}
        >
          {badge}
        </span>
      </div>
      <h3 className="text-lg font-bold text-[#2d3436]">{title}</h3>
      <p className="text-[#636e72] text-sm leading-relaxed flex-1">{description}</p>
    </div>
  );
}
