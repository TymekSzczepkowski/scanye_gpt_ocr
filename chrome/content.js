class ScanyeGPTOCRExtension {
  constructor() {
    this.isProcessing = false;
    this.documentId = this.extractDocumentId();
    this.init();
  }

  extractDocumentId() {
    const url = window.location.href;
    const match = url.match(/\/(document|invoice)\/([a-f0-9-]+)/);
    return match ? match[2] : null;
  }

  async init() {
    if (!this.documentId) {
      console.log("Scanye GPT OCR: No document ID found in URL");
      return;
    }

    this.injectUI();
    this.setupEventListeners();

    // Auto-detect if we're on a document page and show the button
    if (this.isDocumentPage()) {
      this.showComparisonButton();
    }
  }

  isDocumentPage() {
    return window.location.href.includes("/validation/document/") || window.location.href.includes("/validation/invoice/");
  }

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

  setupEventListeners() {
    // Toggle panel
    document.getElementById("scanye-gpt-ocr-toggle").addEventListener("click", () => {
      this.togglePanel();
    });

    // Close panel
    document.getElementById("scanye-gpt-ocr-close").addEventListener("click", () => {
      this.hidePanel();
    });

    // Compare OCR results
    document.getElementById("scanye-gpt-ocr-compare").addEventListener("click", () => {
      this.compareOCRResults();
    });

    // Update Scanye data
    document.getElementById("scanye-gpt-ocr-update").addEventListener("click", () => {
      this.updateScanyeData();
    });

    // Reset panel
    document.getElementById("scanye-gpt-ocr-reset").addEventListener("click", () => {
      this.resetPanel();
    });

    // Tab switching
    document.querySelectorAll(".scanye-gpt-ocr-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Listen for messages from background script
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

  showComparisonButton() {
    const toggle = document.getElementById("scanye-gpt-ocr-toggle");
    if (toggle) {
      toggle.style.display = "block";
    }
  }

  togglePanel() {
    const panel = document.getElementById("scanye-gpt-ocr-panel");
    panel.classList.toggle("active");
  }

  hidePanel() {
    const panel = document.getElementById("scanye-gpt-ocr-panel");
    panel.classList.remove("active");
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".scanye-gpt-ocr-tab").forEach((tab) => {
      tab.classList.remove("active");
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add("active");

    // Update tab content
    document.querySelectorAll(".scanye-gpt-ocr-tab-pane").forEach((pane) => {
      pane.classList.remove("active");
    });
    document.getElementById(`${tabName}-content`).classList.add("active");
  }

  async compareOCRResults() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.updateStatus("Przetwarzanie... Proszę czekać.");

    try {
      console.log("Starting OCR comparison for document:", this.documentId);

      // Check API keys first
      const scanyeKey = await this.getScanyeApiKey();
      const openaiKey = await this.getOpenAIKey();

      if (!scanyeKey) {
        throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
      }

      if (!openaiKey) {
        throw new Error("OpenAI API key not configured. Please configure it in the extension popup.");
      }

      console.log("API keys found, fetching Scanye data...");

      // Get Scanye data
      const scanyeData = await this.getScanyeData();
      console.log("Scanye data received:", scanyeData);

      console.log("Fetching document file...");

      // Get document file
      const documentFile = await this.getDocumentFile();
      console.log("Document file received, size:", documentFile.size);

      console.log("Sending to GPT-4o Vision...");

      // Send to GPT-4o Vision
      const gptData = await this.sendToGPT4o(documentFile);
      console.log("GPT-4o data received:", gptData);

      // Compare results
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

  async getScanyeData() {
    const apiKey = await this.getScanyeApiKey();
    if (!apiKey) {
      throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
    }

    // Use the correct Scanye authorization format from documentation
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Use the correct Scanye authorization format: "Scanye API-KEY"
    if (apiKey.startsWith("Scanye ")) {
      headers.Authorization = apiKey;
    } else {
      headers.Authorization = `Scanye ${apiKey}`;
    }

    console.log("Making request to Scanye API with headers:", headers);

    const response = await fetch(`https://api.scanye.pl/invoices/${this.documentId}/data`, {
      method: "GET",
      headers: headers,
    });

    console.log("Scanye API Response status:", response.status);
    console.log("Scanye API Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Scanye API Error Response:", errorText);

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

  async getDocumentFile() {
    const apiKey = await this.getScanyeApiKey();
    if (!apiKey) {
      throw new Error("Scanye API key not configured. Please configure it in the extension popup.");
    }

    // Use the correct Scanye authorization format: "Scanye API-KEY"
    const headers = {
      "Content-Type": "application/json",
    };

    if (apiKey.startsWith("Scanye ")) {
      headers.Authorization = apiKey;
    } else {
      headers.Authorization = `Scanye ${apiKey}`;
    }

    console.log("Step 1: Requesting PDF printout for invoice:", this.documentId);

    // Step 1: Request PDF printout
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

    // API returns the printout ID directly as a string (with quotes)
    const printoutIdRaw = await printoutResponse.text();
    const printoutId = printoutIdRaw.replace(/"/g, ""); // Remove quotes
    console.log("Printout ID received:", printoutId);

    // Step 2: Poll for printout status
    console.log("Step 2: Checking printout status...");
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    const pollInterval = 1000; // 1 second

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

        // Step 3: Download the file
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

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("PDF generation timeout - took too long to complete");
  }

  async sendToGPT4o(file) {
    const apiKey = await this.getOpenAIKey();
    if (!apiKey) {
      throw new Error("OpenAI API key not configured. Please configure it in the extension popup.");
    }

    // Convert PDF to image if needed
    let imageFile = file;
    if (file.type === "application/pdf") {
      console.log("Converting PDF to image...");
      imageFile = await this.convertPdfToImage(file);
      console.log("PDF converted to image, new type:", imageFile.type);
    }

    // Convert file to base64
    console.log("Converting to base64, file type:", imageFile.type);
    const base64 = await this.fileToBase64(imageFile);

    console.log("Sending to GPT-4o with image type:", imageFile.type);
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

      // Try to extract JSON from markdown code blocks
      let jsonContent = content;

      // Remove markdown code blocks if present
      if (content.includes("```json")) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1].trim();
          console.log("Extracted JSON from markdown:", jsonContent);
        }
      } else if (content.includes("```")) {
        // Handle generic code blocks
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

  async convertPdfToImage(pdfFile) {
    return new Promise((resolve, reject) => {
      // Set up PDF.js worker
      if (typeof pdfjsLib !== "undefined") {
        const workerUrl = chrome.runtime.getURL("pdf.worker.min.js");
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      }

      // Create a canvas to render PDF
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // Create a URL for the PDF file
      const pdfUrl = URL.createObjectURL(pdfFile);

      // Use PDF.js to render PDF (if available) or fallback to simple conversion
      if (typeof pdfjsLib !== "undefined") {
        console.log("Using PDF.js to convert PDF to image");
        // PDF.js is available
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
        // Fallback: create a simple image representation
        console.log("PDF.js not available, using fallback method");

        // Create an image element
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

  displayComparison(scanyeData, gptData) {
    // Display raw data
    document.getElementById("scanye-data").textContent = JSON.stringify(scanyeData, null, 2);
    document.getElementById("gpt-data").textContent = JSON.stringify(gptData, null, 2);

    // Create comparison table
    const comparisonTable = this.createComparisonTable(scanyeData, gptData);
    document.getElementById("comparison-table").innerHTML = comparisonTable;

    // Show results
    document.getElementById("scanye-gpt-ocr-results").style.display = "block";
  }

  createComparisonTable(scanyeData, gptData) {
    // Normalize Scanye data to match GPT-4o format
    const normalizedScanye = this.normalizeScanyeData(scanyeData);

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

  normalizeScanyeData(scanyeData) {
    const normalized = {};

    // Invoice number
    normalized.invoice_number = scanyeData.invoiceNo?.value || "N/A";

    // Vendor name
    normalized.vendor_name = scanyeData.payee?.name?.value || "N/A";

    // Vendor address
    const payee = scanyeData.payee;
    if (payee) {
      const addressParts = [payee.streetName?.value, payee.buildingNo?.value, payee.postalCode?.value, payee.city?.value].filter(Boolean);
      normalized.vendor_address = addressParts.join(", ") || "N/A";
    } else {
      normalized.vendor_address = "N/A";
    }

    // Client name
    normalized.client_name = scanyeData.payer?.name?.value || "N/A";

    // Client address
    const payer = scanyeData.payer;
    if (payer) {
      const addressParts = [payer.streetName?.value, payer.buildingNo?.value, payer.postalCode?.value, payer.city?.value].filter(Boolean);
      normalized.client_address = addressParts.join(", ") || "N/A";
    } else {
      normalized.client_address = "N/A";
    }

    // Invoice date
    normalized.invoice_date = scanyeData.dates?.issue?.value || "N/A";

    // Due date
    normalized.due_date = scanyeData.dates?.due?.value || "N/A";

    // Total amount
    normalized.total_amount = scanyeData.amounts?.gross?.value || "N/A";

    // Currency
    normalized.currency = scanyeData.currency?.value || "N/A";

    // Tax amount
    normalized.tax_amount = scanyeData.amounts?.vat?.value || "N/A";

    // Net amount
    normalized.net_amount = scanyeData.amounts?.net?.value || "N/A";

    return normalized;
  }

  compareValues(val1, val2) {
    if (val1 === val2) return true;
    if (val1 === "N/A" || val2 === "N/A") return false;

    // Normalize values for comparison
    const normalize = (val) => {
      let normalized = val.toString().toLowerCase().trim().replace(/\s+/g, " ");

      // Normalize dates (DD.MM.YYYY vs YYYY-MM-DD)
      const datePattern1 = /(\d{2})\.(\d{2})\.(\d{4})/;
      const datePattern2 = /(\d{4})-(\d{2})-(\d{2})/;

      if (datePattern1.test(normalized)) {
        normalized = normalized.replace(datePattern1, "$3-$2-$1");
      } else if (datePattern2.test(normalized)) {
        normalized = normalized.replace(datePattern2, "$3.$2.$1");
      }

      // Normalize amounts (remove currency symbols, normalize decimals)
      normalized = normalized.replace(/[^\d.,]/g, "");
      normalized = normalized.replace(",", ".");

      return normalized;
    };

    return normalize(val1) === normalize(val2);
  }

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

  formatValue(value) {
    if (value === null || value === undefined || value === "N/A") {
      return "<em>Nie znaleziono</em>";
    }
    return value.toString();
  }

  async updateScanyeData() {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.updateStatus("Aktualizowanie danych Scanye...");

    try {
      const gptData = JSON.parse(document.getElementById("gpt-data").textContent);

      const apiKey = await this.getScanyeApiKey();
      const headers = {
        "Content-Type": "application/json",
      };

      // Use the correct Scanye authorization format: "Scanye API-KEY"
      if (apiKey.startsWith("Scanye ")) {
        headers.Authorization = apiKey;
      } else {
        headers.Authorization = `Scanye ${apiKey}`;
      }

      const response = await fetch(`https://api.scanye.pl/invoices/${this.documentId}`, {
        method: "PATCH",
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

  updateStatus(message) {
    document.getElementById("scanye-gpt-ocr-status").textContent = message;
  }

  resetPanel() {
    // Reset status
    this.updateStatus("Gotowy do porównania wyników OCR");

    // Hide results
    document.getElementById("scanye-gpt-ocr-results").style.display = "none";

    // Hide update button
    document.getElementById("scanye-gpt-ocr-update").style.display = "none";

    // Reset processing state
    this.isProcessing = false;

    // Clear any previous data
    document.getElementById("scanye-data").textContent = "";
    document.getElementById("gpt-data").textContent = "";
    document.getElementById("comparison-table").innerHTML = "";

    // Switch back to comparison tab
    this.switchTab("comparison");

    console.log("Panel został zresetowany");
  }

  async getScanyeApiKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["scanyeApiKey"], (result) => {
        resolve(result.scanyeApiKey || "");
      });
    });
  }

  async getOpenAIKey() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["openaiApiKey"], (result) => {
        resolve(result.openaiApiKey || "");
      });
    });
  }
}

// Initialize extension when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new ScanyeGPTOCRExtension();
  });
} else {
  new ScanyeGPTOCRExtension();
}
