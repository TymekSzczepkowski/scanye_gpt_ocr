/**
 * Scanye GPT OCR Extension - Popup Script
 *
 * Ten plik zawiera logikę popup rozszerzenia Chrome, który służy do konfiguracji
 * kluczy API Scanye i OpenAI. Popup jest wyświetlany po kliknięciu ikony rozszerzenia
 * i umożliwia użytkownikowi wprowadzenie swoich kluczy API.
 *
 * Główne funkcjonalności:
 * - Ładowanie zapisanych kluczy API
 * - Walidacja i zapisywanie nowych kluczy API
 * - Sprawdzanie statusu konfiguracji
 * - Wyświetlanie instrukcji użycia
 */

// Popup JavaScript for Scanye GPT OCR Extension

class PopupManager {
  constructor() {
    // Referencje do elementów DOM
    this.form = document.getElementById("api-config-form");
    this.scanyeInput = document.getElementById("scanye-api-key");
    this.openaiInput = document.getElementById("openai-api-key");
    this.saveBtn = document.getElementById("save-keys");
    this.statusMessage = document.getElementById("status-message");

    this.init();
  }

  /**
   * Inicjalizuje popup - ładuje dane i ustawia nasłuchiwanie zdarzeń
   */
  async init() {
    // Ładuje zapisane klucze API
    await this.loadSavedKeys();

    // Ustawia nasłuchiwanie zdarzeń
    this.setupEventListeners();

    // Sprawdza czy jesteśmy na stronie Scanye
    this.checkCurrentTab();

    // Sprawdza status kluczy API
    this.checkApiKeysStatus();
  }

  /**
   * Ładuje zapisane klucze API z chrome.storage
   */
  async loadSavedKeys() {
    try {
      const result = await chrome.storage.sync.get(["scanyeApiKey", "openaiApiKey"]);

      if (result.scanyeApiKey) {
        this.scanyeInput.value = result.scanyeApiKey;
      }

      if (result.openaiApiKey) {
        this.openaiInput.value = result.openaiApiKey;
      }
    } catch (error) {
      console.error("Error loading saved keys:", error);
    }
  }

  /**
   * Ustawia nasłuchiwanie zdarzeń dla formularza
   */
  setupEventListeners() {
    // Obsługa wysłania formularza
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveConfiguration();
    });
  }

  /**
   * Sprawdza aktualną zakładkę i wyświetla odpowiedni status
   */
  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (tab.url && (tab.url.includes("app.scanye.pl/validation/document/") || tab.url.includes("app.scanye.pl/validation/invoice/"))) {
        this.showStatus("Jesteś na stronie dokumentu Scanye. Rozszerzenie jest gotowe do użycia!", "info");
      } else {
        this.showStatus("Przejdź do strony dokumentu Scanye, aby użyć funkcji porównania OCR.", "info");
      }
    } catch (error) {
      console.error("Error checking current tab:", error);
    }
  }

  /**
   * Sprawdza status kluczy API i wyświetla odpowiedni komunikat
   */
  async checkApiKeysStatus() {
    try {
      const result = await chrome.storage.sync.get(["scanyeApiKey", "openaiApiKey"]);

      if (!result.scanyeApiKey && !result.openaiApiKey) {
        this.showStatus("Skonfiguruj oba klucze API, aby użyć rozszerzenia.", "error");
      } else if (!result.scanyeApiKey) {
        this.showStatus("Brak klucza API Scanye. Skonfiguruj go.", "error");
      } else if (!result.openaiApiKey) {
        this.showStatus("Brak klucza API OpenAI. Skonfiguruj go.", "error");
      } else {
        this.showStatus("Oba klucze API są skonfigurowane. Możesz teraz użyć rozszerzenia.", "success");
      }
    } catch (error) {
      console.error("Error checking API keys status:", error);
    }
  }

  /**
   * Zapisuje konfigurację kluczy API
   * Waliduje dane i wysyła je do background script do zapisania
   */
  async saveConfiguration() {
    const scanyeKey = this.scanyeInput.value.trim();
    const openaiKey = this.openaiInput.value.trim();

    if (!scanyeKey || !openaiKey) {
      this.showStatus("Wprowadź oba klucze API.", "error");
      return;
    }

    // Pokazuje stan ładowania
    this.saveBtn.disabled = true;
    this.saveBtn.innerHTML = '<span class="loading"></span>Zapisywanie...';

    try {
      // Wysyła wiadomość do background script aby zapisać klucze
      await chrome.runtime.sendMessage({
        type: "SAVE_API_KEYS",
        scanyeApiKey: scanyeKey,
        openaiApiKey: openaiKey,
      });

      this.showStatus("Konfiguracja zapisana pomyślnie!", "success");
    } catch (error) {
      console.error("Error saving configuration:", error);
      this.showStatus("Błąd podczas zapisywania konfiguracji. Spróbuj ponownie.", "error");
    } finally {
      // Resetuje stan przycisku
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = "Zapisz konfigurację";
    }
  }

  /**
   * Wyświetla wiadomość statusu w popup
   * @param {string} message - Wiadomość do wyświetlenia
   * @param {string} type - Typ wiadomości (success, error, info)
   */
  showStatus(message, type) {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;

    // Automatycznie ukrywa wiadomości sukcesu po 5 sekundach
    if (type === "success") {
      setTimeout(() => {
        this.statusMessage.className = "status-message";
        this.statusMessage.textContent = "";
      }, 5000);
    }
  }

  /**
   * Ukrywa wiadomość statusu
   */
  hideStatus() {
    this.statusMessage.className = "status-message";
    this.statusMessage.textContent = "";
  }
}

// Inicjalizuje popup gdy DOM jest załadowany
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
