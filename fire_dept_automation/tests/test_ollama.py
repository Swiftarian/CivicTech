import requests
import json

payload = {
    'model': 'llama3',
    'prompt': 'Reply only JSON: {"test": true}',
    'stream': False
}

response = requests.post('http://localhost:11434/api/generate', json=payload, timeout=30)
print(json.dumps(response.json(), indent=2, ensure_ascii=False))
