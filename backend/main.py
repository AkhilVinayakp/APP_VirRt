from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
        "In a real setup, this endpoint would call a model and property database."
    )
    return ChatResponse(reply=reply)


