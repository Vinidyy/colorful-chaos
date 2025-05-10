import os
import numpy as np
import openai
from dotenv import load_dotenv
from prepare_embeddings import load_markdown_files, split_chunks, embed_chunks

# ----------------------------------------
# EDIT THIS PROMPT TO ASK YOUR QUESTION:
USER_PROMPT = """Ich plane, demnächst meine alte Gasheizung durch ein neues
Heizsystem zu ersetzen. Allerdings ist mir wichtig, dass ich dafür
möglichst viele Fördermittel nutzen kann. Können Sie mir sagen,
welche Heizungsarten aktuell förderfähig sind und ob es
Unterschiede in der Höhe der Förderung gibt?"""
# ----------------------------------------

def main():
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")
    # 1. Load and embed markdown chunks
    script_dir = os.path.dirname(__file__)
    md_folder = os.path.join(script_dir, "markdown")
    docs = load_markdown_files(md_folder)
    chunks = split_chunks(docs)
    embeddings = embed_chunks(chunks)  # List of (chunk_id, vector)
    chunk_texts = [text for _, text in chunks]
    vectors = np.array([vec for _, vec in embeddings])
    # 2. Embed the user question
    query_vec = embed_chunks([("query", USER_PROMPT)])[0][1]
    # 3. Compute similarity and select top‐K chunks
    sims = vectors.dot(np.array(query_vec))
    top_k = 3
    best_idxs = np.argsort(-sims)[:top_k]
    # print selected chunk IDs for transparency
    selected_ids = [chunks[i][0] for i in best_idxs]
    print("Using chunks:", selected_ids)
    context = "\n\n---\n\n".join(chunk_texts[i] for i in best_idxs)
    # 4. Call ChatCompletion with context + question
    system_msg = (
        "You are a helpful assistant. ONLY use the provided CONTEXT from the selected "
        "document excerpts to answer the question; do not rely on external knowledge."
    )
    user_msg = f"CONTEXT:\n{context}\n\nQUESTION:\n{USER_PROMPT}"
    resp = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user", "content": user_msg},
        ],
    )
    answer = resp.choices[0].message.content.strip()
    print("=== ANSWER ===")
    print(answer)

if __name__ == "__main__":
    main()
