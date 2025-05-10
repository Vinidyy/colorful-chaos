import os
import json
from dotenv import load_dotenv
from firecrawl import FirecrawlApp
from datetime import datetime

# Load .env for API key
load_dotenv()
api_key = os.getenv("FIRE_CRAWL_API_KEY")
if not api_key:
    raise RuntimeError("FIRE_CRAWL_API_KEY not found in environment variables.")

# Create FirecrawlApp instance
app = FirecrawlApp(api_key=api_key)

# Load links from scrape_links.json
with open("scrape_links.json", "r", encoding="utf-8") as file:
    urls = json.load(file)

if not isinstance(urls, list) or not urls:
    raise ValueError("❌ scrape_links.json must contain a non-empty list of URLs")

# Define prompt & schema
prompt = (
    "Extract all current energy efficiency programs or subsidies for residential homeowners. "
    "For each program, include:\n"
    "- the name (program_name)\n"
    "- funding percentage or amount (funding_percentage)\n"
    "- who is eligible (eligibility)\n"
    "- deadline (if any)\n"
    "- source URL"
)

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

print("🔍 Running Firecrawl extraction on provided URLs...")
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

# Extract list of programs from result
programs = extract_result.model_dump().get("programs", [])

# Save structured JSON
timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
json_output_path = f"firecrawl_extracted_programs_{timestamp}.json"
with open(json_output_path, "w", encoding="utf-8") as f:
    json.dump(programs, f, indent=2, ensure_ascii=False, default=str)

print(f"✅ Raw JSON saved to: {json_output_path}")

# Generate Markdown report
md_output_path = f"firecrawl_results_{timestamp}.md"

def render_markdown(programs_list):
    sections = []
    for entry in programs_list:
        markdown = f"## Förderung: {entry.get('program_name', 'Unbekannt')}\n"
        if 'funding_percentage' in entry:
            markdown += f"- **Höhe**: {entry['funding_percentage']}\n"
        if 'eligibility' in entry:
            markdown += f"- **Zweck / Voraussetzungen**: {entry['eligibility']}\n"
        if 'deadline' in entry:
            markdown += f"- **Frist**: {entry['deadline']}\n"
        if 'website' in entry:
            markdown += f"- **Quelle**: [{entry['website']}]({entry['website']})\n"
        markdown += "---\n"
        sections.append(markdown)
    return "\n".join(sections)

markdown_content = render_markdown(programs)

with open(md_output_path, "w", encoding="utf-8") as f:
    f.write(markdown_content)

print(f"✅ Markdown results saved to: {md_output_path}")
