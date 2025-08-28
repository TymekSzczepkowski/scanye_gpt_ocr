import json
from . import config
from .scanye_client import ScanyeAPIClient
from .gpt_client import GptOcrClient
from .utils import pick_document_attribute, build_update_payload, print_comparison

# --- USTAWIENIA ---
CLIENT_NAME = "EMTRIBUTUM SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ"
FILE_TO_PROCESS = "Faktura_123.pdf"  # Zmień na nazwę pliku, który chcesz przetworzyć
DRY_RUN = True  # Ustaw na False, aby wysłać aktualizację do Scanye
# --------------------

def run_ocr_process():
    """Główna funkcja orkiestrująca cały proces."""
    # 1. Inicjalizacja klientów API
    scanye_client = ScanyeAPIClient()
    gpt_client = GptOcrClient()
    print("✅ Klienci API zainicjalizowani.")

    # 2. Znajdź ID klienta w Scanye
    client_id = scanye_client.get_client_id_by_name(CLIENT_NAME)
    if not client_id:
        print(f"❌ Nie znaleziono klienta o nazwie: {CLIENT_NAME}")
        return
    print(f"✅ Znaleziono klienta: {CLIENT_NAME} (ID: {client_id})")

 # 3. Znajdź dokument do przetworzenia
    print("🔍 Przeszukuję listę oczekujących dokumentów w Scanye...")
    pending_docs = scanye_client.list_pending_docs(client_id)
    target_doc = None

    # --- DEBUG ---
    if not pending_docs:
        print("⚠️  DEBUG: Otrzymano pustą listę dokumentów od Scanye. Sprawdź, czy pliki na pewno są w 'Odebranych'.")
    else:
        print(f"📄 DEBUG: Znaleziono {len(pending_docs)} dokumentów na liście. Rozpoczynam sprawdzanie nazw...")
    
    all_found_filenames = [] # Lista do przechowania wszystkich znalezionych nazw plików
    # --- DEBUG ---

    for i, doc in enumerate(pending_docs):
        # --- Szukamy nazwy pliku w doc['data']['name'] ---
        filename = None
        if isinstance(doc.get('data'), dict):
            # Używamy .get() dla bezpieczeństwa, na wypadek gdyby 'name' nie istniało
            filename = doc['data'].get('name')
        # --- KONIEC POPRAWKI ---

        # --- DODANY DEBUGGING ---
        if filename:
            all_found_filenames.append(filename)
            print(f"  - Sprawdzam plik #{i+1}: '{filename}'")
        # --- KONIEC DEBUGGINGU ---
            
        if filename and FILE_TO_PROCESS.lower() in filename.lower():
            target_doc = doc
            print(f"✅ Znaleziono pasujący dokument: '{filename}'")
            break
    
    if not target_doc:
        print(f"❌ Nie znaleziono pliku '{FILE_TO_PROCESS}' na liście oczekujących dokumentów.")
        
        # --- DEBUG ---
        if all_found_filenames:
            print("\n--- DEBUG: Dostępne pliki znalezione w Scanye ---")
            for fname in all_found_filenames:
                print(f"  - {fname}")
            print("\nPorównaj dokładnie powyższe nazwy z nazwą wpisaną w FILE_TO_PROCESS.")
            print("Pamiętaj, że skrypt sprawdza, czy nazwa z FILE_TO_PROCESS zawiera się w nazwie pliku.")
        else:
            print("--- DEBUG: Na liście oczekujących nie znaleziono żadnych dokumentów, które miałyby nazwę pliku. ---")
        # --- DEBUG ---
        return
    
    invoice_id = pick_document_attribute(target_doc, ["id", "invoiceId", "documentId"])
    filename = pick_document_attribute(target_doc, ["originalFilename", "fileName"])
    print(f"📄 Wybrano dokument: {filename} (ID: {invoice_id})")

    # 4. Pobierz plik i dane z Scanye
    try:
        file_content = scanye_client.download_invoice_file(invoice_id)
        local_path = config.TMP_DIR / filename
        local_path.write_bytes(file_content)
        print(f"⬇️  Plik został pobrany i zapisany w: {local_path}")

        scanye_data = scanye_client.get_invoice_data(invoice_id)
        print("📊 Pobrano istniejące dane OCR ze Scanye.")
    except (RuntimeError, Exception) as e:
        print(f"❌ Wystąpił błąd podczas pobierania danych ze Scanye: {e}")
        return

    # 5. Przetwórz plik za pomocą GPT-4o
    try:
        print("🤖 Rozpoczynam przetwarzanie OCR za pomocą GPT-4o...")
        gpt_data = gpt_client.extract_invoice_data(local_path)
        print("✨ Otrzymano dane z GPT-4o.")
    except (FileNotFoundError, ValueError, Exception) as e:
        print(f"❌ Błąd podczas przetwarzania pliku przez GPT: {e}")
        return
        
    # 6. Porównaj wyniki
    print_comparison(scanye_data, gpt_data)
    
    # 7. Zbuduj i (opcjonalnie) wyślij payload
    update_payload = build_update_payload(gpt_data)
    print("📦 Przygotowany payload do aktualizacji w Scanye:")
    print(json.dumps(update_payload, ensure_ascii=False, indent=2))

    if DRY_RUN:
        print("\nℹ️  Tryb 'dry-run' jest aktywny. Dane nie zostały wysłane do Scanye.")
        print("   Aby wysłać aktualizację, zmień flagę DRY_RUN na False w main.py.")
    else:
        print("\n🚀 Wysyłanie aktualizacji do Scanye...")
        try:
            response = scanye_client.update_invoice(invoice_id, update_payload)
            print(f"✅ Aktualizacja zakończona sukcesem! Status: {response.status_code}")
            print(f"   Odpowiedź: {response.text[:200]}")
        except Exception as e:
            print(f"❌ Błąd podczas aktualizacji faktury w Scanye: {e}")

if __name__ == "__main__":
    run_ocr_process()