import logging
import os
import re
from typing import Any, Dict

from dotenv import load_dotenv
from vision_agents.core import Agent, AgentLauncher, Runner, User
from vision_agents.plugins import deepgram, elevenlabs, openai, getstream

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

from agents.vision_processor import AceViewVisionProcessor

async def create_agent(**kwargs) -> Agent:
    llm = setup_llm()

    agent = Agent(
        edge=getstream.Edge(),  # Low latency edge network
        agent_user=User(name="AceView AI Coach", id="aceview_agent"),
        instructions=SYSTEM_PROMPT,
        processors=[
            AceViewVisionProcessor(model_path="yolo26n-pose.pt", fps=3)
        ],
        llm=llm,
        tts=elevenlabs.TTS(model_id="eleven_flash_v2_5"),
        stt=deepgram.STT(eager_turn_detection=True),
        streaming_tts=True, # Drastically cuts response latency
    )

    return agent

FILLER_WORDS = {"umm", "hmm", "uh", "like", "you know", "basically", "actually", "literally", "right", "so"}

async def join_call(agent: Agent, call_type: str, call_id: str, **kwargs) -> None:
    import asyncio
    from vision_agents.core.stt.events import STTTranscriptEvent, STTPartialTranscriptEvent

    call = await agent.create_call(
        call_type=call_type,
        call_id=call_id,
    )

    async with agent.join(call):
        # The SDK event bus is TYPE-ANNOTATION-DRIVEN.
        # Without the type hint on the parameter, the event bus registers the
        # handler for zero event types and it is NEVER called.
        # We need two separate handlers: one for partial (live typing) and one
        # for final transcripts (filler-word counting + history).

        async def on_partial_transcript(event: STTPartialTranscriptEvent):
            """Send live partial transcript so the user sees text as they speak."""
            if event.text:
                try:
                    await agent.send_custom_event({
                        "type": "transcript_partial",
                        "text": event.text.strip(),
                    })
                except Exception:
                    pass  # connection may be momentarily unavailable

        async def on_final_transcript(event: STTTranscriptEvent):
            """Send final transcript with filler-word count to the frontend."""
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
                filler_count += sum(1 for w in words if w in single_fillers)
                try:
                    await agent.send_custom_event({
                        "type": "transcript",
                        "text": text,
                        "filler_count": filler_count,
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
