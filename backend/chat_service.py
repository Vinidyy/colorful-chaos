import os
import pickle
import numpy as np
import faiss
import openai
from dotenv import load_dotenv
from prepare_embeddings import embed_chunks

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# load FAISS index + chunks once
script_dir = os.path.dirname(__file__)
faiss_dir = os.path.join(script_dir, "faiss_index")
index = faiss.read_index(os.path.join(faiss_dir, "index.faiss"))
with open(os.path.join(faiss_dir, "chunks.pkl"), "rb") as f:
    chunks = pickle.load(f)
chunk_ids, chunk_texts = zip(*chunks)


def query(question: str, top_k: int = 3) -> str:
    # 1. embed the question
    raw_vec = embed_chunks([("query", question)])[0][1]
    q_vec = np.array(raw_vec, dtype="float32")[None, :]

    # 2. search
    _, idxs = index.search(q_vec, top_k)
    sel = idxs[0]
    context = "\n\n---\n\n".join(chunk_texts[i] for i in sel)

    # 3. call OpenAI ChatCompletion
    system_msg = """
    🔧 Improved System Prompt: Energy Consulting Assistant (Germany, 2025)
    You are an expert assistant…  (keep your full prompt here)
    """
    user_msg = f"CONTEXT:\n{context}\n\nQUESTION:\n{question}"
    resp = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user",   "content": user_msg},
        ],
    )
    return resp.choices[0].message.content.strip()
