import requests
import json

def call_llm( content: str, model: str = "openai/gpt-4o", role: str = "user") -> str:
  """
  Calls an llm with the provided parameters and returns the response as a string. 
  If the call fails the response will be None.
  """
  response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={
      "Authorization": "Bearer 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",
      "HTTP-Referer": "<YOUR_SITE_URL>", # Optional. Site URL for rankings on openrouter.ai.
      "X-Title": "<YOUR_SITE_NAME>", # Optional. Site title for rankings on openrouter.ai.
    },
    data=json.dumps({
      "model": model, # Optional
      "messages": [
        {
          "role": role,
          "content": content
        }
      ]
    })
  )

  if response.status_code == 200:
      try:
          data = response.json()
          if "choices" in data and data["choices"]:
              content = data["choices"][0]["message"]["content"]
              return content
      except:
          pass