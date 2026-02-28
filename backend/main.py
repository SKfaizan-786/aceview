import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import time
import jwt
from contextlib import asynccontextmanager
from typing import List, Optional

from vision_agents.core import AgentLauncher
from agents.interview_agent import create_agent, join_call

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
agent_launcher = AgentLauncher(create_agent=create_agent, join_call=join_call)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up agents and start background loops
    await agent_launcher.start()
    yield
    # Cleanup on exit
    await agent_launcher.stop()

app = FastAPI(title="AceView API", description="Backend API for AceView Interview Coach", lifespan=lifespan)

# Allow requests from the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TokenRequest(BaseModel):
    user_id: str

class StartSessionRequest(BaseModel):
    call_id: str

class SessionSummaryRequest(BaseModel):
    posture_score: int = 75
    eye_contact_score: int = 70
    speech_pace_score: int = 80
    filler_word_count: int = 3
    transcript: Optional[List[str]] = []
    duration_minutes: float = 5.0

@app.post("/api/token")
async def generate_token(request: TokenRequest):
    """Generates a Stream WebRTC JWT token for the frontend users."""
    api_key = os.getenv("STREAM_API_KEY")
    api_secret = os.getenv("STREAM_API_SECRET")

    if not api_key or not api_secret:
        raise HTTPException(status_code=500, detail="Missing Stream API credentials")

    payload = {
        "user_id": request.user_id,
        "exp": int(time.time()) + 3600,
    }
    token = jwt.encode(payload, api_secret, algorithm="HS256")
    
    return {"token": token, "api_key": api_key}

@app.post("/api/start-session")
async def start_session(request: StartSessionRequest):
    """Tells the AI Agent to join the specified Stream Call ID."""
    try:
        session = await agent_launcher.start_session(call_id=request.call_id)
        return {"status": "ok", "agent_id": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "service": "aceview-backend"}

@app.post("/api/session/summary")
async def generate_session_summary(request: SessionSummaryRequest):
    """
    Generates an AI-powered post-session report card using Gemini.
    The frontend sends the aggregated metrics after EndSession is clicked.
    """
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(
            api_key=os.getenv("OPENROUTER_API_KEY"),
            base_url="https://openrouter.ai/api/v1",
        )

        avg_score = round(
            (request.posture_score + request.eye_contact_score + request.speech_pace_score) / 3
        )

        transcript_text = "\n".join(request.transcript[-10:]) if request.transcript else "No transcript available."

        prompt = f"""You are an expert interview coach. A candidate just completed a {request.duration_minutes:.1f}-minute mock interview practice session.

Session Metrics:
- Overall Score: {avg_score}/100
- Posture Score: {request.posture_score}/100
- Eye Contact Score: {request.eye_contact_score}/100
- Speech Pace Score: {request.speech_pace_score}/100
- Filler Words Used: {request.filler_word_count}

Recent Transcript (last 10 lines):
{transcript_text}

Generate a concise, encouraging post-session report in valid JSON with these exact keys:
{{
  "overall_score": <integer 0-100>,
  "grade": "<letter grade A/B/C/D>",
  "summary": "<2 sentence encouraging summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "tip_of_the_day": "<one specific actionable tip>"
}}

Be specific, actionable, and encouraging. Return ONLY valid JSON, no markdown.
"""

        response = await client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7,
        )

        import json
        raw = response.choices[0].message.content.strip()
        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        summary_data = json.loads(raw)
        return {"status": "ok", "summary": summary_data}

    except Exception as e:
        # Fallback static summary if AI call fails
        avg_score = round(
            (request.posture_score + request.eye_contact_score + request.speech_pace_score) / 3
        )
        return {
            "status": "ok",
            "summary": {
                "overall_score": avg_score,
                "grade": "B" if avg_score >= 70 else "C",
                "summary": f"You scored {avg_score}/100 in this session. Keep practising consistently to improve your interview confidence.",
                "strengths": ["Completed a full practice session", "Used the AI coaching tool", "Showed up and practised"],
                "improvements": ["Reduce filler words", "Maintain steady eye contact with camera", "Keep shoulders level and back straight"],
                "tip_of_the_day": "Record yourself answering one question per day. Watching yourself back is the fastest way to spot improvement areas."
            }
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
