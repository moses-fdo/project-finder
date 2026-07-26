@echo off
echo ===========================================
echo  Abusive Text Classifier - Python Microservice
echo ===========================================
echo.

cd /d "%~dp0"

REM Check if model exists
if not exist "model\lexicon.pkl" (
    echo [1/2] Training model...
    python train.py
    echo.
) else (
    echo [SKIP] Model already trained.
)

echo [2/2] Starting FastAPI server on http://127.0.0.1:8000
echo.
uvicorn api:app --host 127.0.0.1 --port 8000 --reload