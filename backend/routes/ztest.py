import os
from cohere import Client
client = Client(os.getenv("COHERE_API_KEY"))
resp = client.generate(model="command-xlarge-nightly", prompt="Say hello", max_tokens=16)
print(resp.generations[0].text)
