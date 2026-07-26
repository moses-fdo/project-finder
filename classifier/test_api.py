"""Quick test of the classifier API."""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

test_cases = [
    ("Hello team, great work on the project!", False),
    ("You are a fucking idiot, fix this shit.", True),
    ("Let's collaborate on the design doc.", False),
    ("Go fuck yourself you worthless prick.", True),
    ("I appreciate your contribution to this repo.", False),
    ("This code is ass, rewrite it entirely.", True),
    ("The meeting is at 3pm tomorrow.", False),
    ("Shut the fuck up and listen.", True),
    ("Thanks for the quick response.", False),
]

print("Testing classifier API...")
print("=" * 70)

for text, expected in test_cases:
    try:
        resp = requests.post(
            f"{BASE_URL}/classify",
            json={"text": text},
            timeout=3
        )
        result = resp.json()
        
        abusive = result.get("abusive", False)
        flagged = result.get("flagged_words", [])
        conf = result.get("confidence", 0)
        
        match = "PASS" if abusive == expected else "FAIL"
        print(f"{match} [conf={conf:.2%}] abusive={abusive}")
        print(f"   Text: {text[:70]}")
        if flagged:
            print(f"   Flagged: {', '.join(flagged)}")
        print()
    except Exception as e:
        print(f"ERROR: {e}")
        print(f"   Text: {text[:70]}")
        print()

print("=" * 70)
print("Test complete!")