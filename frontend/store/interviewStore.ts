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
  startSession: () => void;
  endSession: () => void;
  updateMetrics: (metrics: Partial<Metrics>) => void;
  addTranscriptLine: (line: string, fillerCount: number) => void;
  setPartialTranscript: (text: string) => void;
  addAiNudge: (nudge: string) => void;
  clearAiNudges: () => void;
  fetchSummary: () => Promise<void>;
  // Mock triggers for demo
  triggerSlouch: () => void;
  triggerFillerWord: () => void;
  triggerNudge: () => void;
}

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  isSessionActive: false,
  sessionSummary: null,
  isFetchingSummary: false,
  partialTranscript: '',
  metrics: {
    confidenceScore: 75,
    postureScore: 85,
    eyeContactScore: 78,
    speechPaceScore: 82,
    fillerWordCount: 0,
    confidenceState: 'high',
  },
  transcript: [],
  aiNudges: [],

  startSession: () => set({
    isSessionActive: true,
    sessionSummary: null,
    transcript: [],
    partialTranscript: '',
    aiNudges: [],
    metrics: {
      confidenceScore: 75,
      postureScore: 85,
      eyeContactScore: 78,
      speechPaceScore: 82,
      fillerWordCount: 0,
      confidenceState: 'high',
    },
  }),

  endSession: () => {
    set({ isSessionActive: false });
    // Auto-fetch summary when session ends
    get().fetchSummary();
  },

  fetchSummary: async () => {
    const state = get();
    set({ isFetchingSummary: true });
    try {
      const res = await fetch('http://localhost:8000/api/session/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          posture_score: state.metrics.postureScore,
          eye_contact_score: state.metrics.eyeContactScore,
          speech_pace_score: state.metrics.speechPaceScore,
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
      const updatedMetrics = { ...state.metrics, ...newMetrics };
      const avgScore = (
        updatedMetrics.postureScore +
        updatedMetrics.eyeContactScore +
        updatedMetrics.speechPaceScore
      ) / 3;
      let confidenceState: ConfidenceState = 'high';
      if (avgScore < 60) confidenceState = 'low';
      else if (avgScore < 75) confidenceState = 'medium';
      return {
        metrics: {
          ...updatedMetrics,
          confidenceScore: Math.round(avgScore),
          confidenceState,
        },
      };
    }),

  setPartialTranscript: (text) => set({ partialTranscript: text }),

  addTranscriptLine: (line, fillerCount) =>
    set((state) => ({
      transcript: [...state.transcript, line],
      partialTranscript: '', // clear partial when final arrives
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
      aiNudges: [...state.aiNudges, 'ðŸ’¡ Mention specific metrics from your project'],
    })),
}));
