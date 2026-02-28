import logging
import time
from typing import Any, Dict, Optional, Tuple
import numpy as np

from vision_agents.core import Agent
from vision_agents.plugins.ultralytics import YOLOPoseProcessor

logger = logging.getLogger(__name__)

# COCO keypoint indices (standard YOLO pose model)
NOSE = 0
LEFT_EYE = 1
RIGHT_EYE = 2
LEFT_EAR = 3
RIGHT_EAR = 4
LEFT_SHOULDER = 5
RIGHT_SHOULDER = 6
LEFT_ELBOW = 7
RIGHT_ELBOW = 8
LEFT_WRIST = 9
RIGHT_WRIST = 10
LEFT_HIP = 11
RIGHT_HIP = 12

CONF_THRESH = 0.3  # Minimum keypoint confidence to trust
NUDGE_COOLDOWN = 15.0  # seconds between same nudge


class AceViewVisionProcessor(YOLOPoseProcessor):
    """
    Custom YOLO processor that calculates real-time interview coaching metrics
    and broadcasts them to the frontend via WebRTC custom events.
    """

    name = "aceview_vision"

    def __init__(self, *args, **kwargs):
        kwargs.setdefault("fps", 3)
        super().__init__(*args, **kwargs)
        self.agent: Optional[Agent] = None
        self._last_metrics_sent = 0.0
        self._last_nudge_times: Dict[str, float] = {}

    def attach_agent(self, agent: Agent) -> None:
        """Called automatically by the SDK when the agent starts."""
        self.agent = agent
        logger.info("AceViewVisionProcessor attached to agent")

    def _calculate_posture_score(self, kpts: np.ndarray) -> int:
        """Score 0-100 from shoulder level, torso height, and head position."""
        scores = []
        l_sh = kpts[LEFT_SHOULDER]
        r_sh = kpts[RIGHT_SHOULDER]
        l_hip = kpts[LEFT_HIP]
        r_hip = kpts[RIGHT_HIP]
        nose = kpts[NOSE]

        # 1. Shoulder tilt
        if l_sh[2] > CONF_THRESH and r_sh[2] > CONF_THRESH:
            shoulder_width = abs(l_sh[0] - r_sh[0])
            if shoulder_width > 10:
                tilt = abs(l_sh[1] - r_sh[1]) / shoulder_width
                scores.append(max(10, int(100 - tilt * 300)))

        # 2. Torso upright (hips below shoulders in image = person sitting upright)
        if (l_sh[2] > CONF_THRESH and r_sh[2] > CONF_THRESH
                and l_hip[2] > CONF_THRESH and r_hip[2] > CONF_THRESH):
            avg_sh_y = (l_sh[1] + r_sh[1]) / 2
            avg_hip_y = (l_hip[1] + r_hip[1]) / 2
            torso_h = avg_hip_y - avg_sh_y  # positive means shoulders above hips
            if torso_h > 30:
                scores.append(90)
            elif torso_h > 0:
                scores.append(65)
            else:
                scores.append(35)

        # 3. Head upright (nose above shoulders)
        if nose[2] > CONF_THRESH and l_sh[2] > CONF_THRESH and r_sh[2] > CONF_THRESH:
            avg_sh_y = (l_sh[1] + r_sh[1]) / 2
            scores.append(95 if nose[1] < avg_sh_y else 40)

        return min(100, int(sum(scores) / len(scores))) if scores else 0

    def _calculate_eye_contact(self, kpts: np.ndarray) -> Tuple[int, bool]:
        """Returns (eye_contact_score 0-100, face_visible bool)."""
        nose = kpts[NOSE]
        l_eye = kpts[LEFT_EYE]
        r_eye = kpts[RIGHT_EYE]
        l_ear = kpts[LEFT_EAR]
        r_ear = kpts[RIGHT_EAR]

        face_visible = any(kpts[i][2] > CONF_THRESH for i in [NOSE, LEFT_EYE, RIGHT_EYE])
        if not face_visible:
            return 0, False

        # Both eyes + nose: estimate gaze from nose symmetry between eyes
        if l_eye[2] > CONF_THRESH and r_eye[2] > CONF_THRESH and nose[2] > CONF_THRESH:
            eye_cx = (l_eye[0] + r_eye[0]) / 2
            eye_w = abs(l_eye[0] - r_eye[0])
            if eye_w > 5:
                offset = abs(nose[0] - eye_cx) / eye_w
                looking_forward = nose[1] > (l_eye[1] + r_eye[1]) / 2
                if looking_forward:
                    return max(30, int(100 - offset * 160)), True
                else:
                    return max(25, int(70 - offset * 120)), True

        # Partial face
        if l_eye[2] > CONF_THRESH or r_eye[2] > CONF_THRESH:
            if l_ear[2] > CONF_THRESH and r_ear[2] > CONF_THRESH:
                return 30, True  # looking sideways
            return 55, True  # partial

        return 40, True

    def _should_nudge(self, key: str) -> bool:
        now = time.time()
        if now - self._last_nudge_times.get(key, 0.0) >= NUDGE_COOLDOWN:
            self._last_nudge_times[key] = now
            return True
        return False

    async def _send_nudge_if_needed(self, posture: int, eye_contact: int, face_visible: bool):
        if not self.agent:
            return
        import asyncio
        msg = None
        key = None
        if not face_visible:
            key, msg = "no_face", "Make sure your face is clearly visible on camera"
        elif posture < 55:
            key, msg = "bad_posture", "Sit up straight and square your shoulders"
        elif eye_contact < 45:
            key, msg = "low_eye", "Look directly at your camera to maintain eye contact"

        if key and msg and self._should_nudge(key):

            async def _safe_nudge(payload):
                try:
                    await self.agent.send_custom_event(payload)
                except Exception:
                    pass

            asyncio.create_task(_safe_nudge({"type": "ai_nudge", "message": msg}))

    async def _process_pose_async(
        self, frame_array: np.ndarray
    ) -> tuple[np.ndarray, Dict[str, Any]]:
        try:
            annotated_frame, pose_data = await super()._process_pose_async(frame_array)
        except Exception as e:
            logger.error(f"YOLO processing error (returning original frame): {e}")
            return frame_array, {}

        posture_score = 0
        eye_contact_score = 0
        face_visible = False

        if pose_data.get("persons"):
            kpts_list = pose_data["persons"][0].get("keypoints", [])
            if kpts_list and len(kpts_list) >= 13:
                kpts = np.array(kpts_list)
                posture_score = self._calculate_posture_score(kpts)
                eye_contact_score, face_visible = self._calculate_eye_contact(kpts)

        now = time.time()
        if now - self._last_metrics_sent >= 1.0 and self.agent:
            import asyncio

            async def _safe_send(data):
                try:
                    await self.agent.send_custom_event(data)
                except Exception:
                    pass  # connection may be temporarily down; not fatal

            asyncio.create_task(_safe_send({
                "type": "vision_metrics",
                "posture_score": posture_score,
                "eye_contact_score": eye_contact_score,
                "face_visible": face_visible,
                "timestamp": now,
            }))
            await self._send_nudge_if_needed(posture_score, eye_contact_score, face_visible)
            self._last_metrics_sent = now

        return annotated_frame, pose_data
