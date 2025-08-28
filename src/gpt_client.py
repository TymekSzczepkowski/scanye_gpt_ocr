import base64
import json
from pathlib import Path
from typing import Dict, Any, List
import openai
from pdf2image import convert_from_path
from . import config

PROMPT_TEXT = (
    "Odczytaj dane z załączonej faktury. Zwróć odpowiedź wyłącznie w formacie JSON, "
    "bez żadnych dodatkowych komentarzy, markdownu (```json) ani wyjaśnień. "
    "Struktura JSON musi być następująca (użyj null, jeśli wartość jest nieobecna):\n"
    "{\n"
    '  "numer_faktury": "string",\n'
    '  "data_wystawienia": "YYYY-MM-DD",\n'
    '  "data_dostawy": "YYYY-MM-DD",\n'
    '  "termin_platnosci": "YYYY-MM-DD",\n'
    '  "nip_sprzedawcy": "string",\n'
    '  "nip_nabywcy": "string",\n'
    '  "waluta": "string",\n'
    '  "pozycje_vat": [\n'
    '    {"stawka": "string", "netto": float, "vat": float, "brutto": float}\n'
    "  ]\n"
    "}\n"
    "Jeśli data dostawy lub termin płatności nie są jawnie podane, użyj daty wystawienia."
)

class GptOcrClient:
    """Klient do odczytu danych z faktur przy użyciu GPT-4o."""
    def __init__(self):
        if not config.OPENAI_API_KEY:
            raise ValueError("Brak klucza OPENAI_API_KEY.")
        self.client = openai.OpenAI(api_key=config.OPENAI_API_KEY)

    def _file_to_base64(self, file_path: Path) -> str:
        """Konwertuje plik obrazu do formatu base64."""
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _pdf_to_images(self, pdf_path: Path) -> List[Path]:
        """Konwertuje plik PDF na listę obrazów."""
        poppler = config.POPPLER_PATH if config.POPPLER_PATH else None
        pages = convert_from_path(pdf_path, poppler_path=poppler)
        
        image_paths = []
        for i, page in enumerate(pages):
            image_path = pdf_path.with_suffix(f".page_{i+1}.png")
            page.save(image_path, "PNG")
            image_paths.append(image_path)
        return image_paths

    def extract_invoice_data(self, file_path: Path) -> Dict[str, Any]:
        """Główna funkcja: przetwarza plik (PDF/obraz) i wyciąga dane za pomocą GPT."""
        if not file_path.exists():
            raise FileNotFoundError(f"Plik nie istnieje: {file_path}")

        images: List[Path] = []
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            images = self._pdf_to_images(file_path)
        elif suffix in (".jpg", ".jpeg", ".png"):
            images = [file_path]
        else:
            raise ValueError("Nieobsługiwany format pliku. Użyj PDF, JPG, JPEG lub PNG.")
        
        content = [{"type": "text", "text": PROMPT_TEXT}]
        for img_path in images:
            b64_image = self._file_to_base64(img_path)
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64_image}"}
            })

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": content}],
                temperature=0.0,
                response_format={"type": "json_object"}
            )
            raw_json = response.choices[0].message.content or "{}"
            return json.loads(raw_json)
        
        except Exception as e:
            print(f"Błąd podczas wywołania API OpenAI: {e}")
            raise