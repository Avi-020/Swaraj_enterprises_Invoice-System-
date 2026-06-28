// google-apps-script.js
// ══════════════════════════════════════════════════════════════════════════════
// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Delete all existing code and paste THIS entire file
// 4. Click Save (Ctrl+S)
// 5. Click "Deploy" → "New deployment"
// 6. Type: "Web app", Execute as: "Me", Who has access: "Anyone"
// 7. Click Deploy → Copy the Web App URL
// 8. Paste the URL into: swaraj-invoice/lib/googleSheets.js
//    (replace 'YOUR_APPS_SCRIPT_URL_HERE')
// ══════════════════════════════════════════════════════════════════════════════

const SHEET_NAME = "Swaraj Invoice DB";

const HEADERS = [
  "Invoice No",
  "Invoice Date",
  "PO Number",
  "PO Date",
  "Buyer Name",
  "Buyer GSTIN",
  "Buyer Address",
  "Items",
  "Subtotal",
  "CGST",
  "SGST",
  "Round Off",
  "Grand Total",
  "Saved At",
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + headers if first time
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(HEADERS);
      // Style header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground("#1e3a5f");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    // Append invoice row
    sheet.appendRow([
      data.invoiceNo || "",
      data.invoiceDate || "",
      data.poNumber || "",
      data.poDate || "",
      data.buyerName || "",
      data.buyerGstin || "",
      data.buyerAddress || "",
      data.items || "",
      Number(data.subtotal || 0),
      Number(data.cgst || 0),
      Number(data.sgst || 0),
      Number(data.roundOff || 0),
      Number(data.grandTotal || 0),
      data.savedAt || new Date().toISOString(),
    ]);

    // Auto-resize columns
    sheet.autoResizeColumns(1, HEADERS.length);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Test by running this function manually in Apps Script editor
function testSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("Sheet name: " + ss.getName());
  Logger.log("Setup looks good!");
}
