from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from chat_with_faiss import query

app = FastAPI()

# allow your frontend origin (or "*" for all)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    # explicit normal‐mode
    answer = query(req.question, mode="normal")
    return ChatResponse(answer=answer)


@app.post("/chat/json", response_model=ChatResponse)
async def chat_json_endpoint(req: ChatRequest):
    answer = query(req.question, mode="json")
    return ChatResponse(answer=answer)
