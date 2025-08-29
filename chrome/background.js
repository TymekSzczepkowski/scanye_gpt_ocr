/**
 * Scanye GPT OCR Extension - Background Script
 *
 * Ten plik zawiera logikę background script rozszerzenia Chrome, która działa
 * w tle i obsługuje komunikację między różnymi częściami rozszerzenia.
 *
 * Główne funkcjonalności:
 * - Obsługa instalacji rozszerzenia
 * - Komunikacja między content script a popup
 * - Zarządzanie kluczami API w chrome.storage
 * - Obsługa kliknięć ikony rozszerzenia
 * - Wykrywanie stron Scanye
 */

// Obsługa instalacji rozszerzenia
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Otwiera stronę konfiguracji przy pierwszej instalacji
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
    });
  }
});

// Obsługa wiadomości z content script i popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Pobieranie kluczy API z chrome.storage
  if (request.type === "GET_API_KEYS") {
    chrome.storage.sync.get(["scanyeApiKey", "openaiApiKey"], (result) => {
      sendResponse({
        scanyeApiKey: result.scanyeApiKey || "",
        openaiApiKey: result.openaiApiKey || "",
      });
    });
    return true; // Zachowuje kanał wiadomości otwarty dla asynchronicznej odpowiedzi
  }

  // Zapisywanie kluczy API do chrome.storage
  if (request.type === "SAVE_API_KEYS") {
    chrome.storage.sync.set(
      {
        scanyeApiKey: request.scanyeApiKey,
        openaiApiKey: request.openaiApiKey,
      },
      () => {
        sendResponse({ success: true });
      }
    );
    return true;
  }
});

// Obsługa kliknięcia ikony rozszerzenia
chrome.action.onClicked.addListener((tab) => {
  // Sprawdza czy jesteśmy na stronie Scanye
  if (tab.url && (tab.url.includes("app.scanye.pl/validation/document/") || tab.url.includes("app.scanye.pl/validation/invoice/"))) {
    // Wysyła wiadomość do content script aby przełączyć panel
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
  } else {
    // Otwiera popup dla konfiguracji - w Manifest V3 popup otwiera się automatycznie gdy jest zdefiniowany
    console.log("Extension clicked on non-Scanye page");
  }
});

// Obsługa aktualizacji zakładek aby pokazać/ukryć ikonę rozszerzenia
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const isScanyePage = tab.url.includes("app.scanye.pl/validation/document/") || tab.url.includes("app.scanye.pl/validation/invoice/");

    if (isScanyePage) {
      // Rozszerzenie jest aktywne na stronach Scanye
      console.log("Scanye page detected:", tab.url);
    }
  }
});

// Rozszerzenie jest gotowe
console.log("Scanye GPT OCR Extension background script loaded");
