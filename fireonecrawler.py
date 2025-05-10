import os
import json
from dotenv import load_dotenv
from firecrawl import FirecrawlApp


load_dotenv()

# 🔐 Load API key (ensure you set FIRE_CRAWL_API_KEY in your environment)
api_key = os.getenv("FIRE_CRAWL_API_KEY")
if not api_key:
    raise RuntimeError("⚠️ FIRE_CRAWL_API_KEY not found in environment.")

# 🔥 Connect to Firecrawl agent
app = FirecrawlApp(api_key=api_key)

# 🌍 List of domains to crawl
urls = [
    "bafa.de",
    "kfw.de",
    "foerderdatenbank.de"
    # Add more URLs if needed
]

# 🧠 Define the extraction task and expected schema
prompt = "Extract all current energy efficiency programs for residential homeowners, including subsidy names, funding rates, conditions, and deadlines."

schema = {
    "type": "object",
    "properties": {
        "programs": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "program_name": {"type": "string"},
                    "funding_percentage": {"type": "string"},
                    "eligibility": {"type": "string"},
                    "deadline": {"type": "string"},
                    "website": {"type": "string"}
                },
                "required": ["program_name", "website"]
            }
        }
    },
    "required": ["programs"]
}

agent_config = {
    "model": "FIRE-1"
}

# 🚀 Run the Firecrawl Job
print("🔍 Running Firecrawl extraction across given websites...")

try:
    extract_result = app.extract(
        urls,
        prompt=prompt,
        schema=schema,
        agent=agent_config
    )
except Exception as e:
    print("❌ Extraction failed:", e)
    exit(1)

# 💾 Save results to file
output_file = "firecrawl_programs_result.json"
with open(output_file, "w", encoding="utf-8") as f:

    json.dump(extract_result.model_dump(), f, indent=2, ensure_ascii=False, default=str)

print(f"✅ Extraction complete. Results saved to: {output_file}")
