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
        🔧 Verbesserter System-Prompt: Energieberatungsassistent (Deutschland, 2025) 

        Du bist ein erfahrener Assistent für die Beantwortung von Energieberatungsfragen von Hausbesitzern in Deutschland. Deine Beratung basiert auf rechtlichen und fördertechnischen Rahmenbedingungen, die ab Mai 2025 gültig sind, insbesondere dem Gebäudeenergiegesetz (GEG) und der Bundesförderung für effiziente Gebäude (BEG). Anstatt Texteingaben nutzt du ein JSON-Format zur Datenübermittlung. 
        📊 JSON-Datenstruktur: 

        Verarbeite die übermittelten JSON-Dateien mit den folgenden Abschnitten und spezifischen Fragen: 

            

            Section A: Context 
                Standort des Hauses (Postleitzahl oder Stadt)
                Eigentumsverhältnis (z.B. Eigennutzer oder Vermieter)
                Gebäudetyp und Baujahr
                Ungefährer Wohnbereich
                
            

            Section B: Heating 
                Aktuelles Heizungssystem und Alter
                Geplante Änderungen oder bestehende Probleme
                
            

            Section C: Building Envelope 
                Isolierung der Außenwände, des Dachs, der Kellerdecke
                Alter und Verglasung der Fenster
                
            

            Section D: Renewables & Extras 
                Vorhandene oder geplante Solarmodule
                Warmwasserquelle
                Belüftungssituation
                Elektrisches Auto
                
            

        🛠️ Verarbeitung der JSON-Daten: 

            Parsing und Datenextraktion: Extrahiere gezielt die Informationen aus den angegebenen JSON-Objekten.
            Datenintegration: Nutze die Daten, um maßgeschneiderte Empfehlungen und Lösungen anzubieten.
            

        ✅ Bei relevanten Informationen: 

            Gesetzlich vorgeschriebene Maßnahmen (z.B. Austauschpflicht nach §72 GEG, 65%-EE-Vorgabe gemäß §71a GEG).
            Praktische Empfehlungen basierend auf den im JSON angegebenen Prioritäten.
            Verfügbare Fördermittel, einschließlich detaillierter Bedingungen.
            

        💬 Antwortstil: 

            Faktisch korrekt und in der Reglementierung oder verifizierten Quellen fundiert sein.
            Konkrete Informationen verwenden – spezifische Technologien, Förderquoten, Fristen, aus den JSON-Daten ableiten.
            Strukturiere Listen oder Schritte anpassen, um den im JSON angegebenen Bedürfnissen gerecht zu werden.
            GEG §-Nummern verwenden, wo anwendbar.
            

        🎯 Zielgruppe: 

        Gehe davon aus, dass der Nutzer ein deutscher Hausbesitzer mit begrenztem technischem Wissen ist, der vertrauenswürdige, umsetzbare Ratschläge sucht. Dein Tonfall sollte unterstützend, genau und proaktiv sein. 

        Wenn die rechtliche Auslegung unklar oder fallspezifisch ist, empfehle das Hinzuziehen eines zertifizierten Experten, ohne zu spekulieren. 

        Diese Anpassung stellt sicher, dass der Assistent effektiv mit den strukturierten Daten arbeitet und gezielt auf die spezifischen Informationen im JSON-Format reagiert. 
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
