from call_llm import call_llm


def scrape(url: str) -> str:
    with open('test.txt', 'r') as file:
        website: str = file.read()
    summary: str = call_llm(f"""Give me the keyfacts of the following website {website}""")

    fact: str = call_llm(f"""i want to renovate my home and have a 28 years old central heating working with oil, what do i have to take care of, use the following as reference {summary}""")
    return fact

if __name__ == "__main__":
    result: str = scrape("test")
    print(result)