// Popup JavaScript for Scanye GPT OCR Extension

class PopupManager {
  constructor() {
    this.form = document.getElementById("api-config-form");
    this.scanyeInput = document.getElementById("scanye-api-key");
    this.openaiInput = document.getElementById("openai-api-key");
    this.saveBtn = document.getElementById("save-keys");
    this.statusMessage = document.getElementById("status-message");

    this.init();
  }

  async init() {
    // Load saved API keys
    await this.loadSavedKeys();

    // Setup event listeners
    this.setupEventListeners();

    // Check if we're on a Scanye page
    this.checkCurrentTab();

    // Check API keys status
    this.checkApiKeysStatus();
  }

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

  setupEventListeners() {
    // Form submission
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveConfiguration();
    });
  }

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

  async saveConfiguration() {
    const scanyeKey = this.scanyeInput.value.trim();
    const openaiKey = this.openaiInput.value.trim();

    if (!scanyeKey || !openaiKey) {
      this.showStatus("Wprowadź oba klucze API.", "error");
      return;
    }

    // Show loading state
    this.saveBtn.disabled = true;
    this.saveBtn.innerHTML = '<span class="loading"></span>Zapisywanie...';

    try {
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
      // Reset button state
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = "Zapisz konfigurację";
    }
  }

  showStatus(message, type) {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;

    // Auto-hide success messages after 5 seconds
    if (type === "success") {
      setTimeout(() => {
        this.statusMessage.className = "status-message";
        this.statusMessage.textContent = "";
      }, 5000);
    }
  }

  hideStatus() {
    this.statusMessage.className = "status-message";
    this.statusMessage.textContent = "";
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PopupManager();
});
