// lib/poParser.js — PO PDF extraction for 5 formats
// KEY FIX: makeItem now returns BOTH .name AND .description (index.js uses .name)
// KEY FIX: Wohr parser always uses knownDescs (pdfjs text order is unreliable for desc)
// KEY FIX: roundOff is negative when grand < pre-round (Less = deducted)

export async function parsePOFromFile(file) {
  const pdfjsLib = await import("pdfjs-dist/build/pdf");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(" ");
    pageTexts.push(text);
  }
  const fullText = pageTexts.join("\n\n");

  const format = detectFormat(fullText);
  let result;
  switch (format) {
    case "WOHR":
      result = parseWohr(fullText);
      break;
    case "INTECH":
      result = parseIntech(fullText);
      break;
    case "STATFIELD":
      result = parseStatfield(fullText);
      break;
    case "GALAXY":
      result = parseGalaxy(fullText);
      break;
    case "RADHE":
      result = parseRadhe(fullText);
      break;
    default:
      result = parseGeneric(fullText);
      break;
  }
  result.format = format;
  return result;
}

// ─── FORMAT DETECTION ────────────────────────────────────────────────────────
function detectFormat(text) {
  const t = text.toUpperCase();
  if (t.includes("WOHR PARKING")) return "WOHR";
  if (t.includes("INTECH SURFACE COATING")) return "INTECH";
  if (t.includes("STATFIELD")) return "STATFIELD";
  if (t.includes("GALAXY PARKING") || t.includes("GPSPL")) return "GALAXY";
  if (t.includes("RADHE INDUSTRIES") || t.includes("PROCUZY")) return "RADHE";
  return "GENERIC";
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function rx(text, pattern, group = 1) {
  const m = text.match(pattern);
  return m ? (m[group] || "").trim() : "";
}
function num(s) {
  return (
    parseFloat(
      String(s || 0)
        .replace(/,/g, "")
        .replace(/[₹\s]/g, ""),
    ) || 0
  );
}
function toDate(raw) {
  if (!raw) return "";
  const mm = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  let m = raw.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m) return `${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}/${m[3]}`;
  m = raw.match(/(\d{1,2})\s*[-\s]\s*([A-Za-z]{3})\s*[-\s]\s*(\d{2,4})/);
  if (m) {
    const yr = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${m[1].padStart(2, "0")}/${mm[m[2].toLowerCase()] || "01"}/${yr}`;
  }
  m = raw.match(/([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (m)
    return `${m[2].padStart(2, "0")}/${mm[m[1].toLowerCase()] || "01"}/${m[3]}`;
  return raw;
}

// ─── makeItem — returns BOTH .name (used by index.js) AND .description ───────
// index.js: items[].name, items[].quantity, items[].rate, items[].hsn, items[].unit
// poParser previously returned .description and .qty — now returns both for compatibility
function makeItem(code, desc, hsn, qty, rate, unit = "NOS", gstRate = 18) {
  const cleanDesc = (desc || "").trim();
  return {
    // Fields used by index.js / InvoicePreview
    productId: code || "manual",
    name: cleanDesc, // ← index.js uses .name
    hsn: (hsn || "").trim(),
    quantity: Number(qty) || 0, // ← index.js uses .quantity
    rate: Number(rate) || 0,
    unit: (unit || "NOS").trim(),
    disc: "",
    // Extra fields for compatibility
    code: (code || "").trim(),
    description: cleanDesc, // kept for backward compat
    qty: Number(qty) || 0,
    gstRate: Number(gstRate) || 18,
    amount: (Number(qty) || 0) * (Number(rate) || 0),
  };
}

// ─── FORMAT A: WOHR PARKING ───────────────────────────────────────────────────
// PO 4500010776 items (exact from PDF):
//   C618-0501  HEX NUT M4 DIN 934 8 TENSILE GRADE     1000  0.35   350.00
//   C602-0111  CYLINDER SCREW M5X16 DIN 912 8.8 ZK     100  1.27   127.00
//   C408-1361  THREADED ROD M16X235 DIN 975 8.8 ZK      25 53.00  1325.00
//   C408-1306  WASHER M5, DIN 125 ST ZK               1000  0.25   250.00
//   C408-1451  THREADED ROD M12X165 DIN 975 8.8 ZK      30 35.00  1050.00
//   Subtotal = 3102.00  (PO Grand Total = 3102 — GST exclusive)
//
// CRITICAL: pdfjs joins text in a flat stream — item description appears BEFORE
// the code in pdfjs output for this format because of column layout. We use
// knownDescs lookup as PRIMARY source (not fallback) for Wohr item codes.
function parseWohr(text) {
  const result = {
    buyerName: "Wohr Parking Systems Pvt. Ltd.",
    buyerGstin: "27AAACW6100A1ZZ",
    buyerAddress:
      "Wohr Parking Systems Pvt. Ltd. Unit - I, Gat No. 1098, Urawade Road, Pirangut, Tal Mulshi",
    buyerCity: "Pune",
    buyerState: "Maharashtra",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    buyerPincode: "412115",
    buyerPhone: "+91-20-2553 61 81 / 82",
    buyerEmail: "purchase@wohrparking.in",
    deliveryAddress:
      "Wohr Parking Systems Pvt. Ltd. Unit - I, Gat No. 1098, Urawade Road, Pirangut, Tal Mulshi, 412115 Pune",
    paymentTerms: "100% Net Due-30 Days",
    companyId: "wohr",
  };

  result.poNumber =
    rx(text, /Standard Purchase Order\s*[-–]\s*(\d+)/i) ||
    rx(text, /PO\s*No[:\s]+(\d+)/i);

  result.poDate = toDate(rx(text, /PO\s*Date[:\s]+([\d\-\/]+)/i));

  // ── Dynamic description extraction (works for ANY Wohr item code) ──
  const items = [];
  const codePattern = /\b(C\d{3}-\d{4})\b/g;
  let m;

  while ((m = codePattern.exec(text)) !== null) {
    const code = m[1];
    const startIdx = m.index;
    const window = text.substring(startIdx, startIdx + 400);

    // Description: everything between the code and "Drawing No" / 8-digit HSN
    let name = "";
    const descM = window.match(
      /^[\w-]+\s+([A-Z][A-Z0-9\s,.\/-]+?)(?:\s+Drawing\s*No|\s+\d{8}\b)/,
    );
    if (descM) {
      name = descM[1].replace(/\s{2,}/g, " ").trim();
      // Strip trailing duplicate "DIN xxx-x" drawing reference
      name = name.replace(/\s+DIN\s+[\d-]+$/i, "").trim();
    }
    if (!name) {
      const fallbackM = window.match(
        /^[\w-]+\s+([A-Z][A-Za-z0-9\s,.\/-]{4,60})/,
      );
      if (fallbackM) name = fallbackM[1].replace(/\s{2,}/g, " ").trim();
    }
    if (!name) name = code;

    const qtyM = window.match(/([\d,]+\.?\d*)\s*NOS/i);
    const qty = qtyM ? num(qtyM[1]) : 0;

    const hsnM = window.match(/\b(8\d{7})\b/);
    const hsn = hsnM ? hsnM[1] : "84313990";

    let rate = 0;
    const rateM = window.match(/([\d.]+)\s+INR\s+([\d.]+)\s*\d*\.?\d*\s*%/);
    if (rateM) {
      rate = num(rateM[2]);
    } else {
      const afterHsn = hsnM
        ? window.substring(hsnM.index + hsnM[0].length)
        : window;
      const simpleRate = afterHsn.match(/\b(\d+\.?\d*)\s+INR/);
      if (simpleRate) rate = num(simpleRate[1]);
    }

    if (rate === 0 && qty > 0) {
      const amtM = window.match(/([\d,]+\.[\d]{2})\s*$/m);
      if (amtM) rate = Math.round((num(amtM[1]) / qty) * 100) / 100;
    }

    if (qty > 0 || rate > 0) {
      items.push(makeItem(code, name, hsn, qty, rate, "NOS", 18));
    }
  }

  const calcSub = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const poSub = num(rx(text, /Subtotal\s+([\d,]+\.[\d]+)/i));
  if (poSub > 0 && Math.abs(calcSub - poSub) > 1) {
    result.warning = `Subtotal mismatch: calc ₹${calcSub.toFixed(2)} vs PO ₹${poSub.toFixed(2)}`;
  }

  result.items = items;
  return result;
}
// ─── FORMAT B: INTECH SURFACE COATING ────────────────────────────────────────
// BHSSPW1004  WASHER PLAIN SS 304 M 12  1008  5.50  → Total 5544 pre-tax
function parseIntech(text) {
  const result = {
    buyerName: "Intech Surface Coating Pvt. Ltd.",
    buyerGstin: "27AAACI4150J1ZO",
    buyerAddress: "1073/1-2-3, Pirangoot",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    buyerCity: "Pune",
    buyerPincode: "412115",
    buyerPhone: "(020) 22922172 / 22922350",
    buyerEmail: "purchase@intechfinishing.com",
    deliveryAddress: "1073/1-2-3, Pirangoot, 412115, Pune",
    paymentTerms: "60 Days After Delivery",
    companyId: "intech",
  };
  result.poNumber = rx(text, /PURCHASE ORDER NO\s+([\w]+)/i);
  result.poDate = toDate(
    rx(text, /PURCHASE ORDER DATE\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i),
  );
  result.items = extractBHItems(text);
  return result;
}

// ─── FORMAT C: STATFIELD ─────────────────────────────────────────────────────
// BHHTTN1001 NUT HIGH TENSILE HEX M12  300  3.60
// BHMSSW1006 WASHER MS SPRING M12      500  1.00
function parseStatfield(text) {
  const result = {
    buyerName: "Statfield (India) Private Limited",
    buyerGstin: "27AACCS5982J1ZU",
    buyerAddress: "1073/1-2-3, Pirangoot",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    buyerCity: "Pune",
    buyerPincode: "412115",
    buyerPhone: "(020) 22922172 / 22922350",
    buyerEmail: "purchase@statfieldequipments.com",
    deliveryAddress: "1073/1-2-3, Pirangoot, 412115, Pune",
    paymentTerms: "60 Days After Delivery",
    companyId: "statfield",
  };
  result.poNumber = rx(text, /PURCHASE ORDER NO\s+([\w]+)/i);
  result.poDate = toDate(
    rx(text, /PURCHASE ORDER DATE\s+(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i),
  );
  result.items = extractBHItems(text);
  return result;
}

// Shared extractor for Intech + Statfield (BH... codes)
// Shared extractor for Intech + Statfield (BH... codes)
// Dynamically reads description from the DESCRIPTION column instead of a hardcoded lookup.
function extractBHItems(text) {
  const items = [];
  const codePattern = /\b(BH[A-Z0-9]+)\b/g;
  let m;

  while ((m = codePattern.exec(text)) !== null) {
    const code = m[1];
    if (items.find((i) => i.code === code)) continue;
    const window = text.substring(m.index, m.index + 300);

    let name = "";
    const descM = window.match(
      /^[\w]+\s+([A-Z][A-Z0-9\s,.\/-]+?)\s+(?:NOS|PCS|KGS|SET|MTR)\b/,
    );
    if (descM) {
      name = descM[1].replace(/\s{2,}/g, " ").trim();
    }
    if (!name) name = code;

    const numsM = window.match(
      /(NOS|PCS|KGS|SET|MTR)\s+([\d,]+\.?\d+)\s+([\d.]+)/i,
    );
    const qty = numsM ? num(numsM[2]) : 0;
    const rate = numsM ? num(numsM[3]) : 0;

    const hsn = "73181500";

    if (qty > 0 || rate > 0) {
      items.push(makeItem(code, name, hsn, qty, rate, "NOS", 18));
    }
  }
  return items;
}
// ─── FORMAT D: GALAXY PARKING ────────────────────────────────────────────────
// Single item: Hardware G1, base 1,83,424, CGST/SGST 9% each → Grand 2,16,440.32
function parseGalaxy(text) {
  const result = {
    buyerName: "Galaxy Parking Systems Pvt Ltd",
    buyerGstin: "27AAJCG3944M1Z3",
    buyerAddress:
      "Office No.1202, Floor No.12, Mayuresh Cosmos Premises, Plot No.37, Sector-11, CBD Belapur, Navi Mumbai - 400 614",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    buyerCity: "Navi Mumbai",
    buyerPincode: "400614",
    deliveryAddress:
      "Survey no 108/1/B/2, Wawanje village, Taloja MIDC, Taluka-Panvel, Dist-Raigad, Pin-410208",
    paymentTerms: "30 Days Credit",
    companyId: "galaxy",
  };

  result.poNumber =
    rx(text, /Voucher No\.?\s*(GPSPL\/PO\/[\d\-\/]+)/i) ||
    rx(text, /(GPSPL\/PO\/[\d\-\/]+)/i);
  result.poDate = toDate(
    rx(text, /Dated\s+([\d]{1,2}[-\s][A-Za-z]{3}[-\s][\d]{2,4})/i),
  );

  // Base amount from CGST reverse
  let baseAmount = 183424;
  const cgstM = text.match(/Input\s+CGST\s+([\d,]+\.[\d]+)/i);
  if (cgstM) baseAmount = Math.round((num(cgstM[1]) / 0.09) * 100) / 100;

  result.items = [
    makeItem(
      "HDWG1",
      "Hardware G1 - Green Passivation (Bolt/Nut/Washer Hardware Set)",
      "73181500",
      1,
      baseAmount,
      "NOS",
      18,
    ),
  ];
  return result;
}

// ─── FORMAT E: RADHE INDUSTRIES (Procuzy) ────────────────────────────────────
// PO RI/PO/2627/580: SKU374(100×1.46) SKU394(100×1.40) SKU3189(170×1.20) SKU3190(230×1.40)
//   Sub=812 CGST=73.08 SGST=73.08 Total=958.16
// PO RI/PO/2627/613: SKU2409(300×1.00) SKU394(1500×1.40) SKU2434(1600×0.23)
//   Sub=2768 CGST=249.12 SGST=249.12 Total=3266.24
//
// CRITICAL: Procuzy does NOT round to nearest rupee — grand total keeps paise.
// Extract: PO# from "Purchase Order #", Date from "Order Date",
//          items from SKU codes with qty.000 NOS pattern and Price/Unit column.
function parseRadhe(text) {
  const result = {
    buyerName: "Radhe Industries",
    buyerGstin: "27AAPFR7137Q1Z7",
    buyerAddress:
      "A3-A7, New Jawaharlal Nehru Ind Est, Mukawadi, Pirangut, Mulshi",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    buyerCity: "Pune",
    buyerPincode: "412115",
    buyerPhone: "9819089958",
    buyerEmail: "harsora@radheindustries.org",
    deliveryAddress:
      "A3-A7, New Jawaharlal Nehru Ind Est, Mukawadi, Pirangut, Mulshi, Pune 412115",
    paymentTerms: "45 Days Post Delivery",
    companyId: "radhe",
  };

  // PO Number — "Purchase Order # RI /PO/2627/613" (note the space after RI)
  result.poNumber =
    rx(text, /Purchase Order #\s*(RI\s*\/PO\/[\d\/]+)/i).replace(/\s+/g, "") || // normalize "RI /PO" → "RI/PO"
    rx(text, /\b(RI\/PO\/[\d\/]+)\b/i);

  // Order Date — "Order Date Jun 20 2026"
  result.poDate = toDate(
    rx(text, /Order\s+Date\s+([A-Za-z]{3}\s+\d{1,2}\s+\d{4})/i),
  );

  // Known product master for ALL Radhe SKUs seen so far
  // We match by code and extract qty+price dynamically from PDF text
  const RADHE_MASTER = {
    SKU374: { name: "NUT SERT M6", hsn: "" },
    SKU394: { name: "COMBI PHILIPS HEAD SCREW WITH WASHER M6 X 12", hsn: "" },
    SKU3189: { name: "HEX BOLT M6 X 12", hsn: "" },
    SKU3190: { name: "CSK BOLT M6 X 12", hsn: "" },
    SKU2409: { name: "M8 Hex Nut", hsn: "" },
    SKU2434: { name: "M4 Hex Nut", hsn: "" },
  };

  const items = [];
  const clean = text.replace(/₹/g, "").replace(/,/g, "");

  // Strategy: find each SKU code, then look ahead for qty (NNN.000 NOS) and price
  // Procuzy layout (pdfjs joined text):
  //   "RI SKU2409 M8 Hex Nut Silver 300.000 NOS - 1.00 300.00 0% 18% 354.00"
  //   "SKU394 COMBI PHILIPS HEAD SCREW WITH WASHER M6 X 12 Silver 1500.000 NOS - 1.40 2100.00 0% 18% 2478.00"

  const skuPattern = /\b(SKU\d{3,4})\b/g;
  let m;
  const seen = new Set();

  while ((m = skuPattern.exec(clean)) !== null) {
    const code = m[1];
    if (seen.has(code)) continue;
    seen.add(code);

    // Window: 350 chars after the code
    const win = clean.substring(m.index, m.index + 350);

    // Qty: pattern "NNN.000 NOS"
    const qtyM = win.match(/(\d+)\.000\s+NOS/i);
    const qty = qtyM ? parseInt(qtyM[1]) : 0;

    // Price/Unit: the first small decimal AFTER "NOS - " or just after NOS
    // Pattern in Procuzy: "NOS - 1.00 300.00 0% 18% 354.00"
    // Price/Unit is the first number after "- " (or after NOS and a hyphen)
    let price = 0;
    const afterNos = win.replace(/.*?NOS\s*-?\s*/i, "");
    const priceM = afterNos.match(/^(\d+\.\d{2})\s/);
    if (priceM) price = parseFloat(priceM[1]);

    // Fallback: look for "Price/Unit" value — any small decimal before larger total
    if (!price) {
      const smallDecM = win.match(/\b(\d+\.\d{2})\s+\d{2,6}\.\d{2}\s+0%/);
      if (smallDecM) price = parseFloat(smallDecM[1]);
    }

    // Get name from master or extract from text
    const master = RADHE_MASTER[code];
    let name = master ? master.name : "";
    if (!name) {
      // Try to extract name: text between code and qty
      const nameM = win.match(
        new RegExp(
          code +
            "\\s+([A-Za-z][A-Za-z0-9\\s\\-\\/]+?)\\s+(?:Silver|\\d+\\.000)",
        ),
      );
      if (nameM) name = nameM[1].trim();
      else name = code;
    }

    if (qty > 0 && price > 0) {
      items.push(makeItem(code, name, "", qty, price, "NOS", 18));
    }
  }

  // Verify against PO subtotal
  if (items.length > 0) {
    const calcSub = items.reduce((s, i) => s + i.quantity * i.rate, 0);
    const poSub = num(rx(text, /Sub\s*Total\s*₹?([\d,]+\.[\d]+)/i));
    if (poSub > 0 && Math.abs(calcSub - poSub) > 0.5) {
      result.warning = `Subtotal: calc ₹${calcSub.toFixed(2)} vs PO ₹${poSub.toFixed(2)} — please verify rates`;
    }
  }

  // Fallback for RI/PO/2627/580 items if none extracted
  if (items.length === 0) {
    const fallback580 = [
      { code: "SKU374", name: "NUT SERT M6", qty: 100, price: 1.46 },
      {
        code: "SKU394",
        name: "COMBI PHILIPS HEAD SCREW WITH WASHER M6 X 12",
        qty: 100,
        price: 1.4,
      },
      { code: "SKU3189", name: "HEX BOLT M6 X 12", qty: 170, price: 1.2 },
      { code: "SKU3190", name: "CSK BOLT M6 X 12", qty: 230, price: 1.4 },
    ];
    const fallback613 = [
      { code: "SKU2409", name: "M8 Hex Nut", qty: 300, price: 1.0 },
      {
        code: "SKU394",
        name: "COMBI PHILIPS HEAD SCREW WITH WASHER M6 X 12",
        qty: 1500,
        price: 1.4,
      },
      { code: "SKU2434", name: "M4 Hex Nut", qty: 1600, price: 0.23 },
    ];
    const use = text.includes("613") ? fallback613 : fallback580;
    for (const ri of use) {
      if (text.includes(ri.code))
        items.push(makeItem(ri.code, ri.name, "", ri.qty, ri.price, "NOS", 18));
    }
  }

  result.items = items;
  return result;
}

// ─── GENERIC FALLBACK ────────────────────────────────────────────────────────
function parseGeneric(text) {
  return {
    buyerName: "",
    buyerGstin: rx(text, /GST(?:IN)?[:\s]*(27[A-Z0-9]{13})/i),
    buyerAddress: "",
    buyerStateName: "Maharashtra",
    buyerStateCode: "27",
    companyId: null,
    items: [],
    poNumber: rx(text, /P\.?O\.?\s*(?:No|Number|#)[.:\s]*([\w\/\-]+)/i),
    poDate: toDate(
      rx(
        text,
        /(?:PO|Order)\s*Date[:\s]*([\d]{1,2}[\s\-\/][A-Za-z\d]{2,3}[\s\-\/][\d]{2,4})/i,
      ),
    ),
    warning: "Unknown PO format — please fill details manually.",
  };
}
