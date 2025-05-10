import os
import pickle
import numpy as np
import faiss
import openai
from dotenv import load_dotenv
from prepare_embeddings import embed_chunks
import argparse
import json  # added

# ----------------------------------------
# EDIT THIS PROMPT TO ASK YOUR QUESTION:
USER_PROMPT = """„Ich habe ein älteres Haus und überlege, es nach und nach
energetisch zu modernisieren. In diesem Zusammenhang wurde
mir ein individueller Sanierungsfahrplan empfohlen. Was genau ist
das, wer stellt den aus, und habe ich dadurch irgendwelche
Vorteile, etwa bei der Förderung?“"""
# ----------------------------------------

# load .env + API key
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# load FAISS index + chunk metadata once
script_dir = os.path.dirname(__file__)
faiss_dir = os.path.join(script_dir, "faiss_index")
index = faiss.read_index(os.path.join(faiss_dir, "index.faiss"))
with open(os.path.join(faiss_dir, "chunks.pkl"), "rb") as f:
    chunks = pickle.load(f)
chunk_ids, chunk_texts = zip(*chunks)

# replace main logic with reusable query()
def query(question: str, top_k: int = 3, mode: str = "json") -> str:
    # embed question
    raw_vec = embed_chunks([("query", question)])[0][1]
    q_vec = np.array(raw_vec, dtype="float32")[None, :]
    # retrieve top-K
    _, idxs = index.search(q_vec, top_k)
    sel = idxs[0]
    context = "\n\n---\n\n".join(chunk_texts[i] for i in sel)

    # prepare user message
    user_msg = f"CONTEXT:\n{context}\n\nQUESTION:\n{question}"

    if mode == "json":
        # enforce static JSON-only output via Responses API and JSON Schema
        system_msg = (
            """
            You are an AI assistant built as a tailored Energy Advisor for a hackathon challenge. Your role is to interpret homeowner questionnaire responses, map them to personalized energy-saving measures (including cost estimates and funding options), determine eligibility for subsidies and incentives, and output clear, actionable recommendations. This is the very first instance evaluating the results of this general questionnaire.
            {
            "surveyStructure": {
                "sections": [
                {
                    "id": "A",
                    "title": "Home Details",
                    "questions": [
                    {
                        "id": "1",
                        "text": "Do you own and live in the home?",
                        "choices": [
                        "Yes, owner-occupier",
                        "Yes, but I rent it out",
                        "I’m a tenant",
                        "I’m about to buy / inherit"
                        ]
                    },
                    {
                        "id": "2",
                        "text": "Which type best describes the building?",
                        "choices": [
                        "Detached / single-family",
                        "Semi / row house",
                        "Apartment in multi-family",
                        "Other"
                        ]
                    },
                    {
                        "id": "3",
                        "text": "About when was it built?",
                        "choices": [
                        "Before 1978",
                        "1978–1995",
                        "1996–2009",
                        "2010–2020",
                        "After 2020",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "4",
                        "text": "Approximate living area?",
                        "choices": [
                        "< 50 m²",
                        "50–100 m²",
                        "100–150 m²",
                        "150–250 m²",
                        "> 250 m²",
                        "Not sure"
                        ]
                    }
                    ]
                },
                {
                    "id": "B",
                    "title": "Heating System",
                    "questions": [
                    {
                        "id": "5",
                        "text": "What heats your home today?",
                        "choices": [
                        "Gas boiler",
                        "Oil boiler",
                        "District heat",
                        "Heat pump",
                        "Wood / pellets",
                        "Electric night-storage / direct",
                        "Other / don’t know"
                        ]
                    },
                    {
                        "id": "6",
                        "text": "How old is that system (roughly)?",
                        "choices": [
                        "> 30 years",
                        "20–30 y",
                        "10–20 y",
                        "< 10 y",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "7",
                        "text": "Any plans or problems with the heater?",
                        "choices": [
                        "Works but expensive",
                        "Planning to replace soon",
                        "Just exploring",
                        "Recently replaced / fine"
                        ]
                    }
                    ]
                },
                {
                    "id": "C",
                    "title": "Building Envelope",
                    "questions": [
                    {
                        "id": "8",
                        "text": "Exterior walls insulation?",
                        "choices": [
                        "None / original",
                        "Some retrofit",
                        "Well insulated (modern)",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "9",
                        "text": "Roof / top-floor insulation?",
                        "choices": [
                        "None / thin",
                        "Some",
                        "Well insulated",
                        "Flat roof / N/A",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "10",
                        "text": "Basement ceiling under living area?",
                        "choices": [
                        "Uninsulated",
                        "Already insulated",
                        "No basement / slab",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "11",
                        "text": "Windows age & glazing?",
                        "choices": [
                        "Single-glazed / pre-1990",
                        "Double-glazed 90s",
                        "Modern double / triple",
                        "Mixed",
                        "Not sure"
                        ]
                    }
                    ]
                },
                {
                    "id": "D",
                    "title": "Renewable & EV",
                    "questions": [
                    {
                        "id": "12",
                        "text": "Solar panels (PV)?",
                        "choices": [
                        "Already installed",
                        "No—but interested",
                        "No—not interested / roof unsuitable"
                        ]
                    },
                    {
                        "id": "13",
                        "text": "Hot-water source?",
                        "choices": [
                        "Same boiler",
                        "Electric boiler / instant",
                        "Solar-thermal panels",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "14",
                        "text": "Ventilation situation?",
                        "choices": [
                        "No mech. ventilation",
                        "Heat-recovery system present",
                        "Some fans / extractors",
                        "Problems with damp / mold",
                        "Not sure"
                        ]
                    },
                    {
                        "id": "15",
                        "text": "Electric car now or planned?",
                        "choices": [
                        "Already have EV",
                        "Planning to buy",
                        "No plans"
                        ]
                    }
                    ]
                }
                ]
            },
            "surveyResponses": {
                "A": {
                "1": "Yes, owner-occupier",
                "2": "Semi / row house",
                "3": "Before 1978",
                "4": "50–100 m²"
                },
                "B": {
                "5": "District heat",
                "6": "> 30 years",
                "7": "Planning to replace soon"
                },
                "C": {
                "8": "None / original",
                "9": "Well insulated",
                "10": "Uninsulated",
                "11": "Double-glazed 90s"
                },
                "D": {
                "12": "Already installed",
                "13": "Electric boiler / instant",
                "14": "No mech. ventilation",
                "15": "Already have EV"
                }
            }
            }
            """
        )

        resp = openai.responses.create(
            model="gpt-4o-2024-08-06",
            input=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "structured_response",
                    "strict": True,
                    "schema": {
                        "type": "object",
                        "properties": {
                            "suggestions": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title": {"type": "string"},
                                        "cost":  {"type": "string"},
                                        "icon": {
                                            "type": "string",
                                            "enum": ["home", "radiator", "insulation", "solar"]
                                        }
                                    },
                                    "required": ["title", "cost", "icon"],
                                    "additionalProperties": False
                                }
                            },
                            "subsidies": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "program":     {"type": "string"},
                                        "amount":      {"type": "string"},
                                        "description": {"type": "string"}
                                    },
                                    "required": ["program", "amount", "description"],
                                    "additionalProperties": False
                                }
                            },
                            "legalImplications": {
                                "type": "array",
                                "items": {
                                    "type": "object",
                                    "properties": {
                                        "title":       {"type": "string"},
                                        "description": {"type": "string"}
                                    },
                                    "required": ["title", "description"],
                                    "additionalProperties": False
                                }
                            }
                        },
                        "required": ["suggestions", "subsidies", "legalImplications"],
                        "additionalProperties": False
                    }
                }
            }
        )
        # Responses API returns the structured JSON as `resp.output_text`
        return resp.output_text

    else:
        system_msg = """
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
        resp = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": user_msg},
            ],
        )
        return resp.choices[0].message.content.strip()

# CLI entrypoint
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["json","normal"], default="normal",
                        help="Choose 'json' for JSON-only output or 'normal' for freeform chat.")
    args = parser.parse_args()

    answer = query(USER_PROMPT, mode=args.mode)
    print("=== ANSWER ===")
    print(answer)

if __name__ == "__main__":
    main()
