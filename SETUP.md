# AceView — Local Setup Guide

## Prerequisites

- Python 3.12+
- Node.js 18+
- [uv](https://docs.astral.sh/uv/getting-started/installation/) package manager
- Git

---

## 1. Clone Both Repos (as sibling folders)

The backend depends on Vision Agents as a **local editable install**. Both repos must sit in the **same parent directory**.

```powershell
# From whatever parent folder you want (e.g. Desktop)
git clone https://github.com/SKfaizan-786/aceview.git
git clone https://github.com/GetStream/Vision-Agents.git
```

Your folder structure must look like:

```
<parent>/
  AceView/          ← this repo
  Vision-Agents/    ← GetStream's SDK (sibling, same level)
```

---

## 2. Apply the SDK Patch

One file in the Vision Agents SDK must be patched to fix a critical SFU edge-node routing bug
(`participant not found` on SetPublisher). See [patches/README.md](patches/README.md) for full details.

```powershell
cd AceView
Copy-Item "patches\stream_edge_transport.py" "..\Vision-Agents\plugins\getstream\vision_agents\plugins\getstream\stream_edge_transport.py"
```

---

## 3. Create `backend/.env`

Get these values from the project owner. **Never commit this file.**

```env
STREAM_API_KEY=your_stream_api_key
STREAM_SECRET=your_stream_api_secret
OPENROUTER_API_KEY=your_openrouter_key
ELEVENLABS_API_KEY=your_elevenlabs_key
DEEPGRAM_API_KEY=your_deepgram_key
```

---

## 4. Install Dependencies

**Backend:**
```powershell
cd AceView/backend
uv sync
```

**Frontend:**
```powershell
cd AceView/frontend
npm install
```

---

## 5. Run the App

Open two terminals:

**Terminal 1 — Backend (port 8000):**
```powershell
cd AceView/backend
uv run python main.py
```
Wait for: `INFO: Application startup complete.`

**Terminal 2 — Frontend (port 3000):**
```powershell
cd AceView/frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Troubleshooting

**`Failed to fetch` on Start Session**
Stale backend processes are holding port 8000. Kill them and restart:
```powershell
Get-Process python* | Stop-Process -Force -ErrorAction SilentlyContinue
```
Then re-run `uv run python main.py`.

**`uv sync` fails with path errors**
Make sure `Vision-Agents/` is a sibling of `AceView/` — not inside it, not elsewhere.

**Camera not showing**
Allow camera/microphone permissions in the browser when prompted.
