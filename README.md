# Swaraj Enterprises — Invoice Generator

A Next.js GST Tax Invoice generator with PO PDF auto-extraction, per-company pricing, Google Sheets database, and PDF download.

---

## Quick Start

```bash
cd swaraj-invoice
npm install
npm run dev
```
Open http://localhost:3000

---

## Features

| Feature | Details |
|---|---|
| Company search | Type to search; auto-fills GSTIN, address, payment terms |
| Per-company pricing | Each company has its own price list per product |
| PO PDF extraction | Upload any PO PDF → auto-fill all fields |
| Invoice preview | Full-size modal preview before downloading |
| PDF download | Native jsPDF drawing — crisp vector text, no overlap |
| Google Sheets DB | Every generated invoice auto-saved to a Google Sheet |

---

## PO Formats Supported

The extractor handles all 5 real PO formats from your customers:

| Company | Format | PO Number Pattern | Item Code Pattern |
|---|---|---|---|
| **Wohr Parking Systems** | SAP Standard PO | `4500XXXXXX` | `C618-XXXX`, `C408-XXXX` |
| **Intech Surface Coating** | ISCPL/CE/FR/01 | `10326XXXXXXXXX` | `BHSSPWXXXX` |
| **Statfield India** | SE/CG1/FR/01 R2 | `10526XXXXXXXXX` | `BHHTTXXXXX`, `BHMSSXXXXX` |
| **Galaxy Parking** | Tally voucher | `GPSPL/PO/26-27/XXX` | `HDWG1` (Hardware bundle) |
| **Radhe Industries** | Procuzy-generated | `RI/PO/2627/XXX` | `SKUXXXX` |

### PO Calculation Verification
All numbers verified against actual POs:

**Wohr (4500010776)**
- 5 items, Subtotal = ₹3,102.00
- GST 18%: CGST ₹279.18 + SGST ₹279.18 = Grand Total ₹3,660.36

**Intech (10326202001067)**
- BHSSPW1004: 1008 × ₹5.50 = ₹5,544.00 (pre-tax)
- CGST 9% = ₹498.96, SGST 9% = ₹498.96
- Grand Total = ₹6,541.92 ≈ ₹6,542.00 ✓

**Statfield (10526202000991)**
- BHHTTN1001: 300 × ₹3.60 = ₹1,080.00
- BHMSSW1006: 500 × ₹1.00 = ₹500.00
- Pre-tax total = ₹1,580.00
- CGST 9% = ₹142.20, SGST 9% = ₹142.20
- Grand Total = ₹1,864.40 ≈ ₹1,864.00 ✓

**Galaxy (GPSPL/PO/26-27/136)**
- Hardware G1 base = ₹1,83,424.00
- CGST 9% = ₹16,508.16, SGST 9% = ₹16,508.16
- Grand Total = ₹2,16,440.32 ✓

**Radhe (RI/PO/2627/580)**
- SKU374: 100 × ₹1.46 = ₹146.00 → +18% = ₹172.28
- SKU394: 100 × ₹1.40 = ₹140.00 → +18% = ₹165.20
- SKU3189: 170 × ₹1.20 = ₹204.00 → +18% = ₹240.72
- SKU3190: 230 × ₹1.40 = ₹322.00 → +18% = ₹379.96
- Subtotal = ₹812.00, CGST = ₹73.08, SGST = ₹73.08
- Grand Total = ₹958.16 ✓

---

## Google Sheets Setup

1. Open **google-apps-script.js** (in project root) and copy everything
2. Open your Google Sheet → **Extensions → Apps Script**
3. Delete existing code, paste copied code, save
4. **Deploy → New deployment**
   - Type: Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copy the Web App URL
6. Open `lib/googleSheets.js` and replace `'YOUR_APPS_SCRIPT_URL_HERE'` with your URL

---

## Customising Data

### Add a new company
Edit `lib/demoData.js` → `COMPANIES` array:
```js
{
  id: 'mycompany',          // unique short ID
  name: 'My Company Ltd.',
  gstin: '27XXXXX',
  address: '...',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411001',
  paymentTerms: '30 Days',
  deliveryAddress: '...',
}
```

### Add a new product
```js
{
  code: 'MYCODE001',
  description: 'My Product Name',
  hsn: '73181500',
  unit: 'NOS',
  gstRate: 18,
  prices: {
    wohr: 10.00, intech: 11.00, statfield: 11.00,
    galaxy: 12.00, radhe: 12.00, mycompany: 9.50,
  },
}
```

### Improve PO extraction for a new format
Edit `lib/poParser.js`:
1. Add a detection string in `detectFormat()`
2. Write a new `parseXXX(text)` function
3. Add the case in the `switch` statement

---

## Seller Info
To update Swaraj Enterprises' details (GSTIN, bank, address), edit `lib/demoData.js` → `SELLER`.

---

## File Structure
```
swaraj-invoice/
├── pages/
│   ├── _app.js
│   └── index.js          ← Main UI
├── components/
│   └── InvoicePreview.js ← GST invoice layout
├── lib/
│   ├── demoData.js       ← Companies, products, prices
│   ├── poParser.js       ← PO PDF extraction (5 formats)
│   ├── pdfDownload.js    ← Native jsPDF generator
│   ├── googleSheets.js   ← Sheets integration
│   └── numberToWords.js  ← Indian rupees in words
├── styles/
│   └── globals.css
├── google-apps-script.js ← Paste into Google Apps Script
└── README.md
```
# Swaraj_enterprises_Invoice-System-
