/**
 * Scanye GPT OCR Extension - Content Script
 *
 * Ten plik zawiera główną logikę rozszerzenia Chrome, które porównuje wyniki OCR
 * z systemu Scanye z wynikami GPT-4o Vision. Rozszerzenie działa na stronach
 * dokumentów Scanye i umożliwia użytkownikom porównanie oraz aktualizację danych.
 *
 * Główne funkcjonalności:
 * - Iniekcja interfejsu użytkownika na stronę Scanye
 * - Pobieranie danych OCR z API Scanye
 * - Wysyłanie dokumentów do GPT-4o Vision
 * - Porównywanie i wyświetlanie wyników
 * - Aktualizacja danych w systemie Scanye
 */

class ScanyeGPTOCRExtension {
  constructor() {
    // Flaga wskazująca czy trwa przetwarzanie (zapobiega wielokrotnym wywołaniom)
    this.isProcessing = false;

    // ID dokumentu wyciągnięte z URL strony
    this.documentId = this.extractDocumentId();

    // Inicjalizacja rozszerzenia
    this.init();
  }

  /**
   * Wyciąga ID dokumentu z URL strony
   * Obsługuje formaty: /validation/document/{id} oraz /validation/invoice/{id}
   * @returns {string|null} ID dokumentu lub null jeśli nie znaleziono
   */
  extractDocumentId() {
    const url = window.location.href;
    const match = url.match(/\/(document|invoice)\/([a-f0-9-]+)/);
    return match ? match[2] : null;
  }

  /**
   * Główna funkcja inicjalizacyjna
   * Sprawdza czy jesteśmy na stronie dokumentu i inicjalizuje interfejs
   */
  async init() {
    if (!this.documentId) {
      console.log("Scanye GPT OCR: No document ID found in URL");
      return;
    }

    // Wstrzykuje interfejs użytkownika do strony
    this.injectUI();

    // Ustawia nasłuchiwanie zdarzeń
    this.setupEventListeners();

    // Automatycznie pokazuje przycisk porównania jeśli jesteśmy na stronie dokumentu
    if (this.isDocumentPage()) {
      this.showComparisonButton();
    }
  }

  /**
   * Sprawdza czy aktualna strona to strona dokumentu Scanye
   * @returns {boolean} true jeśli jesteśmy na stronie dokumentu
   */
  isDocumentPage() {
    return window.location.href.includes("/validation/document/") || window.location.href.includes("/validation/invoice/");
  }

  /**
   * Wstrzykuje interfejs użytkownika do strony
   * Tworzy panel z przyciskami, zakładkami i tabelą porównania
   */
  injectUI() {
    const container = document.createElement("div");
    container.id = "scanye-gpt-ocr-container";
    container.innerHTML = `
            <div id="scanye-gpt-ocr-panel" class="scanye-gpt-ocr-panel">
                        <div class="scanye-gpt-ocr-header">
          <h3>Porównanie Scanye GPT OCR</h3>
          <button id="scanye-gpt-ocr-close" class="scanye-gpt-ocr-close">&times;</button>
        </div>
        <div class="scanye-gpt-ocr-content">
          <div id="scanye-gpt-ocr-status" class="scanye-gpt-ocr-status">
            Gotowy do porównania wyników OCR
          </div>
                              <div id="scanye-gpt-ocr-results" class="scanye-gpt-ocr-results" style="display: none;">
            <div class="scanye-gpt-ocr-tabs">
              <button class="scanye-gpt-ocr-tab active" data-tab="comparison">Porównanie</button>
              <button class="scanye-gpt-ocr-tab" data-tab="scanye">OCR Scanye</button>
              <button class="scanye-gpt-ocr-tab" data-tab="gpt">GPT-4o Vision</button>
            </div>
                        <div id="scanye-gpt-ocr-tab-content" class="scanye-gpt-ocr-tab-content">
                            <div id="comparison-content" class="scanye-gpt-ocr-tab-pane active">
                                <div id="comparison-table"></div>
                            </div>
                            <div id="scanye-content" class="scanye-gpt-ocr-tab-pane">
                                <pre id="scanye-data"></pre>
                            </div>
                            <div id="gpt-content" class="scanye-gpt-ocr-tab-pane">
                                <pre id="gpt-data"></pre>
                            </div>
                        </div>
                    </div>
                              <div class="scanye-gpt-ocr-actions">
            <button id="scanye-gpt-ocr-compare" class="scanye-gpt-ocr-button">
              Porównaj wyniki OCR
            </button>
            <button id="scanye-gpt-ocr-update" class="scanye-gpt-ocr-button scanye-gpt-ocr-button-secondary" style="display: none;">
              Zaktualizuj dane Scanye
            </button>
            <button id="scanye-gpt-ocr-reset" class="scanye-gpt-ocr-button scanye-gpt-ocr-button-secondary">
              Resetuj
            </button>
          </div>
                </div>
            </div>
            <button id="scanye-gpt-ocr-toggle" class="scanye-gpt-ocr-toggle">
                <span>🤖</span> GPT OCR
            </button>
        `;

    document.body.appendChild(container);
  }

  /**
   * Ustawia wszystkie nasłuchiwania zdarzeń dla interfejsu użytkownika
   * Obsługuje kliknięcia przycisków, przełączanie zakładek i komunikację z background script
   */
  setupEventListeners() {
    // Przełączanie panelu - pokazuje/ukrywa główny panel
    document.getElementById("scanye-gpt-ocr-toggle").addEventListener("click", () => {
      this.togglePanel();
    });

    // Zamykanie panelu - ukrywa panel
    document.getElementById("scanye-gpt-ocr-close").addEventListener("click", () => {
      this.hidePanel();
    });

    // Porównanie wyników OCR - główna funkcjonalność
    document.getElementById("scanye-gpt-ocr-compare").addEventListener("click", () => {
      this.compareOCRResults();
    });

    // Aktualizacja danych Scanye - zapisuje wyniki GPT do systemu Scanye
    document.getElementById("scanye-gpt-ocr-update").addEventListener("click", () => {
      this.updateScanyeData();
    });

    // Reset panelu - czyści wszystkie wyniki i wraca do stanu początkowego
    document.getElementById("scanye-gpt-ocr-reset").addEventListener("click", () => {
      this.resetPanel();
    });

    // Przełączanie zakładek - zmienia widok między porównaniem, danymi Scanye i GPT
    document.querySelectorAll(".scanye-gpt-ocr-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Nasłuchiwanie wiadomości z background script
    // Umożliwia komunikację między różnymi częściami rozszerzenia
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === "TOGGLE_PANEL") {
        this.togglePanel();
        sendResponse({ success: true });
      } else if (request.type === "COMPARE_OCR") {
        this.compareOCRResults();
        sendResponse({ success: true });
      }
    });
  }

  /**
   * Pokazuje przycisk porównania na stronie
   * Przycisk jest domyślnie ukryty i pokazuje się tylko na stronach dokumentów
   */
  showComparisonButton() {
    const toggle = document.getElementById("scanye-gpt-ocr-toggle");
    if (toggle) {
      toggle.style.display = "block";
    }
  }

  /**
   * Przełącza widoczność głównego panelu
   * Dodaje/usuwa klasę 'active' która kontroluje wyświetlanie
   */
  togglePanel() {
    const panel = document.getElementById("scanye-gpt-ocr-panel");
    panel.classList.toggle("active");
  }

  /**
   * Ukrywa główny panel
   * Usuwa klasę 'active' z panelu
   */
  hidePanel() {
    const panel = document.getElementById("scanye-gpt-ocr-panel");
    panel.classList.remove("active");
  }

  /**
   * Przełącza między zakładkami w panelu
   * @param {string} tabName - nazwa zakładki do aktywacji
   */
  switchTab(tabName) {
    // Aktualizuje przyciski zakładek - usuwa klasę 'active' ze wszystkich i dodaje do wybranej
    document.querySelectorAll(".scanye-gpt-ocr-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Aktualizuje zawartość zakładek - ukrywa wszystkie panele i pokazuje wybrany
    document.querySelectorAll(".scanye-gpt-ocr-tab-pane").forEach((pane) => {
      pane.classList.remove("active");
    });
    document.getElementById(`${tabName}-content`).classList.add("active");
  }

  /**
   * Główna funkcja porównująca wyniki OCR
   * Pobiera dane z Scanye, wysyła dokument do GPT-4o Vision i porównuje wyniki
   */
  async compareOCRResults() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.updateStatus("Przetwarzanie... Proszę czekać.");

    try {
      console.log("Starting OCR comparison for document:", this.documentId);

      // Sprawdza klucze API przed rozpoczęciem przetwarzania
      const scanyeKey = await this.getScanyeApiKey();
      const openaiKey = await this.getOpenAIKey();

      if (!scanyeKey) {
        throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
      }

      if (!openaiKey) {
        throw new Error("OpenAI API key not configured. Please configure it in the extension popup.");
      }

      console.log("API keys found, fetching Scanye data...");

      // Pobiera dane OCR z systemu Scanye
      const scanyeData = await this.getScanyeData();
      console.log("Scanye data received:", scanyeData);

      console.log("Fetching document file...");

      // Pobiera plik dokumentu (PDF) z systemu Scanye
      const documentFile = await this.getDocumentFile();
      console.log("Document file received, size:", documentFile.size);

      console.log("Sending to GPT-4o Vision...");

      // Wysyła dokument do GPT-4o Vision do analizy
      const gptData = await this.sendToGPT4o(documentFile);
      console.log("GPT-4o data received:", gptData);

      // Wyświetla porównanie wyników
      this.displayComparison(scanyeData, gptData);

      this.updateStatus("Porównanie zakończone pomyślnie!");
      document.getElementById("scanye-gpt-ocr-update").style.display = "block";
    } catch (error) {
      console.error("Error comparing OCR results:", error);
      this.updateStatus(`Błąd: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Pobiera dane OCR z API Scanye dla aktualnego dokumentu
   * @returns {Object} Dane OCR z systemu Scanye
   */
  async getScanyeData() {
    const apiKey = await this.getScanyeApiKey();
    if (!apiKey) {
      throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
    }

    // Ustawia nagłówki zgodnie z dokumentacją Scanye
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Format autoryzacji Scanye: "Scanye API-KEY"
    if (apiKey.startsWith("Scanye ")) {
      headers.Authorization = apiKey;
    } else {
      headers.Authorization = `Scanye ${apiKey}`;
    }

    console.log("Making request to Scanye API with headers:", headers);

    // Wykonuje zapytanie do API Scanye o dane dokumentu
    const response = await fetch(`https://api.scanye.pl/invoices/${this.documentId}/data`, {
      method: "GET",
      headers: headers,
    });

    console.log("Scanye API Response status:", response.status);
    console.log("Scanye API Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Scanye API Error Response:", errorText);

      // Obsługa różnych kodów błędów
      if (response.status === 401) {
        throw new Error("Invalid Scanye API key. Please check your API key in the extension popup.");
      } else if (response.status === 404) {
        throw new Error("Document not found. Please check if the document ID is correct.");
      } else {
        throw new Error(`Scanye API error (${response.status}): ${response.statusText}`);
      }
    }

    try {
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to parse Scanye API response:", error);
      throw new Error("Invalid response from Scanye API. Please check your API key and try again.");
    }
  }

  /**
   * Pobiera plik dokumentu (PDF) z systemu Scanye
   * Proces składa się z 3 kroków: żądanie wygenerowania PDF, sprawdzanie statusu, pobranie pliku
   * @returns {Blob} Plik dokumentu jako Blob
   */
  async getDocumentFile() {
    const apiKey = await this.getScanyeApiKey();
    if (!apiKey) {
      throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
    }

    // Ustawia nagłówki autoryzacji
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey.startsWith("Scanye ")) {
      headers.Authorization = apiKey;
    } else {
      headers.Authorization = `Scanye ${apiKey}`;
    }

    console.log("Step 1: Requesting PDF printout for invoice:", this.documentId);

    // Krok 1: Żądanie wygenerowania PDF
    const printoutResponse = await fetch(`https://api.scanye.pl/printouts`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify([this.documentId.toString()]),
    });

    console.log("Printout request status:", printoutResponse.status);

    if (!printoutResponse.ok) {
      const errorText = await printoutResponse.text();
      console.error("Printout request error:", errorText);
      throw new Error(`Failed to request PDF printout: ${printoutResponse.statusText}`);
    }

    // API zwraca ID printout bezpośrednio jako string (w cudzysłowach)
    const printoutIdRaw = await printoutResponse.text();
    const printoutId = printoutIdRaw.replace(/"/g, ""); // Usuwa cudzysłowy
    console.log("Printout ID received:", printoutId);

    // Krok 2: Sprawdzanie statusu wygenerowania PDF
    console.log("Step 2: Checking printout status...");
    let attempts = 0;
    const maxAttempts = 30; // 30 sekund timeout
    const pollInterval = 1000; // 1 sekunda

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`Status check attempt ${attempts}/${maxAttempts}`);

      const statusResponse = await fetch(`https://api.scanye.pl/printouts/${printoutId}`, {
        method: "GET",
        headers: headers,
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error("Status check error:", errorText);
        throw new Error(`Failed to check printout status: ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      console.log("Printout status:", statusData.status, "File type:", statusData.fileType);

      if (statusData.status === "Finished") {
        console.log("Printout finished! File type:", statusData.fileType);

        // Krok 3: Pobranie pliku
        console.log("Step 3: Downloading file...");
        const fileResponse = await fetch(`https://api.scanye.pl/printouts/${printoutId}/data`, {
          method: "GET",
          headers: headers,
        });

        if (!fileResponse.ok) {
          const errorText = await fileResponse.text();
          console.error("File download error:", errorText);
          throw new Error(`Failed to download file: ${fileResponse.statusText}`);
        }

        const blob = await fileResponse.blob();
        console.log("File downloaded successfully, size:", blob.size);
        return blob;
      }

      if (statusData.status === "Failed") {
        throw new Error("PDF generation failed");
      }

      // Czeka przed następnym sprawdzeniem
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("PDF generation timeout - took too long to complete");
  }

  /**
   * Wysyła dokument do GPT-4o Vision do analizy OCR
   * Konwertuje PDF do obrazu jeśli potrzeba i wysyła do OpenAI API
   * @param {Blob} file - Plik dokumentu do analizy
   * @returns {Object} Dane wyekstrahowane przez GPT-4o Vision
   */
  async sendToGPT4o(file) {
    const apiKey = await this.getOpenAIKey();
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Please configure it in the extension popup.");
    }

    // Konwertuje PDF do obrazu jeśli potrzeba
    let imageFile = file;
    if (file.type === "application/pdf") {
      console.log("Converting PDF to image...");
      imageFile = await this.convertPdfToImage(file);
      console.log("PDF converted to image, new type:", imageFile.type);
    }

    // Konwertuje plik do base64
    console.log("Converting to base64, file type:", imageFile.type);
    const base64 = await this.fileToBase64(imageFile);

    console.log("Sending to GPT-4o with image type:", imageFile.type);

    // Wysyła zapytanie do OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please extract all invoice data from this image/document. Return the data in JSON format with the following fields:
                - invoice_number
                - vendor_name
                - vendor_address
                - client_name
                - client_address
                - invoice_date
                - due_date
                - total_amount
                - currency
                - tax_amount
                - net_amount
                - items (array of line items with description, quantity, unit_price, total)

                If any field is not found, use null. Be as accurate as possible.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageFile.type};base64,${base64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error Response:", errorText);

      // Obsługa różnych kodów błędów OpenAI
      if (response.status === 401) {
        throw new Error("Nieprawidłowy klucz API OpenAI. Sprawdź swój klucz API w popup rozszerzenia.");
      } else if (response.status === 429) {
        throw new Error("Przekroczono limit API OpenAI. Spróbuj ponownie później.");
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${response.statusText}`);
      }
    }

    try {
      const result = await response.json();
      const content = result.choices[0].message.content;
      console.log("GPT-4o raw response:", content);

      // Próbuje wyekstrahować JSON z bloków kodu markdown
      let jsonContent = content;

      // Usuwa bloki kodu markdown jeśli są obecne
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
          console.log("Extracted JSON from markdown:", jsonContent);
        }
      } else if (content.includes("```")) {
        // Obsługuje ogólne bloki kodu
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1].trim();
          console.log("Extracted content from code block:", jsonContent);
        }
      }

      try {
        return JSON.parse(jsonContent);
      } catch (parseError) {
        console.error("Failed to parse GPT response as JSON:", jsonContent);
        console.error("Parse error:", parseError);
        throw new Error("GPT-4o zwrócił nieprawidłowy JSON. Spróbuj ponownie.");
      }
    } catch (error) {
      console.error("Failed to parse OpenAI API response:", error);
      throw new Error("Nieprawidłowa odpowiedź z API OpenAI. Sprawdź swój klucz API i spróbuj ponownie.");
    }
  }

  /**
   * Konwertuje plik do formatu base64
   * @param {Blob} file - Plik do konwersji
   * @returns {Promise<string>} Plik w formacie base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Konwertuje plik PDF do obrazu używając PDF.js
   * @param {Blob} pdfFile - Plik PDF do konwersji
   * @returns {Promise<Blob>} Obraz jako Blob
   */
  async convertPdfToImage(pdfFile) {
    return new Promise((resolve, reject) => {
      // Ustawia worker PDF.js
      if (typeof pdfjsLib !== "undefined") {
        const workerUrl = chrome.runtime.getURL("pdf.worker.min.js");
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      }

      // Tworzy canvas do renderowania PDF
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Tworzy URL dla pliku PDF
      const pdfUrl = URL.createObjectURL(pdfFile);

      // Używa PDF.js do renderowania PDF (jeśli dostępne) lub fallback
      if (typeof pdfjsLib !== "undefined") {
        console.log("Using PDF.js to convert PDF to image");
        // PDF.js jest dostępne
        pdfjsLib
          .getDocument(pdfUrl)
          .promise.then((pdf) => {
            pdf.getPage(1).then((page) => {
              const viewport = page.getViewport({ scale: 1.5 });
              canvas.width = viewport.width;
              canvas.height = viewport.height;

              page
                .render({
                  canvasContext: ctx,
                  viewport: viewport,
                })
                .promise.then(() => {
                  canvas.toBlob((blob) => {
                    URL.revokeObjectURL(pdfUrl);
                    console.log("PDF converted to image successfully");
                    resolve(blob);
                  }, "image/png");
                });
            });
          })
          .catch((error) => {
            console.error("PDF.js conversion failed:", error);
            reject(error);
          });
      } else {
        // Fallback: tworzy prostą reprezentację obrazu
        console.log("PDF.js not available, using fallback method");

        // Tworzy element obrazu
        const img = new Image();
        img.onload = () => {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            URL.revokeObjectURL(pdfUrl);
            resolve(blob);
          }, "image/png");
        };
        img.onerror = reject;
        img.src = pdfUrl;
      }
    });
  }

  /**
   * Wyświetla porównanie wyników OCR
   * @param {Object} scanyeData - Dane z systemu Scanye
   * @param {Object} gptData - Dane z GPT-4o Vision
   */
  displayComparison(scanyeData, gptData) {
    // Wyświetla surowe dane
    document.getElementById("scanye-data").textContent = JSON.stringify(scanyeData, null, 2);
    document.getElementById("gpt-data").textContent = JSON.stringify(gptData, null, 2);

    // Tworzy tabelę porównania
    const comparisonTable = this.createComparisonTable(scanyeData, gptData);
    document.getElementById("comparison-table").innerHTML = comparisonTable;

    // Pokazuje wyniki
    document.getElementById("scanye-gpt-ocr-results").style.display = "block";
  }

  /**
   * Tworzy tabelę porównania wyników OCR
   * @param {Object} scanyeData - Dane z systemu Scanye
   * @param {Object} gptData - Dane z GPT-4o Vision
   * @returns {string} HTML tabeli porównania
   */
  createComparisonTable(scanyeData, gptData) {
    // Normalizuje dane Scanye do formatu GPT-4o
    const normalizedScanye = this.normalizeScanyeData(scanyeData);

    // Lista pól do porównania
    const fields = [
      "invoice_number",
      "vendor_name",
      "vendor_address",
      "client_name",
      "client_address",
      "invoice_date",
      "due_date",
      "total_amount",
      "currency",
      "tax_amount",
      "net_amount",
    ];

    let table = `
            <table class="scanye-gpt-ocr-comparison-table">
                <thead>
                    <tr>
                        <th>Pole</th>
                        <th>OCR Scanye</th>
                        <th>GPT-4o Vision</th>
                        <th>Dopasowanie</th>
                    </tr>
                </thead>
                <tbody>
        `;

    // Tworzy wiersze tabeli dla każdego pola
    fields.forEach((field) => {
      const scanyeValue = normalizedScanye[field] || "N/A";
      const gptValue = gptData[field] || "N/A";
      const isMatch = this.compareValues(scanyeValue, gptValue);

      table += `
                <tr class="${isMatch ? "match" : "mismatch"}">
                    <td><strong>${this.formatFieldName(field)}</strong></td>
                    <td>${this.formatValue(scanyeValue)}</td>
                    <td>${this.formatValue(gptValue)}</td>
                    <td>${isMatch ? "✅" : "❌"}</td>
                </tr>
            `;
    });

    table += "</tbody></table>";
    return table;
  }

  /**
   * Normalizuje dane Scanye do formatu porównywalnego z GPT-4o
   * @param {Object} scanyeData - Surowe dane z API Scanye
   * @returns {Object} Znormalizowane dane
   */
  normalizeScanyeData(scanyeData) {
    const normalized = {};

    // Numer faktury
    normalized.invoice_number = scanyeData.invoiceNo?.value || "N/A";

    // Nazwa sprzedawcy
    normalized.vendor_name = scanyeData.payee?.name?.value || "N/A";

    // Adres sprzedawcy
    const payee = scanyeData.payee;
    if (payee) {
      const addressParts = [payee.streetName?.value, payee.buildingNo?.value, payee.postalCode?.value, payee.city?.value].filter(Boolean);
      normalized.vendor_address = addressParts.join(", ") || "N/A";
    } else {
      normalized.vendor_address = "N/A";
    }

    // Nazwa klienta
    normalized.client_name = scanyeData.payer?.name?.value || "N/A";

    // Adres klienta
    const payer = scanyeData.payer;
    if (payer) {
      const addressParts = [payer.streetName?.value, payer.buildingNo?.value, payer.postalCode?.value, payer.city?.value].filter(Boolean);
      normalized.client_address = addressParts.join(", ") || "N/A";
    } else {
      normalized.client_address = "N/A";
    }

    // Data faktury
    normalized.invoice_date = scanyeData.dates?.issue?.value || "N/A";

    // Termin płatności
    normalized.due_date = scanyeData.dates?.due?.value || "N/A";

    // Kwota całkowita
    normalized.total_amount = scanyeData.amounts?.gross?.value || "N/A";

    // Waluta
    normalized.currency = scanyeData.currency?.value || "N/A";

    // Kwota podatku
    normalized.tax_amount = scanyeData.amounts?.vat?.value || "N/A";

    // Kwota netto
    normalized.net_amount = scanyeData.amounts?.net?.value || "N/A";

    return normalized;
  }

  /**
   * Porównuje dwie wartości z uwzględnieniem normalizacji
   * @param {string} val1 - Pierwsza wartość
   * @param {string} val2 - Druga wartość
   * @returns {boolean} true jeśli wartości są równe po normalizacji
   */
  compareValues(val1, val2) {
    if (val1 === val2) return true;
    if (val1 === "N/A" || val2 === "N/A") return false;

    // Normalizuje wartości do porównania
    const normalize = (val) => {
      let normalized = val.toString().toLowerCase().trim().replace(/\s+/g, " ");

      // Normalizuje daty (DD.MM.YYYY vs YYYY-MM-DD)
      const datePattern1 = /(\d{2})\.(\d{2})\.(\d{4})/;
      const datePattern2 = /(\d{4})-(\d{2})-(\d{2})/;

      if (datePattern1.test(normalized)) {
        normalized = normalized.replace(datePattern1, "$3-$2-$1");
      } else if (datePattern2.test(normalized)) {
        normalized = normalized.replace(datePattern2, "$3.$2.$1");
      }

      // Normalizuje kwoty (usuwa symbole walut, normalizuje przecinki)
      normalized = normalized.replace(/[^\d.,]/g, "");
      normalized = normalized.replace(",", ".");

      return normalized;
    };

    return normalize(val1) === normalize(val2);
  }

  /**
   * Formatuje nazwy pól do wyświetlenia w tabeli
   * @param {string} field - Nazwa pola w formacie snake_case
   * @returns {string} Sformatowana nazwa pola
   */
  formatFieldName(field) {
    const fieldNames = {
      invoice_number: "Numer faktury",
      vendor_name: "Nazwa sprzedawcy",
      vendor_address: "Adres sprzedawcy",
      client_name: "Nazwa klienta",
      client_address: "Adres klienta",
      invoice_date: "Data faktury",
      due_date: "Termin płatności",
      total_amount: "Kwota całkowita",
      currency: "Waluta",
      tax_amount: "Kwota podatku",
      net_amount: "Kwota netto",
    };

    return (
      fieldNames[field] ||
      field
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }

  /**
   * Formatuje wartość do wyświetlenia w tabeli
   * @param {string} value - Wartość do sformatowania
   * @returns {string} Sformatowana wartość
   */
  formatValue(value) {
    if (value === null || value === undefined || value === "N/A") {
      return "<em>Nie znaleziono</em>";
    }
    return value.toString();
  }

  /**
   * Aktualizuje dane w systemie Scanye wynikami z GPT-4o Vision
   * Wysyła dane GPT do API Scanye aby zaktualizować dokument
   */
  async updateScanyeData() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.updateStatus("Aktualizowanie danych Scanye...");

    try {
      // Pobiera dane GPT z wyświetlonego wyniku
      const gptData = JSON.parse(document.getElementById("gpt-data").textContent);

      const apiKey = await this.getScanyeApiKey();
      const headers = {
        "Content-Type": "application/json",
      };

      // Ustawia autoryzację Scanye
      if (apiKey.startsWith("Scanye ")) {
        headers.Authorization = apiKey;
      } else {
        headers.Authorization = `Scanye ${apiKey}`;
      }

      // Wysyła żądanie aktualizacji do API Scanye
      const response = await fetch(`https://api.scanye.pl/invoices/${this.documentId}`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(gptData),
      });

      if (!response.ok) {
        throw new Error(`Nie udało się zaktualizować danych Scanye: ${response.statusText}`);
      }

      this.updateStatus("Dane Scanye zaktualizowane pomyślnie!");
    } catch (error) {
      console.error("Error updating Scanye data:", error);
      this.updateStatus(`Błąd aktualizacji danych: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Aktualizuje status w interfejsie użytkownika
   * @param {string} message - Wiadomość do wyświetlenia
   */
  updateStatus(message) {
    document.getElementById("scanye-gpt-ocr-status").textContent = message;
  }

  /**
   * Resetuje panel do stanu początkowego
   * Czyści wszystkie wyniki i ukrywa przyciski aktualizacji
   */
  resetPanel() {
    // Resetuje status
    this.updateStatus("Gotowy do porównania wyników OCR");

    // Ukrywa wyniki
    document.getElementById("scanye-gpt-ocr-results").style.display = "none";

    // Ukrywa przycisk aktualizacji
    document.getElementById("scanye-gpt-ocr-update").style.display = "none";

    // Resetuje stan przetwarzania
    this.isProcessing = false;

    // Czyści poprzednie dane
    document.getElementById("scanye-data").textContent = "";
    document.getElementById("gpt-data").textContent = "";
    document.getElementById("comparison-table").innerHTML = "";

    // Przełącza z powrotem na zakładkę porównania
    this.switchTab("comparison");

    console.log("Panel został zresetowany");
  }

  /**
   * Pobiera klucz API Scanye z chrome.storage
   * @returns {Promise<string>} Klucz API Scanye
   */
  async getScanyeApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["scanyeApiKey"], (result) => {
        resolve(result.scanyeApiKey || "");
      });
    });
  }

  /**
   * Pobiera klucz API OpenAI z chrome.storage
   * @returns {Promise<string>} Klucz API OpenAI
   */
  async getOpenAIKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["openaiApiKey"], (result) => {
        resolve(result.openaiApiKey || "");
      });
    });
  }
}

// Inicjalizuje rozszerzenie gdy strona się załaduje
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ScanyeGPTOCRExtension();
  });
} else {
  new ScanyeGPTOCRExtension();
}
