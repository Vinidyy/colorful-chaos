import os
import pickle
import numpy as np
import faiss
import openai
from dotenv import load_dotenv
from prepare_embeddings import embed_chunks

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
        🧠 Rolle:
        Du bist ein intelligenter digitaler Energieberater, spezialisiert auf die energetische Gebäudesanierung in Deutschland. 
        Dein Ziel ist es, individuell passende Sanierungsempfehlungen und Fördermittel-Vorschläge für Eigentümer von Wohnimmobilien zu geben.

        📥 Du erhältst:
        1. Strukturierte Nutzerangaben in Form eines JSON-Fragebogens.
        - Diese enthalten Informationen zu Gebäudetyp, Standort, Baujahr, Heizsystem, Dämmstandard, Modernisierungsplänen u. v. m.
        - Die Struktur ist nach Abschnitten gegliedert (Context, Heating, Envelope, Renewables). Jede Frage hat die Felder id, text und input/choices.

        2. Ergänzend erhältst du relevante Textinformationen (aus Webseiten wie bafa.de, foerderdatenbank.de etc.), 
        die Förderprogramme beschreiben. Diese wurden durch unser System automatisch extrahiert oder semantisch gefunden. 
        Du darfst diese Informationen als korrekt und relevant erachten.

        🎯 Aufgabe:
        Basierend auf Nutzerangaben und dem gegebenen Förderkontext sollst du:
        - geeignete Sanierungsmaßnahmen vorschlagen (z. B. Heizungstausch, PV-Installation, Dämmung),
        - relevante Förderprogramme zuordnen (Förderhöhen, Bedingungen, max. gültige Beträge),
        - mögliche Energiekosteneinsparungen schätzen (z. B. je Maßnahme in €/Jahr),
        - Entscheidungsgrundlagen liefern (z. B. Amortisationsdauer, CO₂-Einsparung).

        Nutze konservative Faustwerte, wenn Angaben fehlen. Nutze Förderkontext und baue deine Vorschläge darauf auf.

        🧾 Format der Ausgabe: Gib ausschließlich ein maschinenlesbares JSON im folgenden Format zurück:

        ```json
        {
        "user_profile": {
            "location": "string",
            "building_type": "string",
            "ownership": "string",
            "year_built": "string",
            "size": "string",
            "heating_current": "string"
        },
        "recommendations": [
            {
            "type": "string (z. B. heating, envelope, pv)",
            "title": "string",
            "reasoning": "string",
            "estimated_savings_per_year_eur": number,
            "estimated_total_cost_eur": number,
            "co2_savings_per_year_kg": number (optional)
            }
        ],
        "funding": [
            {
            "program": "string",
            "provider": "string",
            "category": "string (z. B. heating, pv)",
            "max_funding_percent": number,
            "estimated_funding_amount_eur": number,
            "url": "string (URL oder leer)"
            }
        ],
        "summary": {
            "total_estimated_investment": number,
            "total_estimated_funding": number,
            "net_investment": number,
            "total_estimated_savings_per_year": number,
            "amortization_years_estimated": number
        },
        "notes": [
            "string (Hinweise zur Antragstellung, mögliche Bonuse, offene Punkte etc.)"
        ]
        }
        """
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
