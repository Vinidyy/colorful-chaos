import os
import json
from dotenv import load_dotenv
from firecrawl import FirecrawlApp

load_dotenv()  # load .env into os.environ

# read key from environment
api_key = os.getenv("FIRECRAWL_API_KEY")
app = FirecrawlApp(api_key=api_key)

# determine directory of this script
script_dir = os.path.dirname(__file__)

# Load URLs from JSON file
with open(os.path.join(script_dir, 'scrape_links.json'), 'r') as f:
    links = json.load(f)

scraped_data = {}
for url in links:
    # scrape each URL in both markdown and html
    result = app.scrape_url(url, formats=['markdown', 'html'])
    scraped_data[url] = result

# create output folder for markdown files
output_dir = os.path.join(script_dir, 'markdown')
os.makedirs(output_dir, exist_ok=True)

for url, response in scraped_data.items():
    md_content = getattr(response, 'markdown', None)
    if not md_content:
        continue
    # generate a filesystem-safe name
    safe_name = url.replace('https://', '').replace('http://', '').replace('/', '_')
    file_path = os.path.join(output_dir, f"{safe_name}.md")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(md_content)

# scraped_data now holds all results for future chunking
print(scraped_data)
