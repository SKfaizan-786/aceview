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

interface InterviewStore {
  isSessionActive: boolean;
  metrics: Metrics;
  transcript: string[];
  aiNudges: string[];
  startSession: () => void;
  endSession: () => void;
  updateMetrics: (metrics: Partial<Metrics>) => void;
  addTranscriptLine: (line: string, hasFillerWord: boolean) => void;
  addAiNudge: (nudge: string) => void;
  clearAiNudges: () => void;
  // Mock triggers for demo
  triggerSlouch: () => void;
  triggerFillerWord: () => void;
  triggerNudge: () => void;
}

export const useInterviewStore = create<InterviewStore>((set) => ({
  isSessionActive: false,
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
  
  startSession: () => set({ isSessionActive: true }),
  endSession: () => set({ isSessionActive: false }),
  
  updateMetrics: (newMetrics) =>
    set((state) => {
      const updatedMetrics = { ...state.metrics, ...newMetrics };
      
      // Calculate confidence state based on scores
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
  
  addTranscriptLine: (line, hasFillerWord) =>
    set((state) => ({
      transcript: [...state.transcript, line],
      metrics: {
        ...state.metrics,
        fillerWordCount: hasFillerWord
          ? state.metrics.fillerWordCount + 1
          : state.metrics.fillerWordCount,
      },
    })),
  
  addAiNudge: (nudge) =>
    set((state) => ({
      aiNudges: [...state.aiNudges, nudge],
    })),
  
  clearAiNudges: () => set({ aiNudges: [] }),
  
  // Mock triggers for demo
  triggerSlouch: () =>
    set((state) => {
      const newPosture = Math.max(40, state.metrics.postureScore - 30);
      return {
        metrics: {
          ...state.metrics,
          postureScore: newPosture,
        },
      };
    }),
  
  triggerFillerWord: () =>
    set((state) => ({
      transcript: [...state.transcript, "Umm, like, you know..."],
      metrics: {
        ...state.metrics,
        fillerWordCount: state.metrics.fillerWordCount + 3,
      },
    })),
  
  triggerNudge: () =>
    set((state) => ({
      aiNudges: [
        ...state.aiNudges,
        "💡 Mention specific metrics from your project",
      ],
    })),
}));
