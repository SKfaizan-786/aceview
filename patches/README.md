# Patches

## `stream_edge_transport.py`

**Source:** `Vision-Agents/plugins/getstream/vision_agents/plugins/getstream/stream_edge_transport.py`

**Why this patch exists:**

The upstream Vision Agents SDK `create_call()` method called `get_or_create` on the Stream coordinator REST API before the agent joined. This could land on **Edge Node A**. The subsequent `agent.join()` call hits the coordinator `/join` endpoint which could land on **Edge Node B**. SFU credentials are node-specific, so `SetPublisher` via Twirp to Node B would fail with:

```
SFU RPC Error in SetPublisher - Code: 200, Message: participant not found
```

**Fix:** Removed `get_or_create` from `create_call()`. The `/join` endpoint (called inside `edge.join()`) is atomic — it does create+join in one request, guaranteed on the same SFU node. The frontend already creates the call via `call.join({ create: true })` before the backend is invited anyway.

**How to apply:**

Copy `patches/stream_edge_transport.py` over the installed SDK file:

```powershell
Copy-Item "patches\stream_edge_transport.py" "Vision-Agents\plugins\getstream\vision_agents\plugins\getstream\stream_edge_transport.py"
```

The SDK is installed as an editable install (`uv pip install -e ../Vision-Agents/plugins/getstream`), so the copy takes effect immediately — no reinstall needed.
