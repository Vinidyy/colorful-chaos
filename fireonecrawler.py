import os
import json
from datetime import datetime
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

# Load environment variables
load_dotenv()
api_key = os.getenv("FIRECRAWL_API_KEY")

if not api_key:
    raise RuntimeError("❌ FIRECRAWL_API_KEY not found in .env file!")

# Initialize Firecrawl app
app = FirecrawlApp(api_key=api_key)
print(f"✅ Firecrawl API initialized.")

# Load URLs from file
with open("scrape_links.json", "r", encoding="utf-8") as f:
    urls = json.load(f)

if not isinstance(urls, list) or not urls:
    raise ValueError("❌ scrape_links.json must contain a non-empty list of URLs")

print(f"🌐 Loaded {len(urls)} URLs:")
for u in urls:
    print(f"  - {u}")

# Prompt
prompt = (
    "Extract all current energy efficiency programs or subsidies for residential homeowners. "
    "For each program, include:\n"
    "- the name (program_name)\n"
    "- funding percentage or amount (funding_percentage)\n"
    "- who is eligible (eligibility)\n"
    "- deadline (if any)\n"
    "- source URL"
)

# Optional schema
use_schema = True

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

agent_config = {"model": "FIRE-1"}

# Run extraction
print("🔍 Running Firecrawl extraction...")
try:
    if use_schema:
        extract_result = app.extract(
            urls,
            prompt=prompt,
            schema=schema,
            agent=agent_config
        )
    else:
        extract_result = app.extract(
            urls,
            prompt=prompt,
            agent=agent_config
        )
except Exception as e:
    print("❌ Firecrawl extraction failed:", e)
    exit(1)

# Save raw output
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
raw_output_path = f"firecrawl_raw_{timestamp}.json"
with open(raw_output_path, "w", encoding="utf-8") as f:
    f.write(extract_result.model_dump_json(indent=2))

print(f"📄 Saved raw Firecrawl output to: {raw_output_path}")

# Extract programs list properly
programs = extract_result.model_dump().get("data", {}).get("programs", [])

if not programs:
    print("⚠️ No 'programs' found in extract_result['data'].")
    exit(0)

print(f"✅ Extracted {len(programs)} programs.")

# Save structured JSON
structured_output_path = f"firecrawl_extracted_programs_{timestamp}.json"
with open(structured_output_path, "w", encoding="utf-8") as f:
    json.dump(programs, f, indent=2, ensure_ascii=False)

print(f"✅ Saved structured JSON to: {structured_output_path}")

# Generate Markdown report
md_output_path = f"firecrawl_results_{timestamp}.md"

def render_markdown(programs_list):
    sections = []
    for entry in programs_list:
        markdown = f"## Förderung: {entry.get('program_name', 'Unbekannt')}\n"
        if 'funding_percentage' in entry and entry['funding_percentage']:
            markdown += f"- **Höhe**: {entry['funding_percentage']}\n"
        if 'eligibility' in entry and entry['eligibility']:
            markdown += f"- **Zweck / Voraussetzungen**: {entry['eligibility']}\n"
        if 'deadline' in entry and entry['deadline']:
            markdown += f"- **Frist**: {entry['deadline']}\n"
        if 'website' in entry and entry['website']:
            markdown += f"- **Quelle**: [{entry['website']}]({entry['website']})\n"
        markdown += "---\n"
        sections.append(markdown)
    return "\n".join(sections)

md_content = render_markdown(programs)
with open(md_output_path, "w", encoding="utf-8") as f:
    f.write(md_content)

print(f"✅ Markdown report saved to: {md_output_path}")
