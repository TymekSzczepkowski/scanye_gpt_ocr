import requests
from typing import Optional, Dict, Any, List
from urllib.parse import urlencode
from . import config

class ScanyeAPIClient:
    """Klient do obsługi API Scanye."""
    def __init__(self):
        if not config.SCANYE_API_KEY:
            raise ValueError("Brak klucza SCANYE_API_KEY.")
        
        self.base_url = config.SCANYE_API_BASE_URL
        self.headers = {
            "Authorization": config.SCANYE_API_KEY,
            "Accept": "application/json"
        }
        self.json_headers = {**self.headers, "Content-Type": "application/json"}

    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Prywatna metoda do wykonywania zapytań HTTP."""
        url = f"{self.base_url}{endpoint}"
        try:
            response = requests.request(method, url, headers=self.headers, timeout=60, **kwargs)
            response.raise_for_status()
            return response
        except requests.exceptions.RequestException as e:
            print(f"Błąd API Scanye ({url}): {e}")
            if e.response is not None:
                print(f"Odpowiedź serwera: {e.response.text[:200]}")
            raise

    def get_client_id_by_name(self, name: str) -> Optional[str]:
        """Znajdź ID klienta po nazwie."""
        endpoint = "/clients?with-features-stats=true"
        response = self._make_request("GET", endpoint)
        items = response.json()
        
        for client in items if isinstance(items, list) else items.get("items", []):
            client_name = (client.get("name") or client.get("companyName") or "").strip().upper()
            if client_name == name.strip().upper():
                return client.get("id") or client.get("clientId")
        return None

    def list_pending_docs(self, client_id: str, per_page: int = 100) -> List[Dict[str, Any]]:
        """Pobierz listę dokumentów oczekujących na OCR."""
        query_params = urlencode({"status": "pending", "clientId": client_id, "perPage": per_page})
        endpoint = f"/documents?{query_params}"
        response = self._make_request("GET", endpoint)
        data = response.json()

        # --- DEBUG ---
        print("\n--- DEBUG: Pełna odpowiedź z API Scanye dla listy dokumentów ---")
        # Drukujemy odpowiedź w sformatowany sposób, żeby była czytelna
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print("--- DEBUG: Koniec odpowiedzi API ---\n")
        # --- DEBUG ---

        return data.get("items") if isinstance(data, dict) else data or []

    def get_invoice_data(self, invoice_id: str) -> Dict[str, Any]:
        """Pobierz dane faktury z Scanye."""
        endpoint = f"/invoices/{invoice_id}/data"
        return self._make_request("GET", endpoint).json()

    def download_invoice_file(self, invoice_id: str) -> bytes:
        """Pobierz oryginalny plik faktury."""
        # Sprawdzamy oba możliwe endpointy
        for endpoint in (f"/invoices/{invoice_id}/file", f"/documents/{invoice_id}/file"):
            try:
                response = self._make_request("GET", endpoint)
                if response.status_code == 200 and response.content:
                    return response.content
            except requests.exceptions.HTTPError as e:
                # Ignoruj błąd 404 i spróbuj następnego endpointu
                if e.response.status_code != 404:
                    raise
        raise RuntimeError(f"Nie udało się pobrać pliku dla invoice_id: {invoice_id}")

    def update_invoice(self, invoice_id: str, payload: Dict[str, Any]) -> requests.Response:
        """Zaktualizuj dane faktury za pomocą metody PATCH."""
        endpoint = f"/invoices/{invoice_id}"
        return self._make_request("PATCH", endpoint, headers=self.json_headers, json=payload)