if mode == "json":
        system_msg = """
        JSON Output Mode System Prompt:
        Bitte liefere ausschließlich eine JSON-Antwort gemäß dem definierten Schema.
        """
        # call Responses API for structured output
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
                        # your JSON schema here
                        "additionalProperties": False    # added
                    }
                }
            }
        )