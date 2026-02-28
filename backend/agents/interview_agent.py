import logging
import os
import re
from pathlib import Path
from typing import Any, Dict

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import deepgram, elevenlabs, openai, getstream
from agents.vision_processor import AceViewVisionProcessor

logger = logging.getLogger(__name__)

load_dotenv()

SYSTEM_PROMPT = """You are AceView, a friendly real-time AI interview coach. Keep every reply under 2 sentences so voice delivery is fast.

- Ask ONE interview question at a time.
- React to what the user just said before asking the next question.
- Be warm and encouraging — never critical.
- Never use markdown, bullet points, or special characters.
- Always end your turn with a question to keep the conversation going.
- If the user says little, give a quick compliment and ask a more specific follow-up.
"""

def setup_llm(model: str = "google/gemini-2.0-flash-001") -> openai.ChatCompletionsLLM:
    """Configured to use OpenRouter.ai as specified in requirements."""
    llm = openai.ChatCompletionsLLM(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        model=model
    )
    return llm

# Resolve model path relative to this file so it works regardless of CWD
_MODEL_PATH = str(Path(__file__).parent.parent / "yolo26n-pose.pt")

async def create_agent(**kwargs) -> Agent:
    llm = setup_llm()

    agent = Agent(
        edge=getstream.Edge(),  # Low latency edge network
        agent_user=User(name="AceView AI Coach", id="aceview_agent"),
        instructions=SYSTEM_PROMPT,
        processors=[
            AceViewVisionProcessor(model_path=_MODEL_PATH, fps=3, conf_threshold=0.25)
        ],
        llm=llm,
        tts=elevenlabs.TTS(model_id="eleven_flash_v2_5"),
        stt=deepgram.STT(eager_turn_detection=True),
        streaming_tts=True, # Drastically cuts response latency
    )

    return agent

# hmm is often transcribed by Deepgram as "mm", "mhm", "hm", or "um"
FILLER_WORDS = {"umm", "um", "hmm", "hm", "mm", "mhm", "uh", "like", "you know", "basically", "actually", "literally", "right", "so"}

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    import asyncio, time
    from vision_agents.core.stt.events import STTTranscriptEvent, STTPartialTranscriptEvent

    call = await agent.create_call(
        call_type=call_type,
        call_id=call_id,
    )

    async with agent.join(call):
        # Tracks real speaking duration for WPM pace score calculation
        _pace = {"words": 0, "speaking_secs": 0.0, "turn_start": None}

        async def on_partial_transcript(event: STTPartialTranscriptEvent):
            """Send live partial transcript so the user sees text as they speak."""
            if event.text:
                # Mark start of speaking turn for WPM calculation
                if _pace["turn_start"] is None:
                    _pace["turn_start"] = time.monotonic()
                try:
                    await agent.send_custom_event({
                        "type": "transcript_partial",
                        "text": event.text.strip(),
                    })
                except Exception:
                    pass  # connection may be momentarily unavailable

        async def on_final_transcript(event: STTTranscriptEvent):
            """Send final transcript with filler-word count and real WPM pace score."""
            if event.text:
                text = event.text.strip()
                normalized = text.lower()
                # Count multi-word phrases first, then single words
                MULTI_WORD_FILLERS = ["you know"]
                filler_count = 0
                for phrase in MULTI_WORD_FILLERS:
                    filler_count += len(re.findall(r'\b' + re.escape(phrase) + r'\b', normalized))
                single_fillers = FILLER_WORDS - set(MULTI_WORD_FILLERS)
                words = re.split(r'\W+', normalized)
                word_count = sum(1 for w in words if w)
                filler_count += sum(1 for w in words if w in single_fillers)

                # Accumulate real speaking time and calculate WPM
                _pace["words"] += word_count
                if _pace["turn_start"] is not None:
                    _pace["speaking_secs"] += time.monotonic() - _pace["turn_start"]
                    _pace["turn_start"] = None
                # Default 82 until we have ≥3s and ≥5 words of data
                pace_score = 82
                if _pace["speaking_secs"] >= 3.0 and _pace["words"] >= 5:
                    wpm = (_pace["words"] / _pace["speaking_secs"]) * 60
                    # 130 WPM = perfect (100). Drops linearly to 0 at 50 or 210 WPM
                    pace_score = max(0, min(100, int((wpm - 50) / 80 * 100) if wpm <= 130 else int(100 - (wpm - 130) / 80 * 100)))
                    logger.info(f"[Pace] {wpm:.0f} WPM → score={pace_score}")

                try:
                    await agent.send_custom_event({
                        "type": "transcript",
                        "text": text,
                        "filler_count": filler_count,
                        "pace_score": pace_score,
                    })
                except Exception:
                    pass

        agent.subscribe(on_partial_transcript)
        agent.subscribe(on_final_transcript)

        # Brief pause to let WebRTC stabilise before greeting
        await asyncio.sleep(1.5)
        await agent.simple_response(
            "Hi, I am your AceView AI Interview Coach! "
            "Let us get started. Can you briefly tell me about yourself "
            "and the role you are preparing for?"
        )

        # Keep agent alive — the STT→LLM→TTS loop runs automatically
        await agent.finish()


if __name__ == "__main__":
    Runner(AgentLauncher(create_agent=create_agent, join_call=join_call)).cli()
