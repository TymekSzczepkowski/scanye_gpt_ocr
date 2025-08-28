
import os
from pathlib import Path
from dotenv import load_dotenv

# Ścieżka bazowa projektu (dwa poziomy wyżej od tego pliku)
BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")

# Klucze API
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SCANYE_API_KEY = os.getenv("SCANYE_API_KEY")

# Ścieżki
POPPLER_PATH = os.getenv("POPPLER_PATH")
TMP_DIR = BASE_DIR / "data" / "tmp"
OUT_DIR = BASE_DIR / "data" / "out"

# Ustawienia API
SCANYE_API_BASE_URL = "https://api.scanye.pl"

# Zapewnienie, że katalogi istnieją
TMP_DIR.mkdir(parents=True, exist_ok=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Sprawdzenie, czy klucze API są ustawione
if not OPENAI_API_KEY or not SCANYE_API_KEY:
    raise ValueError("Klucze OPENAI_API_KEY i SCANYE_API_KEY muszą być ustawione w pliku .env")