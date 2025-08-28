// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Open options page on first install
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
    });
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_API_KEYS") {
    chrome.storage.sync.get(["scanyeApiKey", "openaiApiKey"], (result) => {
      sendResponse({
        scanyeApiKey: result.scanyeApiKey || "",
        openaiApiKey: result.openaiApiKey || "",
      });
    });
    return true; // Keep message channel open for async response
  }

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

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Check if we're on a Scanye page
  if (tab.url && (tab.url.includes("app.scanye.pl/validation/document/") || tab.url.includes("app.scanye.pl/validation/invoice/"))) {
    // Send message to content script to toggle panel
    chrome.tabs.sendMessage(tab.id, { type: "TOGGLE_PANEL" });
  } else {
    // Open popup for configuration - in Manifest V3, popup opens automatically when defined
    console.log("Extension clicked on non-Scanye page");
  }
});

// Handle tab updates to show/hide extension icon
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const isScanyePage = tab.url.includes("app.scanye.pl/validation/document/") || tab.url.includes("app.scanye.pl/validation/invoice/");

    if (isScanyePage) {
      // Extension is active on Scanye pages
      console.log("Scanye page detected:", tab.url);
    }
  }
});

// Extension is ready
console.log("Scanye GPT OCR Extension background script loaded");
