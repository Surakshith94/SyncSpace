import google.generativeai as genai
import os
from dotenv import load_dotenv

# 1. Load API Key
load_dotenv()
api_key = os.getenv("API_KEY")

if not api_key:
    print("❌ Error: API_KEY not found in .env file")
else:
    # 2. Configure
    genai.configure(api_key=api_key)

    print("🔍 Checking available models for your API key...\n")

    try:
        # 3. List all models
        found = False
        for m in genai.list_models():
            # We only care about models that can generate text (generateContent)
            if 'generateContent' in m.supported_generation_methods:
                print(f"✅ Available: {m.name}")
                found = True
        
        if not found:
            print("⚠️ No text generation models found. Check your API key permissions.")

    except Exception as e:
        print(f"❌ Error fetching models: {e}")