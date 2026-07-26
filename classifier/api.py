"""
FastAPI microservice for abusive text detection.
Hybrid approach: pattern-based sentence-level heuristics + word-level lexicon check.
Designed for real-time, synchronous use (lightning fast, no GPU needed).
"""
import re
import joblib
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Abusive Text Classifier")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load artifacts ──
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "model"

try:
    lexicon = set(joblib.load(MODEL_DIR / "lexicon.pkl"))
    abusive_phrases = joblib.load(MODEL_DIR / "abusive_phrases.pkl")
    print(f"Loaded {len(lexicon)} lexicon words, {len(abusive_phrases)} abusive phrases")
except FileNotFoundError:
    print("WARNING: Model artifacts not found. Run train.py first. Using words.csv fallback.")
    words_path = BASE_DIR.parent / "words.csv"
    lic = set()
    if words_path.exists():
        with open(words_path, "r", encoding="utf-8") as f:
            lic = {w.strip().lower() for w in f.read().strip().splitlines() if w.strip()}
    lexicon = lic
    abusive_phrases = []


class ClassifyRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)

class ClassifyResponse(BaseModel):
    abusive: bool
    flagged_words: list[str] = Field(default_factory=list)
    confidence: float = 0.0


def find_flagged_words(text: str) -> list[str]:
    """
    Find ALL words in text that appear in the lexicon.
    Uses whole-word matching (regex word boundary) case-insensitively.
    Returns up to 10 matches, ordered by position in text.
    """
    text_lower = text.lower()
    found = []
    seen = set()
    
    for word in sorted(lexicon, key=len, reverse=True):  # longer words first (more specific)
        if len(word) < 2 or word in seen:
            continue
        pattern = re.compile(r'\b' + re.escape(word) + r'\b', re.IGNORECASE)
        if pattern.search(text_lower):
            found.append(word)
            seen.add(word)
        if len(found) >= 10:
            break
    return found


def check_abusive_phrases(text: str) -> tuple[bool, list[str]]:
    """Check for multi-word abusive phrases in text."""
    text_lower = text.lower()
    found = []
    for phrase in abusive_phrases:
        if phrase in text_lower:
            found.append(phrase)
    return len(found) > 0, found


def compute_abusive_score(text: str) -> float:
    """
    Compute a continuous abuse score 0.0-1.0 based on:
    - Ratio of abusive words to total words
    - Presence of abusive phrases
    - Aggressive punctuation/emphasis
    """
    tokens = re.findall(r'\b\w+\b', text.lower())
    if not tokens:
        return 0.0
    
    total_words = len(tokens)
    if total_words == 0:
        return 0.0
    
    # Count abusive token matches
    abusive_count = sum(1 for t in tokens if t in lexicon)
    abusive_ratio = abusive_count / total_words
    
    # Bonus for abusive phrases
    phrase_hits = sum(1 for p in abusive_phrases if p in text.lower())
    phrase_score = min(phrase_hits * 0.2, 0.4)  # each phrase adds 0.2 up to 0.4 max
    
    # Bonus for aggressive punctuation (multiple !! or ??)
    aggressive_punct = "!!" in text or "??" in text
    punct_boost = 0.1 if aggressive_punct else 0.0
    
    # ALL CAPS words (shouting)
    caps_ratio = sum(1 for t in tokens if t.isupper() and len(t) > 2) / total_words
    caps_boost = min(caps_ratio * 0.3, 0.15)
    
    # Weighted score
    score = abusive_ratio + phrase_score + punct_boost + caps_boost
    
    # Bonus: if ANY abusive phrase found, boost significantly
    if phrase_hits > 0:
        score = max(score, 0.65)
    
    return min(score, 0.99)


@app.post("/classify", response_model=ClassifyResponse)
async def classify(request: ClassifyRequest):
    """
    Classify a message as abusive or not.
    Returns the specific flagged words for the popup UI.
    """
    text = request.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # Step 1: Word-level match — find specific offending words
    flagged_words = find_flagged_words(text)
    
    # Step 2: Check for abusive multi-word phrases
    has_phrase, matched_phrases = check_abusive_phrases(text)
    
    # Step 3: Compute continuous abuse score
    score = compute_abusive_score(text)
    
    # Decision logic:
    # - Abusive if score > threshold OR any abusive phrase found
    # - Always abusive if flagged words exist (lexicon match)
    # - But require a minimum threshold to avoid trivial false positives
    THRESHOLD = 0.14
    MIN_WORDS_FOR_FLAG = 1  # at least this many flagged words to be sure
    
    is_abusive = False
    confidence = 0.0
    
    if has_phrase:
        is_abusive = True
        confidence = max(0.75, score)
    elif len(flagged_words) >= MIN_WORDS_FOR_FLAG and score >= THRESHOLD:
        is_abusive = True
        confidence = score
    elif len(flagged_words) >= 2:  # multiple flagged words is a strong signal
        is_abusive = True
        confidence = max(score, 0.5)
    elif score >= 0.3:
        is_abusive = True
        confidence = score
    
    # Include matched phrases as flagged too (for detailed popup)
    all_flagged = flagged_words + [f"'{p}'" for p in matched_phrases if p not in flagged_words]
    # Deduplicate while preserving order
    seen = set()
    unique_flagged = []
    for w in all_flagged:
        if w not in seen:
            seen.add(w)
            unique_flagged.append(w)

    return ClassifyResponse(
        abusive=is_abusive,
        flagged_words=unique_flagged[:10],  # cap at 10
        confidence=round(confidence, 4),
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "lexicon_size": len(lexicon),
        "phrases_count": len(abusive_phrases),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)