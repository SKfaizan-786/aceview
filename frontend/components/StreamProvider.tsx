'use client';

import { useEffect, useState } from 'react';
import { StreamVideo, StreamCall, StreamVideoClient, User, Call } from '@stream-io/video-react-sdk';
import { useInterviewStore } from '@/store/interviewStore';

export default function StreamProvider({ children }: { children: React.ReactNode }) {
    const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null);
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    // Only subscribe to isSessionActive — avoids infinite re-render loops
    // when metrics/transcript state updates come in from the event handlers.
    // All other store actions are accessed via getState() inside the effect.
    const isSessionActive = useInterviewStore((s) => s.isSessionActive);

    useEffect(() => {
        if (!isSessionActive) {
            if (activeCall) {
                activeCall.leave();
                setActiveCall(null);
            }
            if (videoClient) {
                videoClient.disconnectUser();
                setVideoClient(null);
            }
            return;
        }

        let client: StreamVideoClient;
        let call: Call;

        const initStream = async () => {
            try {
                const userId = `guest_${Math.random().toString(36).slice(2, 7)}`;
                const callId = `interview_${Math.random().toString(36).slice(2, 10)}`;

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/token`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: userId }),
                });

                const data = await response.json();
                console.log('[AceView] Got token successfully', { userId, callId });

                const user: User = { id: userId, name: 'Interview Participant' };

                client = new StreamVideoClient({
                    apiKey: data.api_key,
                    user,
                    token: data.token,
                });

                setVideoClient(client);

                console.log(`[AceView] Joining Stream Call: ${callId}...`);
                call = client.call('default', callId);
                await call.join({ create: true });
                setActiveCall(call);
                console.log(`[AceView] Joined Call. Setting up event listeners...`);

                // IMPORTANT: listen on `call`, not `client` — custom events are call-scoped
                // Use getState() so these handlers don't capture stale closures
                // and don't cause StreamProvider to re-render on every metric update.
                call.on('custom', (event: any) => {
                    const payload = event?.custom;
                    if (!payload) return;
                    const store = useInterviewStore.getState();

                    if (payload.type === 'vision_metrics') {
                        store.updateMetrics({
                            postureScore: payload.posture_score ?? 85,
                            eyeContactScore: payload.eye_contact_score ?? (payload.face_visible ? 75 : 40),
                        });
                    } else if (payload.type === 'transcript_partial') {
                        // Live partial — update the "typing" preview line
                        if (payload.text) {
                            store.setPartialTranscript(payload.text);
                        }
                    } else if (payload.type === 'transcript') {
                        if (payload.text) {
                            store.addTranscriptLine(payload.text, payload.filler_count ?? 0);
                        }
                        // Real WPM-based pace score — updates after each sentence
                        if (typeof payload.pace_score === 'number') {
                            store.updateMetrics({ speechPaceScore: payload.pace_score });
                        }
                        // Filler word nudge at thresholds 5 / 10 / 15
                        const fillerNudgeThresholds = [5, 10, 15];
                        const totalFillers = store.metrics.fillerWordCount;
                        for (const threshold of fillerNudgeThresholds) {
                            if (totalFillers >= threshold && totalFillers < threshold + (payload.filler_count ?? 0) + 1) {
                                const msgs: Record<number, string> = {
                                    5: "You've used 5 filler words — try pausing briefly instead of saying 'um' or 'like'",
                                    10: "10 filler words so far — take a breath before answering to speak more clearly",
                                    15: "15 filler words used — slow down and speak with intention, one idea at a time",
                                };
                                if (msgs[threshold]) store.addAiNudge(msgs[threshold]);
                                break;
                            }
                        }
                    } else if (payload.type === 'ai_nudge') {
                        if (payload.message) {
                            store.addAiNudge(payload.message);
                        }
                    }
                });

                console.log(`[AceView] Sending AI invite to backend...`);
                // Wait for the frontend's WebRTC ICE negotiation (triggered by VideoPreview
                // mounting and calling camera.enable) to fully complete before the AI
                // agent starts its own ICE negotiation. Two concurrent ICE setups on the
                // same SFU session cause the agent's WebSocket to be dropped.
                await new Promise((r) => setTimeout(r, 2500));
                const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/start-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ call_id: callId }),
                });

                const aiData = await aiResponse.json();
                console.log(`[AceView] Backend start-session response:`, aiData);

            } catch (error) {
                console.error('[AceView] FATAL: Failed to initialize Stream Video client:', error);
            }
        };

        initStream();

        return () => {
            if (call) call.leave();
            if (client) client.disconnectUser();
            setActiveCall(null);
            setVideoClient(null);
        };
    }, [isSessionActive]);

    if (isSessionActive && (!videoClient || !activeCall)) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6c5ce7]"></div>
            </div>
        );
    }

    if (!isSessionActive) {
        return <>{children}</>;
    }

    return (
        <StreamVideo client={videoClient!}>
            <StreamCall call={activeCall!}>
                {children}
            </StreamCall>
        </StreamVideo>
    );
}
