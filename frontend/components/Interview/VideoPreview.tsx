'use client';

import { useEffect, useRef, useState } from 'react';
import { useInterviewStore } from '@/store/interviewStore';
import { Camera, CameraOff } from 'lucide-react';

export default function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { metrics } = useInterviewStore();

  useEffect(() => {
    startCamera();
    return () => { stopCamera(); };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setIsCameraOn(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (stream) { stream.getTracks().forEach((t) => t.stop()); setStream(null); }
    setIsCameraOn(false);
  };

  const toggleCamera = () => { isCameraOn ? stopCamera() : startCamera(); };

  const ringColor = metrics.confidenceState === 'high' ? '#00b894'
    : metrics.confidenceState === 'medium' ? '#fdcb6e' : '#e17055';

  return (
    <div
      className="neu-inset r-neu-lg relative w-full aspect-video overflow-hidden"
      style={{ border: `4px solid ${ringColor}`, boxShadow: `inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff, 0 0 20px ${ringColor}33` }}
    >
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ borderRadius: '24px' }} />

      {!isCameraOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#e0e5ec]">
          <div className="text-center">
            <div className="neu rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <CameraOff className="w-10 h-10 text-[#b2bec3]" />
            </div>
            <p className="text-[#636e72] font-medium">Camera is off</p>
            <p className="text-[#b2bec3] text-sm mt-1">Click the button to enable</p>
          </div>
        </div>
      )}

      <button onClick={toggleCamera} className="neu-sm rounded-full absolute bottom-4 right-4 p-3 transition-all">
        {isCameraOn ? <Camera className="w-5 h-5 text-[#2d3436]" /> : <CameraOff className="w-5 h-5 text-[#636e72]" />}
      </button>

      <div className="neu-sm rounded-full absolute top-4 left-4 px-4 py-2">
        <span className="text-sm font-bold tracking-wider uppercase" style={{ color: ringColor }}>
          {metrics.confidenceState}
        </span>
      </div>
    </div>
  );
}
