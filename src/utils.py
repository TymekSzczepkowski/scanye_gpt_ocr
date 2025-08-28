from typing import Dict, Any, Optional

def pick_document_attribute(doc: Dict[str, Any], keys: list) -> Optional[str]:
    """Wybiera pierwszą niepustą wartość z dokumentu dla podanych kluczy."""
    for key in keys:
        value = doc.get(key)
        if value and isinstance(value, str):
            return value.strip()
    return None

def build_update_payload(gpt_data: Dict[str, Any]) -> Dict[str, Any]:
    """Konwertuje dane z GPT na payload dla API Scanye."""
    def V(x): # Helper to create Scanye's {"value": x} structure
        return {"value": x} if x not in ("", None) else {}

    payload = {
        "invoiceNo": V(gpt_data.get("numer_faktury")),
        "dates": {
            "issue": V(gpt_data.get("data_wystawienia")),
            "purchase": V(gpt_data.get("data_dostawy") or gpt_data.get("data_wystawienia")),
            "due": V(gpt_data.get("termin_platnosci") or gpt_data.get("data_wystawienia")),
        },
        "seller": {"taxNo": V(gpt_data.get("nip_sprzedawcy"))},
        "buyer": {"taxNo": V(gpt_data.get("nip_nabywcy"))},
        "currency": V(gpt_data.get("waluta")),
    }

    rates = []
    for item in gpt_data.get("pozycje_vat", []):
        stawka = str(item.get("stawka", "")).strip()
        if not stawka: continue
        
        rate_val = stawka if stawka.endswith("%") or stawka.lower() in ("zw", "np") else f"{stawka}%"
        rates.append({
            "rate": V(rate_val),
            "net": V(item.get("netto")),
            "vat": V(item.get("vat")),
            "gross": V(item.get("brutto")),
        })
    if rates:
        payload["amountsPerRate"] = rates

    return payload

def print_comparison(scanye_data: Dict[str, Any], gpt_data: Dict[str, Any]):
    """Drukuje czytelne porównanie kluczowych pól z obu źródeł."""
    def get_scanye_val(d, *keys):
        cur = d
        for k in keys:
            cur = cur.get(k, {})
        return cur.get("value", "") if isinstance(cur, dict) else cur
    
    sc_flat = {
        "Numer faktury": get_scanye_val(scanye_data, "invoiceNo"),
        "Data wystawienia": get_scanye_val(scanye_data, "dates", "issue"),
        "Data dostawy": get_scanye_val(scanye_data, "dates", "purchase"),
        "NIP sprzedawcy": get_scanye_val(scanye_data, "seller", "taxNo"),
        "NIP nabywcy": get_scanye_val(scanye_data, "buyer", "taxNo"),
    }
    
    gpt_flat = {
        "Numer faktury": gpt_data.get("numer_faktury", ""),
        "Data wystawienia": gpt_data.get("data_wystawienia", ""),
        "Data dostawy": gpt_data.get("data_dostawy", ""),
        "NIP sprzedawcy": gpt_data.get("nip_sprzedawcy", ""),
        "NIP nabywcy": gpt_data.get("nip_nabywcy", ""),
    }

    print("\n" + "="*20 + " PORÓWNANIE OCR " + "="*20)
    print(f"{'POLE':<20} | {'SCANYE':<30} | {'GPT-4o'}")
    print("-" * 75)
    for key in sc_flat:
        sc_val = sc_flat.get(key, "")
        gpt_val = gpt_flat.get(key, "")
        print(f"{key:<20} | {str(sc_val):<30} | {str(gpt_val)}")
    print("=" * 55 + "\n")