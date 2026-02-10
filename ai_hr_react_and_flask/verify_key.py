from config import OPENROUTER_API_KEY
import os

if OPENROUTER_API_KEY:
    print(f"SUCCESS: API Key loaded! Length: {len(OPENROUTER_API_KEY)}")
    print(f"Key preview: {OPENROUTER_API_KEY[:5]}...")
else:
    print("FAILURE: API Key is None or Empty")
