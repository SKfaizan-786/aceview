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
NUDGE_COOLDOWN = 10.0  # seconds between same nudge


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
        self._agent_warned = False  # only warn once if agent is None

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
        """
        Returns (eye_contact_score 0-100, face_visible bool).

        Strategy: YOLO can't track eyeball direction, but it CAN detect head
        rotation via which ears are visible. When you look left your right ear
        pops into view; when you look right your left ear appears. We combine:
          1. Ear asymmetry  → main head-rotation signal (very reliable)
          2. Nose offset    → secondary refinement for slight tilts
        """
        nose  = kpts[NOSE]
        l_eye = kpts[LEFT_EYE]
        r_eye = kpts[RIGHT_EYE]
        l_ear = kpts[LEFT_EAR]
        r_ear = kpts[RIGHT_EAR]

        face_visible = any(kpts[i][2] > CONF_THRESH for i in [NOSE, LEFT_EYE, RIGHT_EYE])
        if not face_visible:
            return 0, False

        # ── Ear asymmetry signal ──────────────────────────────────────────
        # Both ears visible + similar confidence → facing camera → boost score
        # One ear clearly stronger → head rotated that way → penalise heavily
        l_ear_conf = l_ear[2] if l_ear[2] > CONF_THRESH else 0.0
        r_ear_conf = r_ear[2] if r_ear[2] > CONF_THRESH else 0.0
        ear_total  = l_ear_conf + r_ear_conf

        if ear_total > 0.05:
            # asymmetry 0 = perfectly symmetric, 1 = only one ear visible
            ear_asymmetry = abs(l_ear_conf - r_ear_conf) / ear_total
            # Heavy penalty for head rotation (asymmetry > 0.4 = clearly turned)
            ear_penalty = int(ear_asymmetry * 80)  # up to 80-point drop
        else:
            ear_penalty = 0  # no ears detected — can't infer rotation

        # ── Nose symmetry refinement (horizontal offset) ──────────────────
        nose_penalty = 0
        if l_eye[2] > CONF_THRESH and r_eye[2] > CONF_THRESH and nose[2] > CONF_THRESH:
            eye_cx = (l_eye[0] + r_eye[0]) / 2
            eye_w  = abs(l_eye[0] - r_eye[0])
            if eye_w > 5:
                offset = abs(nose[0] - eye_cx) / eye_w
                nose_penalty = int(offset * 100)   # up to ~50-point drop when very offset

        total_penalty = min(95, ear_penalty + nose_penalty)
        score = max(5, 100 - total_penalty)
        return score, True

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

        async def _safe_nudge(payload):
            try:
                await self.agent.send_custom_event(payload)
            except Exception:
                pass

        # All three are checked independently — multiple nudges can fire at once,
        # each with its own 10-second cooldown so they don't spam.
        if not face_visible:
            if self._should_nudge("no_face"):
                asyncio.create_task(_safe_nudge({"type": "ai_nudge", "message": "Make sure your face is clearly visible on camera"}))
        if posture < 70:
            if self._should_nudge("bad_posture"):
                asyncio.create_task(_safe_nudge({"type": "ai_nudge", "message": "Sit up straight and square your shoulders"}))
        if eye_contact < 65:
            if self._should_nudge("low_eye"):
                asyncio.create_task(_safe_nudge({"type": "ai_nudge", "message": "Look directly at your camera to maintain eye contact"}))

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

        persons = pose_data.get("persons", [])
        if persons:
            kpts_list = persons[0].get("keypoints", [])
            if kpts_list and len(kpts_list) >= 13:
                kpts = np.array(kpts_list)
                posture_score = self._calculate_posture_score(kpts)
                eye_contact_score, face_visible = self._calculate_eye_contact(kpts)
                logger.info(f"[YOLO] posture={posture_score} eye={eye_contact_score} face={face_visible}")
            else:
                logger.debug(f"[YOLO] Person detected but insufficient keypoints ({len(kpts_list)})")
        else:
            logger.info("[YOLO] No person detected in frame (check lighting / sit closer to camera)")

        now = time.time()
        if not self.agent:
            if not self._agent_warned:
                logger.warning("[YOLO] self.agent is None -- attach_agent may not have been called")
                self._agent_warned = True
        elif now - self._last_metrics_sent >= 1.0:
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
