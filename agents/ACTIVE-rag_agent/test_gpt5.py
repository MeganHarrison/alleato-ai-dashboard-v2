#!/usr/bin/env python3
"""
Test script to check if GPT-5 streaming is available after organization verification.
"""

import openai
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_gpt5_access():
    """Test GPT-5 model access with both streaming and non-streaming."""
    
    client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    print(f"Testing GPT-5 access at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("-" * 50)
    
    # Test 1: Non-streaming
    try:
        response = client.chat.completions.create(
            model='gpt-5',
            messages=[{'role': 'user', 'content': 'What is 2+2?'}],
            stream=False,
            max_completion_tokens=50
        )
        print("✅ Non-streaming: SUCCESS")
        print(f"   Response: {response.choices[0].message.content}")
    except Exception as e:
        print(f"❌ Non-streaming: FAILED - {e}")
    
    # Test 2: Streaming
    try:
        stream = client.chat.completions.create(
            model='gpt-5',
            messages=[{'role': 'user', 'content': 'What is 3+3?'}],
            stream=True,
            max_completion_tokens=50
        )
        
        print("✅ Streaming: SUCCESS")
        print("   Response: ", end='')
        for chunk in stream:
            if chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end='')
        print()
    except Exception as e:
        if "verified" in str(e):
            print(f"⏳ Streaming: WAITING FOR VERIFICATION (can take up to 15 minutes)")
        else:
            print(f"❌ Streaming: FAILED - {e}")
    
    print("-" * 50)
    print("\nOnce both tests pass, GPT-5 is fully available for your RAG agent!")

if __name__ == "__main__":
    test_gpt5_access()