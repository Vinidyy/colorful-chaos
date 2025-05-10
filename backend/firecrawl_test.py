import json
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="fc-173ed1647c7d42189d4aba885297d4fd")

# Load URLs from JSON file
with open('scrape_links.json', 'r') as f:
    links = json.load(f)

scraped_data = {}
for url in links:
    # scrape each URL in both markdown and html
    result = app.scrape_url(url, formats=['markdown', 'html'])
    scraped_data[url] = result

# scraped_data now holds all results for future chunking
print(scraped_data)

