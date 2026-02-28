import { create } from 'zustand';

export type ConfidenceState = 'high' | 'medium' | 'low';

interface Metrics {
  confidenceScore: number;
  postureScore: number;
  eyeContactScore: number;
  speechPaceScore: number;
  fillerWordCount: number;
  confidenceState: ConfidenceState;
}

// Internal accumulators — not exposed to UI, just used for average calculation
interface SessionAccumulator {
  postureSum: number;
  eyeSum: number;
  paceSum: number;
  paceCount: number; // pace updates separately (per sentence, not per frame)
  frameCount: number; // posture + eye update per YOLO frame
}

export interface SessionSummary {
  overall_score: number;
  grade: string;
  summary: string;
  strengths: string[];
  improvements: string[];
  tip_of_the_day: string;
}

interface InterviewStore {
  isSessionActive: boolean;
  metrics: Metrics;
  transcript: string[];
  partialTranscript: string;
  aiNudges: string[];
  sessionSummary: SessionSummary | null;
  isFetchingSummary: boolean;
  _acc: SessionAccumulator; // internal — do not read in UI components
  startSession: () => void;
  endSession: () => void;
  updateMetrics: (metrics: Partial<Metrics>) => void;
  addTranscriptLine: (line: string, fillerCount: number) => void;
  setPartialTranscript: (text: string) => void;
  addAiNudge: (nudge: string) => void;
  clearAiNudges: () => void;
  fetchSummary: (avgMetrics: { posture: number; eye: number; pace: number }) => Promise<void>;
  // Mock triggers for demo
  triggerSlouch: () => void;
  triggerFillerWord: () => void;
  triggerNudge: () => void;
}

const DEFAULT_METRICS: Metrics = {
  confidenceScore: 75,
  postureScore: 85,
  eyeContactScore: 78,
  speechPaceScore: 82,
  fillerWordCount: 0,
  confidenceState: 'high',
};

const DEFAULT_ACC: SessionAccumulator = {
  postureSum: 0,
  eyeSum: 0,
  paceSum: 0,
  paceCount: 0,
  frameCount: 0,
};

function computeConfidence(posture: number, eye: number, pace: number): { score: number; state: ConfidenceState } {
  const avg = (posture + eye + pace) / 3;
  const state: ConfidenceState = avg < 60 ? 'low' : avg < 75 ? 'medium' : 'high';
  return { score: Math.round(avg), state };
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  isSessionActive: false,
  sessionSummary: null,
  isFetchingSummary: false,
  partialTranscript: '',
  metrics: { ...DEFAULT_METRICS },
  transcript: [],
  aiNudges: [],
  _acc: { ...DEFAULT_ACC },

  startSession: () => set({
    isSessionActive: true,
    sessionSummary: null,
    transcript: [],
    partialTranscript: '',
    aiNudges: [],
    metrics: { ...DEFAULT_METRICS },
    _acc: { ...DEFAULT_ACC },
  }),

  endSession: () => {
    const { _acc, metrics } = get();

    // Compute session averages (fall back to last live value if no data)
    const avgPosture = _acc.frameCount > 0 ? Math.round(_acc.postureSum / _acc.frameCount) : metrics.postureScore;
    const avgEye = _acc.frameCount > 0 ? Math.round(_acc.eyeSum / _acc.frameCount) : metrics.eyeContactScore;
    const avgPace = _acc.paceCount > 0 ? Math.round(_acc.paceSum / _acc.paceCount) : metrics.speechPaceScore;

    const { score: avgConfidence, state: avgState } = computeConfidence(avgPosture, avgEye, avgPace);

    // Show the TRUE session averages on the right panel immediately
    set({
      isSessionActive: false,
      metrics: {
        ...metrics,
        postureScore: avgPosture,
        eyeContactScore: avgEye,
        speechPaceScore: avgPace,
        confidenceScore: avgConfidence,
        confidenceState: avgState,
      },
    });

    // Persist session record to localStorage for the dashboard
    try {
      const record = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB'),
        score: avgConfidence,
        posture: avgPosture,
        eye: avgEye,
        pace: avgPace,
        fillerWords: metrics.fillerWordCount,
      };
      const existing = JSON.parse(localStorage.getItem('aceview_sessions') ?? '[]');
      const updated = [record, ...existing].slice(0, 10); // keep last 10
      localStorage.setItem('aceview_sessions', JSON.stringify(updated));
    } catch (_) { }

    // Fetch report card using those same averages
    get().fetchSummary({ posture: avgPosture, eye: avgEye, pace: avgPace });
  },

  fetchSummary: async ({ posture, eye, pace }) => {
    const state = get();
    set({ isFetchingSummary: true });
    try {
      const res = await fetch('http://localhost:8000/api/session/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posture_score: posture,
          eye_contact_score: eye,
          speech_pace_score: pace,
          filler_word_count: state.metrics.fillerWordCount,
          transcript: state.transcript,
          duration_minutes: 5,
        }),
      });
      const data = await res.json();
      if (data.summary) {
        set({ sessionSummary: data.summary });
      }
    } catch (e) {
      console.error('[AceView] Failed to fetch session summary:', e);
    } finally {
      set({ isFetchingSummary: false });
    }
  },

  updateMetrics: (newMetrics) =>
    set((state) => {
      // Smooth display: move max ±10 pts per frame so numbers don't jump wildly
      const smooth = (current: number, next: number) =>
        Math.round(current + Math.max(-10, Math.min(10, next - current)));

      const smoothed: Partial<Metrics> = { ...newMetrics };
      if (newMetrics.postureScore !== undefined)
        smoothed.postureScore = smooth(state.metrics.postureScore, newMetrics.postureScore);
      if (newMetrics.eyeContactScore !== undefined)
        smoothed.eyeContactScore = smooth(state.metrics.eyeContactScore, newMetrics.eyeContactScore);
      if (newMetrics.speechPaceScore !== undefined)
        smoothed.speechPaceScore = smooth(state.metrics.speechPaceScore, newMetrics.speechPaceScore);

      const updated = { ...state.metrics, ...smoothed };

      // Accumulate RAW values (not smoothed) for accurate session averages
      const newAcc = { ...state._acc };
      if (newMetrics.postureScore !== undefined) {
        newAcc.postureSum += newMetrics.postureScore;
        newAcc.eyeSum += (newMetrics.eyeContactScore ?? state.metrics.eyeContactScore);
        newAcc.frameCount += 1;
      }
      if (newMetrics.speechPaceScore !== undefined) {
        newAcc.paceSum += newMetrics.speechPaceScore;
        newAcc.paceCount += 1;
      }

      const { score, state: confState } = computeConfidence(
        updated.postureScore,
        updated.eyeContactScore,
        updated.speechPaceScore,
      );

      return {
        _acc: newAcc,
        metrics: { ...updated, confidenceScore: score, confidenceState: confState },
      };
    }),

  setPartialTranscript: (text) => set({ partialTranscript: text }),

  addTranscriptLine: (line, fillerCount) =>
    set((state) => ({
      transcript: [...state.transcript, line],
      partialTranscript: '',
      metrics: {
        ...state.metrics,
        fillerWordCount: state.metrics.fillerWordCount + fillerCount,
      },
    })),

  addAiNudge: (nudge) =>
    set((state) => ({
      aiNudges: [...state.aiNudges, nudge],
    })),

  clearAiNudges: () => set({ aiNudges: [] }),

  // Mock triggers for demo
  triggerSlouch: () =>
    set((state) => ({
      metrics: {
        ...state.metrics,
        postureScore: Math.max(40, state.metrics.postureScore - 30),
      },
    })),

  triggerFillerWord: () =>
    set((state) => ({
      transcript: [...state.transcript, 'Umm, like, you know...'],
      metrics: {
        ...state.metrics,
        fillerWordCount: state.metrics.fillerWordCount + 3,
      },
    })),

  triggerNudge: () =>
    set((state) => ({
      aiNudges: [...state.aiNudges, '💡 Mention specific metrics from your project'],
    })),
}));
