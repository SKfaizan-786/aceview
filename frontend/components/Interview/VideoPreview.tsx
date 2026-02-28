'use client';

import { useInterviewStore } from '@/store/interviewStore';
import { useCall, useCallStateHooks, ParticipantView } from '@stream-io/video-react-sdk';
import { Camera, CameraOff } from 'lucide-react';
import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Inner component — only rendered when inside <StreamCall> context.
// Keeping stream-specific hooks isolated here prevents "outside context"
// warnings and avoids stream-SDK re-renders bleeding into the whole tree.
// ─────────────────────────────────────────────────────────────────────────────
function ActiveVideoPreview({ ringColor }: { ringColor: string }) {
  const call = useCall();
  const { useLocalParticipant, useRemoteParticipants } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  // Enable camera + mic here (inside the Stream context) so their ICE negotiation
  // happens naturally before the AI is invited (StreamProvider waits 2500ms).
  useEffect(() => {
    if (call) {
      call.camera.enable().catch(() => {});
      call.microphone.enable().catch(() => {});
    }
  }, [call]);

  const toggleCamera = async () => {
    if (!call) return;
    call.camera.state.status === 'enabled'
      ? await call.camera.disable()
      : await call.camera.enable();
  };

  const isCameraOn = call?.camera.state.status === 'enabled';

  // While waiting for local participant to appear
  if (!localParticipant) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-[#e0e5ec]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6c5ce7]" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ borderRadius: '24px', overflow: 'hidden' }}>
      {/* Main User Video */}
      <div className="w-full h-full [&>.str-video__participant-view]:w-full [&>.str-video__participant-view]:h-full [&_video]:object-cover [&_video]:-scale-x-100">
        <ParticipantView
          participant={localParticipant}
          ParticipantViewUI={null}
        />
      </div>

      {/* Picture-in-Picture Remote AI Coach */}
      {remoteParticipants.length > 0 && (
        <div className="absolute top-4 right-4 w-1/4 max-w-[200px] aspect-video rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black/50 backdrop-blur-sm z-20">
          <ParticipantView
            participant={remoteParticipants[0]}
            ParticipantViewUI={null}
          />
        </div>
      )}

      {/* Camera toggle */}
      <button onClick={toggleCamera} className="neu-sm rounded-full absolute bottom-4 right-4 p-3 transition-all z-10">
        {isCameraOn ? <Camera className="w-5 h-5 text-[#2d3436]" /> : <CameraOff className="w-5 h-5 text-[#636e72]" />}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Outer component — safe to render anywhere (no stream hooks).
// Uses selectors so it only re-renders when confidenceState or session
// status change — NOT on every posture/eye-contact metrics tick.
// ─────────────────────────────────────────────────────────────────────────────
export default function VideoPreview() {
  const isSessionActive = useInterviewStore((s) => s.isSessionActive);
  const confidenceState = useInterviewStore((s) => s.metrics.confidenceState);

  const ringColor = confidenceState === 'high' ? '#00b894'
    : confidenceState === 'medium' ? '#fdcb6e' : '#e17055';

  return (
    <div
      className="neu-inset r-neu-lg relative w-full aspect-video overflow-hidden bg-[#e0e5ec]"
      style={{ border: `4px solid ${ringColor}`, boxShadow: `inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff, 0 0 20px ${ringColor}33` }}
    >
      {/* Confidence badge — always visible */}
      <div className="neu-sm rounded-full absolute top-4 left-4 px-4 py-2 z-10 bg-[#e0e5ec]/80 backdrop-blur-sm">
        <span className="text-sm font-bold tracking-wider uppercase" style={{ color: ringColor }}>
          {confidenceState}
        </span>
      </div>

      {isSessionActive ? (
        // ActiveVideoPreview will only be reached when StreamProvider has already
        // wrapped children in <StreamVideo><StreamCall>, so all stream hooks are valid.
        <ActiveVideoPreview ringColor={ringColor} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e0e5ec]">
          <div className="text-center">
            <div className="neu rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CameraOff className="w-10 h-10 text-[#b2bec3]" />
            </div>
            <p className="text-[#636e72] font-medium">Session not started</p>
            <p className="text-[#b2bec3] text-sm mt-1">Click Start Session to connect</p>
          </div>
        </div>
      )}
    </div>
  );
}

