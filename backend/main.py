from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import httpx

app = FastAPI(title="FindYourHome API", version="0.1.0")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/health", tags=["system"])
async def health() -> dict:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse, tags=["chat"])
async def chat(req: ChatRequest) -> ChatResponse:
    # Placeholder virtual realtor logic
    prompt = req.message.strip()
    if not prompt:
        return ChatResponse(
            reply="Please tell me where you’d like to live, your budget, and any preferences (beds, baths, neighborhood)."
        )

    reply = (
        "Thanks for sharing! (Demo response) I would now search listings that match:\n"
        f"- Your request: \"{prompt}\"\n"
        "- Then sort by best value and proximity to key amenities.\n\n"
        "In a real setup, this endpoint would call a model and property database." # noqa
    )
    return ChatResponse(reply=reply)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            prompt = await websocket.receive_text()
            print("Received:", prompt)

            async with httpx.AsyncClient(timeout=None) as client:
                async with client.stream(
                    "POST",
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "qwen3.5:0.8b",
                        "prompt": prompt,
                        "stream": True
                    }
                ) as response:
                    buffer = ""
                    think_buffer = ""
                    in_think = False

                    async for chunk in response.aiter_bytes():
                        buffer += chunk.decode("utf-8")

                        while "\n" in buffer:
                            line, buffer = buffer.split("\n", 1)
                            line = line.strip()
                            if not line:
                                continue
                            try:
                                data = json.loads(line)
                                token = data.get("response", "")

                                if token:
                                    think_buffer += token

                                    # Drain think_buffer and filter <think>...</think>
                                    while True:
                                        if in_think:
                                            end = think_buffer.find("</think>")
                                            if end != -1:
                                                # Done thinking, discard up to </think>
                                                think_buffer = think_buffer[end + len("</think>"):]
                                                in_think = False
                                            else:
                                                # Still inside <think>, wait for more tokens
                                                break
                                        else:
                                            start = think_buffer.find("<think>")
                                            if start != -1:
                                                # Send anything before <think>
                                                before = think_buffer[:start]
                                                if before:
                                                    await websocket.send_text(before)
                                                think_buffer = think_buffer[start + len("<think>"):]
                                                in_think = True
                                            else:
                                                # No <think> tag — safe to send
                                                # But hold back last 7 chars in case <think> is split across chunks
                                                safe = think_buffer[:-7]
                                                if safe:
                                                    await websocket.send_text(safe)
                                                    think_buffer = think_buffer[-7:]
                                                break

                                if data.get("done"):
                                    # Flush remaining buffer (no more chunks coming)
                                    if think_buffer and not in_think:
                                        await websocket.send_text(think_buffer)
                                    await websocket.send_text("[END]")
                                    break

                            except json.JSONDecodeError:
                                continue

    except Exception as e:
        print("Error:", e)
