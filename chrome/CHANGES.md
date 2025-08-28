# Latest Changes - API Authorization Fix

## Problem Solved

Fixed the "HTML Response Instead of JSON" error by implementing the correct Scanye API authorization format based on the official documentation.

## Root Cause

The extension was using incorrect authorization header formats. According to the Scanye documentation, the correct format is:

```
Authorization: Scanye API-KEY
```

## Changes Made

### 1. Updated Authorization Format

- **Before**: Tried multiple formats (`Bearer`, `Scanye`, plain key)
- **After**: Uses the correct format from Scanye documentation: `Scanye API-KEY`

### 2. Added Accept Header

- Added `"Accept": "application/json"` header as shown in the documentation
- This ensures the API returns JSON instead of HTML

### 3. Updated Files

- `chrome/content.js`: Updated both `getScanyeData()` and `getDocumentFile()` functions
- `chrome/api-test.html`: Updated all test functions to use correct format
- `chrome/popup.html`: Updated help text with correct format information
- `chrome/README.md`: Updated troubleshooting section
- `chrome/API_DEBUGGING.md`: Updated with correct format examples

### 4. Improved Testing

- Updated "Test All Auth Formats" to prioritize the correct format
- Added better logging and error messages
- Maintained backward compatibility for testing

## Documentation Reference

Based on Scanye API documentation:

```bash
curl -X GET                                \
  -H "Accept: application/json"            \
  -H "Authorization: Scanye API-KEY"       \
  https://API-URL/invoices/INVOICE_ID/data
```

## Expected Result

- API calls should now return JSON data instead of HTML
- Proper error messages for invalid API keys
- Better debugging information in console logs

## Testing

1. Use `chrome/api-test.html` to test your API key
2. Check browser console (F12) for detailed logs
3. Try the "Test All Auth Formats" button to verify the correct format works

## Next Steps

If you still get HTML responses:

1. Verify your API key is correct
2. Check if the document ID exists
3. Contact Scanye support for API key verification

---

# Latest Changes - Removed API Validation

## Problem Solved

Removed the API key validation functionality that was using incompatible endpoints with Scanye API.

## Changes Made

### 1. Removed Background Validation

- Removed `validateApiKeys()` function from `background.js`
- Removed `VALIDATE_API_KEYS` message handler
- Removed calls to `https://api.scanye.pl/api/clients` endpoint

### 2. Simplified Popup Interface

- Removed "Validate Keys" button from `popup.html`
- Removed validation-related JavaScript functions from `popup.js`
- Removed auto-validation after saving configuration

### 3. Updated Files

- `chrome/background.js`: Removed validation logic
- `chrome/popup.html`: Removed validate button
- `chrome/popup.js`: Removed validation functions and event listeners

## Why This Change

The validation was using endpoints that don't exist in Scanye API (`/api/clients`), causing 404 errors. The extension now focuses on actual functionality rather than pre-validation.

## Current Behavior

- Users can still save their API keys
- Validation happens during actual API calls (when comparing OCR results)
- Better error messages when API calls fail
- No unnecessary pre-validation requests

---

# Latest Changes - Fixed Domain Configuration

## Problem Solved

Fixed incorrect domain configuration that was preventing the extension from working on Scanye pages.

## Issue

The extension was configured to work on `api.scanye.pl` instead of `app.scanye.pl` for the web interface.

## Changes Made

### 1. Updated Manifest Configuration

- **Content Scripts**: Fixed matches pattern to use `app.scanye.pl` instead of `api.scanye.pl`
- **Host Permissions**: Added `https://api.scanye.pl/*` for API calls while keeping `https://app.scanye.pl/*` for web interface

### 2. Updated Background Script

- Fixed URL checks in `chrome.action.onClicked` listener
- Fixed URL checks in `chrome.tabs.onUpdated` listener

### 3. Updated Popup Script

- Fixed URL checks in `checkCurrentTab()` function

### 4. Updated Documentation

- Fixed URLs in README.md to show correct web interface URLs

## Domain Structure

- **Web Interface**: `https://app.scanye.pl/validation/...` (where extension UI appears)
- **API Endpoints**: `https://api.scanye.pl/api/...` (for data fetching)

## Expected Result

- Extension should now appear on Scanye document pages
- Toggle button should be visible
- Extension popup should work correctly

---

# Latest Changes - Fixed Printout Response Format

## Problem Solved

Fixed the printout request response handling to work with Scanye's actual API response format.

## Issue

The code was expecting a JSON object with an `id` field, but Scanye API returns the printout ID directly as a string with quotes (e.g., `"6a841274-c274-4e8f-b5b6-cbbbe2d59c44"`).

## Changes Made

### 1. Updated Response Parsing

- **Before**: `const printoutData = await printoutResponse.json(); const printoutId = printoutData.id;`
- **After**: `const printoutIdRaw = await printoutResponse.text(); const printoutId = printoutIdRaw.replace(/"/g, '');`

### 2. Simplified Data Handling

- Removed unnecessary JSON parsing
- Direct string extraction from response
- Better error handling for text responses

## Expected Result

- Printout requests should now work correctly
- Printout ID should be properly extracted
- Status polling should continue as expected

---

# Latest Changes - Added PDF to Image Conversion

## Problem Solved

Added PDF to image conversion to support GPT-4o Vision API which only accepts image files.

## Issue

GPT-4o Vision API returned error: "Invalid MIME type. Only image types are supported" because we were sending PDF files.

## Changes Made

### 1. Added PDF.js Library

- Downloaded `pdf.min.js` and `pdf.worker.min.js` from CDN
- Added PDF.js to content scripts in manifest.json
- Configured web accessible resources for worker

### 2. Implemented PDF to Image Conversion

- Added `convertPdfToImage()` function
- Uses PDF.js to render first page of PDF to canvas
- Converts canvas to PNG blob
- Includes fallback method if PDF.js is not available

### 3. Updated sendToGPT4o Function

- Added automatic PDF detection and conversion
- Converts PDF to image before sending to GPT-4o
- Maintains original file handling for image files

### 4. Enhanced Logging

- Added conversion status logging
- Better error handling for PDF conversion
- Debug information for troubleshooting

## Expected Result

- PDF files should now be automatically converted to images
- GPT-4o Vision should accept the converted images
- OCR processing should work for both PDF and image files

---

# Latest Changes - Fixed Image Type in GPT Request

## Problem Solved

Fixed the image type being sent to GPT-4o Vision API to use the converted image type instead of original PDF type.

## Issue

The code was still using `file.type` (application/pdf) instead of `imageFile.type` (image/png) in the GPT request, causing the "Invalid MIME type" error.

## Changes Made

### 1. Fixed Image Type Reference

- **Before**: `url: \`data:${file.type};base64,${base64}\``
- **After**: `url: \`data:${imageFile.type};base64,${base64}\``

### 2. Enhanced Debugging

- Added logging for file type after conversion
- Added logging for file size after conversion
- Added logging for PDF.js availability
- Added logging for image type being sent to GPT

## Expected Result

- GPT-4o Vision should now receive proper image/png data URLs
- PDF conversion should work correctly
- No more "Invalid MIME type" errors

---

# Latest Changes - Fixed PDF Download Endpoint

## Problem Solved

Fixed the PDF download endpoint to use the correct Scanye API endpoint.

## Issue

The code was using `/printouts/{id}/file` but according to Scanye documentation, the correct endpoint is `/printouts/{id}/data`.

## Changes Made

### 1. Updated Download Endpoint

- **Before**: `GET /printouts/{id}/file`
- **After**: `GET /printouts/{id}/data`

### 2. Updated Documentation

- Fixed API endpoints list in README.md
- Removed outdated endpoints
- Added correct printout endpoints

## Expected Result

- PDF files should now download correctly from Scanye API
- No more 404 errors when downloading files
- Proper file retrieval after printout generation

---

# Latest Changes - Restored PDF to Image Conversion Function

## Problem Solved

Restored the missing `convertPdfToImage` function that was accidentally removed.

## Issue

The `convertPdfToImage` function was removed from the code but was still being called, causing "this.convertPdfToImage is not a function" error.

## Changes Made

### 1. Restored convertPdfToImage Function

- Added back the complete PDF to image conversion function
- Includes PDF.js integration for proper PDF rendering
- Includes fallback method if PDF.js is not available
- Proper canvas-based conversion to PNG format

### 2. Function Features

- Uses PDF.js library for accurate PDF rendering
- Converts first page of PDF to PNG image
- Handles PDF.js worker setup
- Includes error handling and logging
- Provides fallback for when PDF.js is unavailable

## Expected Result

- PDF files should now convert to images properly
- No more "convertPdfToImage is not a function" errors
- Successful conversion of PDF documents to images for GPT-4o Vision

---

# Latest Changes - Fixed Image Type in GPT-4o Request

## Problem Solved

Fixed the image type being sent to GPT-4o Vision API to use the converted image type instead of original PDF type.

## Issue

The code was still using `file.type` (application/pdf) instead of `imageFile.type` (image/png) in the GPT request, causing the "Invalid MIME type" error.

## Changes Made

### 1. Fixed Image Type Reference

- **Before**: `url: \`data:${file.type};base64,${base64}\``
- **After**: `url: \`data:${imageFile.type};base64,${base64}\``

### 2. Enhanced Debugging

- Added logging for file type after conversion
- Added logging before base64 conversion
- Added logging before sending to GPT-4o

## Expected Result

- GPT-4o Vision should now receive proper image/png data URLs
- No more "Invalid MIME type" errors
- Successful processing of PDF documents

---

# Latest Changes - Fixed GPT-4o Response Parsing

## Problem Solved

Fixed parsing of GPT-4o responses that are wrapped in markdown code blocks.

## Issue

GPT-4o was returning JSON data wrapped in markdown code blocks (`json ... `), but the code was trying to parse the entire response as JSON, causing parsing errors.

## Changes Made

### 1. Enhanced Response Parsing

- Added detection for markdown code blocks
- Extract JSON content from ```json blocks
- Handle generic ``` code blocks as fallback
- Added detailed logging for debugging

### 2. Improved Error Handling

- Better error messages for parsing failures
- Log raw response content for debugging
- Log extracted JSON content

## Expected Result

- GPT-4o responses should now parse correctly
- No more "Invalid response from OpenAI API" errors
- Successful extraction of invoice data from GPT-4o

---

# Latest Changes - Fixed Data Comparison Between Scanye and GPT-4o

## Problem Solved

Fixed the comparison between Scanye OCR data and GPT-4o Vision data by normalizing different data structures and formats.

## Issue

The comparison was failing because:

- Scanye data has nested structure with `.value` properties
- GPT-4o data has flat structure
- Different date formats (DD.MM.YYYY vs YYYY-MM-DD)
- Different address formats
- Different field names

## Changes Made

### 1. Added Data Normalization

- Created `normalizeScanyeData()` function to convert Scanye structure to GPT-4o format
- Maps nested `.value` properties to flat structure
- Combines address components into single strings
- Handles missing data gracefully

### 2. Enhanced Value Comparison

- Improved `compareValues()` function to handle different formats
- Normalizes dates between DD.MM.YYYY and YYYY-MM-DD formats
- Normalizes amounts by removing currency symbols and standardizing decimals
- Better handling of whitespace and case differences

### 3. Field Mapping

- `invoiceNo.value` → `invoice_number`
- `payee.name.value` → `vendor_name`
- `payee.address` → `vendor_address`
- `payer.name.value` → `client_name`
- `payer.address` → `client_address`
- `dates.issue.value` → `invoice_date`
- `dates.due.value` → `due_date`
- `amounts.gross.value` → `total_amount`
- `currency.value` → `currency`
- `amounts.vat.value` → `tax_amount`
- `amounts.net.value` → `net_amount`

## Expected Result

- Accurate comparison between Scanye and GPT-4o data
- Proper matching of equivalent values in different formats
- Clear visualization of matches and mismatches
- Better user experience with meaningful comparison results

---

# Latest Changes - Translated UI to Polish

## Problem Solved

Translated the entire extension UI to Polish language for better user experience.

## Changes Made

### 1. Manifest.json

- Changed extension name to "Scanye GPT OCR - Rozszerzenie"
- Updated description to Polish
- Changed default title to "Scanye GPT OCR - Porównanie OCR"

### 2. Popup.html

- Translated all UI text to Polish
- Updated form labels and placeholders
- Translated help text and instructions
- Changed button text to Polish

### 3. Popup.js

- Translated all status messages to Polish
- Updated error messages to Polish
- Translated button states and loading text

### 4. Content.js

- Translated main UI elements to Polish
- Updated tab names: "Comparison" → "Porównanie", "Scanye OCR" → "OCR Scanye"
- Translated button text: "Compare OCR Results" → "Porównaj wyniki OCR"
- Updated status messages to Polish
- Translated error messages to Polish
- Updated field names in comparison table to Polish
- Translated GPT-4o prompt to Polish

### 5. README.md

- Translated main sections to Polish
- Updated installation instructions to Polish
- Translated feature descriptions to Polish

### 6. Field Names Translation

- "Field" → "Pole"
- "Match" → "Dopasowanie"
- "Not found" → "Nie znaleziono"
- "invoice_number" → "Numer faktury"
- "vendor_name" → "Nazwa sprzedawcy"
- "vendor_address" → "Adres sprzedawcy"
- "client_name" → "Nazwa klienta"
- "client_address" → "Adres klienta"
- "invoice_date" → "Data faktury"
- "due_date" → "Termin płatności"
- "total_amount" → "Kwota całkowita"
- "currency" → "Waluta"
- "tax_amount" → "Kwota podatku"
- "net_amount" → "Kwota netto"

## Expected Result

- Complete Polish language support throughout the extension
- Better user experience for Polish-speaking users
- Consistent terminology across all UI elements
- Professional and polished appearance

---

# Latest Changes - Added Reset Button

## Problem Solved

Added a reset button to allow users to start fresh with the OCR comparison.

## Issue

Users needed a way to reset the panel and start over without refreshing the page.

## Changes Made

### 1. Added Reset Button

- Added "Resetuj" button to the actions section
- Button is always visible and allows quick reset

### 2. Added Reset Functionality

- Created `resetPanel()` function that:
  - Resets status message to initial state
  - Hides results panel
  - Hides update button
  - Resets processing state
  - Clears all previous data (Scanye data, GPT data, comparison table)
  - Switches back to comparison tab
  - Logs reset action for debugging

### 3. Event Listener

- Added click event listener for the reset button
- Integrated with existing event handling system

## Expected Result

- Users can now easily reset the panel and start fresh
- Better user experience with quick reset functionality
- Clean state management for multiple comparisons
