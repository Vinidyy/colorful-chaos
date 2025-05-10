import os
import pickle
import numpy as np
import faiss
import openai
from dotenv import load_dotenv
from prepare_embeddings import embed_chunks

# ----------------------------------------
# EDIT THIS PROMPT TO ASK YOUR QUESTION:
USER_PROMPT = """„Ich habe ein älteres Haus und überlege, es nach und nach
energetisch zu modernisieren. In diesem Zusammenhang wurde
mir ein individueller Sanierungsfahrplan empfohlen. Was genau ist
das, wer stellt den aus, und habe ich dadurch irgendwelche
Vorteile, etwa bei der Förderung?“"""
# ----------------------------------------


def main():
    load_dotenv()
    openai.api_key = os.getenv("OPENAI_API_KEY")

    # 1. Load FAISS index + metadata
    script_dir = os.path.dirname(__file__)
    faiss_dir = os.path.join(script_dir, "faiss_index")
    index = faiss.read_index(os.path.join(faiss_dir, "index.faiss"))

    with open(os.path.join(faiss_dir, "chunks.pkl"), "rb") as f:
        # chunks: list of (chunk_id, chunk_text)
        chunks = pickle.load(f)

    chunk_ids, chunk_texts = zip(*chunks)

    # 2. Embed the user question and ensure it's a NumPy array of float32
    raw_vec = embed_chunks([("query", USER_PROMPT)])[0][1]
    q_vec = np.array(raw_vec, dtype="float32")
    q_vec = np.expand_dims(q_vec, axis=0)

    # 3. Search FAISS for top‐K
    top_k = 3
    dists, idxs = index.search(q_vec, top_k)
    sel_idxs = idxs[0]
    selected_ids = [chunk_ids[i] for i in sel_idxs]
    print("Using chunks:", selected_ids)

    context = "\n\n---\n\n".join(chunk_texts[i] for i in sel_idxs)

    # 4. Call ChatCompletion with context + question
    system_msg = (
        """
        🔧 Improved System Prompt: Energy Consulting Assistant (Germany, 2025)
        You are an expert assistant for answering energy consulting questions from homeowners in Germany. Your guidance is grounded in the legal and funding frameworks valid as of May 2025, especially:

        the Gebäudeenergiegesetz (GEG)
        the Bundesförderung für effiziente Gebäude (BEG)
        official resources from BAFA, KfW, Badenova, and certified Energieeffizienz-Experten
        Your goal is to deliver clear, complete, and trustworthy answers that empower users to understand their options and next steps in renovating or replacing heating systems, improving insulation, or applying for subsidies.

        ✅ Always include the following, when relevant:
        Legally required actions (e.g. Austauschpflicht nach §72 GEG, 65%-EE-Vorgabe gemäß §71a GEG)
        Practical recommendations based on energy efficiency, cost-effectiveness, and environmental impact
        Available subsidies, including detailed conditions (e.g. BEG EM Förderquoten, Bonusse, Förderfähigkeit)
        Individuelle Sanierungsfahrpläne (iSFP) where helpful – especially for staged renovations or bonus eligibility
        💬 Answer Style:
        Be factually correct and grounded in regulation or verified sources
        Be concrete – name specific technologies (e.g. Wärmepumpe, Biomasse), Förderquoten, Fristen, Ausnahmen
        Use structured lists or steps when appropriate (e.g. Vorgehensweise in 3 Schritten)
        Use GEG § numbers where applicable
        Avoid generalities like “man sollte überlegen...” if specifics are available
        If something is not eligible for subsidies or legally restricted, say so clearly and tactfully
        🎯 Audience:
        Assume the user is a German homeowner with limited technical knowledge, seeking trustworthy, actionable guidance. They may be overwhelmed by bureaucracy, technical terms, or changing laws. Your tone should be supportive, accurate, and proactive.

        If legal interpretation is ambiguous or case-specific, recommend consulting a certified expert without speculating.
        """
    )
    user_msg = f"CONTEXT:\n{context}\n\nQUESTION:\n{USER_PROMPT}"
    resp = openai.chat.completions.create(
        model="gpt-4o",
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
