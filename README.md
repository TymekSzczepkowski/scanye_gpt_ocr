## Funkcjonalności

- Pobiera oczekujące dokumenty z API Scanye.
- Pobiera oryginalny plik faktury (PDF, JPG, PNG).
- Odczytuje dane z faktury przy użyciu Scanye API.
- Odczytuje dane z tego samego pliku przy użyciu GPT-4o Vision.
- Wyświetla czytelne porównanie wyników obu systemów OCR.
- (Opcjonalnie) Aktualizuje dane faktury w Scanye na podstawie wyników z GPT-4o.

## Setup

1.  **Sklonuj repozytorium:**

    ```bash
    git clone <twoje-repozytorium>
    cd scanye_gpt_ocr
    ```

2.  **Stwórz i aktywuj wirtualne środowisko:**

    ```bash
    python -m venv venv
    Set-ExecutionPolicy RemoteSigned -Scope Process
    .\venv\Scripts\activate
    ```

3.  **Zainstaluj zależności:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Skonfiguruj Poppler (dla PDF):**
    Projekt używa `pdf2image` do obsługi plików PDF, co wymaga zainstalowanego `poppler`. Upewnij się, że jest on dostępny w ścieżce systemowej (PATH) lub podaj bezpośrednią ścieżkę w pliku `.env`.

5.  **Skonfiguruj zmienne środowiskowe:**
    Stwórz plik `.env` w głównym katalogu projektu, kopiując zawartość z `.env.example` i uzupełniając go swoimi kluczami API:
    ```ini
    OPENAI_API_KEY="sk-..."
    SCANYE_API_KEY="Scanye ...."
    POPPLER_PATH="C:/path/to/poppler/bin" # Opcjonalne
    ```

## Użycie

Główny skrypt `main.py` jest punktem wejściowym. Przed uruchomieniem, ustaw `CLIENT_NAME` i `FILE_TO_PROCESS` wewnątrz pliku `src/main.py`.

```bash
python -m src.main
```
