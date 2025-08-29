# Scanye GPT OCR - Rozszerzenie Chrome

Rozszerzenie Chrome do porównywania wyników OCR z systemu Scanye z wynikami GPT-4o Vision. Umożliwia automatyczne porównanie danych wyekstrahowanych przez system Scanye z wynikami analizy dokumentów przez sztuczną inteligencję OpenAI.

## 🚀 Funkcjonalności

- **Porównanie OCR**: Automatyczne porównanie wyników OCR Scanye z GPT-4o Vision
- **Analiza dokumentów**: Wysyłanie dokumentów do GPT-4o Vision w celu ekstrakcji danych
- **Wizualne porównanie**: Tabela porównawcza z oznaczeniem dopasowań i różnic
- **Aktualizacja danych**: Możliwość aktualizacji danych w systemie Scanye wynikami z GPT
- **Konwersja PDF**: Automatyczna konwersja dokumentów PDF do obrazów dla GPT-4o Vision
- **Bezpieczne przechowywanie**: Klucze API przechowywane lokalnie w przeglądarce

## 📋 Wymagania

- **Przeglądarka**: Google Chrome (wersja 88+)
- **Klucz API Scanye**: Dostęp do API Scanye
- **Klucz API OpenAI**: Aktywne konto OpenAI z dostępem do GPT-4o Vision
- **Dostęp do Scanye**: Konto w systemie Scanye z dostępem do dokumentów

## 🔧 Instalacja

### Krok 1: Pobranie rozszerzenia

1. Sklonuj lub pobierz to repozytorium na swój komputer
2. Rozpakuj pliki do wybranej lokalizacji

### Krok 2: Instalacja w Chrome

1. Otwórz Google Chrome
2. Przejdź do `chrome://extensions/`
3. Włącz **"Tryb programisty"** (Developer mode) w prawym górnym rogu
4. Kliknij **"Załaduj rozpakowane"** (Load unpacked)
5. Wybierz folder `chrome` z pobranego repozytorium
6. Rozszerzenie zostanie zainstalowane i pojawi się na liście

### Krok 3: Konfiguracja kluczy API

1. Kliknij ikonę rozszerzenia 🤖 w pasku narzędzi Chrome
2. Wprowadź swój **klucz API Scanye**:
   - Format: `Scanye YOUR_API_KEY` lub sam klucz
   - Możesz go znaleźć w panelu administracyjnym Scanye
3. Wprowadź swój **klucz API OpenAI**:
   - Format: `sk-...` (klucz z konta OpenAI)
   - Możesz go wygenerować na stronie https://platform.openai.com/api-keys
4. Kliknij **"Zapisz konfigurację"**

## 🎯 Jak używać

### Podstawowe użycie

1. **Przejdź do dokumentu Scanye**:

   - Otwórz dokument w systemie Scanye pod adresem `https://app.scanye.pl/validation/document/[ID]`
   - Lub fakturę pod adresem `https://app.scanye.pl/validation/invoice/[ID]`

2. **Uruchom porównanie**:

   - Kliknij przycisk **"🤖 GPT OCR"** w prawym górnym rogu strony
   - Lub kliknij ikonę rozszerzenia w pasku narzędzi

3. **Przejrzyj wyniki**:
   - **Zakładka "Porównanie"**: Tabela porównawcza z oznaczeniem dopasowań ✅/❌
   - **Zakładka "OCR Scanye"**: Surowe dane z systemu Scanye
   - **Zakładka "GPT-4o Vision"**: Wyniki analizy przez sztuczną inteligencję

### Zaawansowane funkcje

#### Aktualizacja danych Scanye

- Po wykonaniu porównania kliknij **"Zaktualizuj dane Scanye"**
- Dane z GPT-4o Vision zostaną wysłane do systemu Scanye
- **Uwaga**: Ta operacja nadpisuje istniejące dane w systemie

#### Reset panelu

- Kliknij **"Resetuj"** aby wyczyścić wszystkie wyniki
- Panel wróci do stanu początkowego

## 🔍 Jak działa

### Proces porównania

1. **Pobranie danych Scanye**: Rozszerzenie pobiera dane OCR z API Scanye dla aktualnego dokumentu
2. **Pobranie dokumentu**: Generuje PDF dokumentu z systemu Scanye
3. **Konwersja do obrazu**: Konwertuje PDF do obrazu używając PDF.js
4. **Analiza GPT-4o**: Wysyła obraz do GPT-4o Vision z instrukcją ekstrakcji danych
5. **Porównanie**: Normalizuje i porównuje dane z obu źródeł
6. **Wyświetlenie wyników**: Pokazuje tabelę porównawczą z oznaczeniem dopasowań

### Obsługiwane pola

Rozszerzenie porównuje następujące pola:

- Numer faktury
- Nazwa sprzedawcy
- Adres sprzedawcy
- Nazwa klienta
- Adres klienta
- Data faktury
- Termin płatności
- Kwota całkowita
- Waluta
- Kwota podatku
- Kwota netto

## 🛠️ Rozwiązywanie problemów

### Błędy konfiguracji

**"Scanye API key not configured"**

- Sprawdź czy klucz API Scanye jest poprawnie wprowadzony
- Upewnij się że format to `Scanye YOUR_API_KEY` lub sam klucz

**"OpenAI API key not configured"**

- Sprawdź czy klucz API OpenAI jest poprawnie wprowadzony
- Upewnij się że klucz zaczyna się od `sk-`

### Błędy API

**"Invalid Scanye API key"**

- Sprawdź czy klucz API jest aktywny w panelu Scanye
- Upewnij się że masz uprawnienia do API

**"Invalid OpenAI API key"**

- Sprawdź czy klucz API OpenAI jest aktywny
- Upewnij się że masz dostęp do modelu GPT-4o Vision

**"Przekroczono limit API OpenAI"**

- Poczekaj chwilę i spróbuj ponownie
- Sprawdź limit użycia w panelu OpenAI

### Problemy techniczne

**Rozszerzenie nie działa na stronie**

- Upewnij się że jesteś na stronie dokumentu Scanye
- Sprawdź czy URL zawiera `/validation/document/` lub `/validation/invoice/`
- Odśwież stronę i spróbuj ponownie

**Błąd konwersji PDF**

- Sprawdź czy dokument nie jest uszkodzony
- Spróbuj ponownie za kilka minut

## 🔒 Bezpieczeństwo

- **Klucze API**: Przechowywane lokalnie w przeglądarce użytkownika
- **Komunikacja**: Wszystkie połączenia używają HTTPS
- **Dane**: Nie są przesyłane do żadnych zewnętrznych serwerów poza Scanye i OpenAI
- **Uprawnienia**: Rozszerzenie ma dostęp tylko do stron Scanye i API OpenAI

## 📁 Struktura plików

```
chrome/
├── manifest.json          # Konfiguracja rozszerzenia
├── content.js            # Główny skrypt działający na stronach
├── background.js         # Skrypt działający w tle
├── popup.html           # Interfejs konfiguracji
├── popup.js             # Logika popup
├── popup.css            # Style popup
├── styles.css           # Style interfejsu na stronie
├── pdf.min.js           # Biblioteka PDF.js
├── pdf.worker.min.js    # Worker PDF.js
└── icons/               # Ikony rozszerzenia
```

---
