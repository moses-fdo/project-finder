"""
Training script: prepares lexicon and pattern data for the abusive text classifier.
Hybrid approach: pattern-based sentence-level heuristics + word-level lexicon match.
"""
import re
import joblib
from pathlib import Path
from collections import Counter

# ── 1. Load words.csv as the curated lexicon ──
WORDS_PATH = Path(__file__).parent.parent / "words.csv"
if not WORDS_PATH.exists():
    raise FileNotFoundError(f"words.csv not found at {WORDS_PATH}")

with open(WORDS_PATH, "r", encoding="utf-8") as f:
    raw = f.read().strip().splitlines()

lexicon = {w.strip().lower() for w in raw if w.strip()}
print(f"Loaded {len(lexicon)} words from lexicon")

# ── 2. Build abusive phrase patterns (common multi-word expressions) ──
ABUSIVE_PHRASES = [
    "shut the fuck up",
    "shut your fucking mouth",
    "shut your goddamn mouth",
    "go fuck yourself",
    "go to hell",
    "fuck you",
    "fuck off",
    "fuck this",
    "fuck that",
    "what the fuck",
    "who the fuck",
    "why the fuck",
    "how the fuck",
    "where the fuck",
    "when the fuck",
    "fucking idiot",
    "fucking moron",
    "fucking stupid",
    "fucking dumb",
    "fucking retard",
    "fucking useless",
    "fucking pathetic",
    "fucking waste",
    "fucking shit",
    "fucking asshole",
    "fucking bastard",
    "piece of shit",
    "pile of shit",
    "full of shit",
    "bunch of shit",
    "shitty code",
    "shitty work",
    "shitty idea",
    "suck my dick",
    "suck my cock",
    "kiss my ass",
    "bite me",
    "blow me",
    "up yours",
    "screw you",
    "damn you",
    "bastard",
    "piss off",
    "pissed off",
    "crap code",
    "useless code",
    "garbage code",
    "trash code",
    "horrible code",
    "terrible code",
    "you dumb",
    "you idiot",
    "you moron",
    "you asshole",
    "you bastard",
    "you prick",
    "you dick",
    "your fucking",
    "your shitty",
    "get lost",
    "leave me alone",
    "stop bothering",
    "nobody cares",
    "who cares",
    "don't care",
    "shut up",
    "stupid idiot",
    "dumb ass",
    "dumbass",
    "dickhead",
    "asshole",
    "motherfucker",
    "mother fucker",
    "son of a bitch",
    "fucking crap",
    "fucking joke",
    "fucking disaster",
]

print(f"Loaded {len(ABUSIVE_PHRASES)} abusive phrases")

# ── 3. Save artifacts ──
MODEL_DIR = Path(__file__).parent / "model"
MODEL_DIR.mkdir(exist_ok=True)

# Save lexicon as a list for API use
joblib.dump(list(lexicon), MODEL_DIR / "lexicon.pkl")

# Save abusive phrases
joblib.dump(ABUSIVE_PHRASES, MODEL_DIR / "abusive_phrases.pkl")

print(f"Artifacts saved to {MODEL_DIR}")
print(f"  - lexicon.pkl: {len(lexicon)} words")
print(f"  - abusive_phrases.pkl: {len(ABUSIVE_PHRASES)} phrases")
print("\n✓ Training complete. Ready to start API.")