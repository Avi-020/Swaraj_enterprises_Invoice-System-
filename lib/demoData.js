// lib/demoData.js

export const TAX_RATE = 9; // 9% CGST + 9% SGST = 18% total

export const SELLER = {
  name: "SWARAJ ENTERPRISES",
  address:
    "Sr.No.459, Darawali Paud Road, Near Satya Minerals P.Ltd, Ambarwat, Pune - 411215",
  stateName: "Maharashtra",
  stateCode: "27",
  gstin: "27FCAPD0576D1Z0",
  pan: "FCAPD0576D",
  contactPerson: "Mr. Swaraj Dhamale",
  contact: "7057272227",
  email: "swarajenterprise27@gmail.com",
  bank: {
    accountHolder: "SWARAJ ENTERPRISES",
    bankName: "HDFC Bank Ltd.",
    accountNo: "01048640000281",
    branchIFSC: "Shankar Sheth Road & HDFC0000104",
  },
};

// numberToWords — Indian system
const ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
function two(n) {
  return n < 20
    ? ones[n]
    : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
}
function three(n) {
  return n >= 100
    ? ones[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + two(n % 100) : "")
    : two(n);
}
export function numberToWords(amount) {
  if (!amount || amount === 0) return "Zero";
  amount = Math.round(amount * 100) / 100;
  const r = Math.floor(amount);
  const p = Math.round((amount - r) * 100);
  let res = "",
    n = r;
  if (n >= 10000000) {
    res += three(Math.floor(n / 10000000)) + " Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    res += two(Math.floor(n / 100000)) + " Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    res += two(Math.floor(n / 1000)) + " Thousand ";
    n %= 1000;
  }
  if (n >= 100) {
    res += ones[Math.floor(n / 100)] + " Hundred ";
    n %= 100;
  }
  if (n > 0) res += two(n);
  return (
    "Indian Rupees " +
    res.trim() +
    (p > 0 ? " and " + two(p) + " Paise" : "") +
    " Only"
  );
}

// ── COMPANIES ────────────────────────────────────────────────────────────────
export const COMPANIES = [
  {
    id: "kvsteel",
    name: "K.V. Steel And Pipes Private Limited",
    gstin: "27AADCK8810E1ZN",
    address:
      "538, Ganesh Peth, Himalaya Complex, Shop No:-1 & 2, Near Ghaseti Pool, Dhor Galli, Pune-411002.",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "Mr. K.V. Steel Team",
    contact: "020-26050505",
    deliveryAddress:
      "538, Ganesh Peth, Himalaya Complex, Shop No:-1 & 2, Near Ghaseti Pool, Dhor Galli, Pune-411002.",
    paymentTerms: "30 Days",
  },
  {
    id: "wohr",
    name: "Wohr Parking Systems Pvt. Ltd.",
    gstin: "27AAACW6100A1ZZ",
    address:
      "Wohr Parking Systems Pvt. Ltd. Unit - I, Gat No. 1098, Urawade Road, Pirangut, Tal Mulshi, Pune - 412115",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "Vishal Shete",
    contact: "+91-20-2553 61 81",
    deliveryAddress:
      "Wohr Parking Systems Pvt. Ltd. Unit - I, Gat No. 1098, Urawade Road, Pirangut, Tal Mulshi, 412115 Pune",
    paymentTerms: "100% Net Due-30 Days",
  },
  {
    id: "intech",
    name: "Intech Surface Coating Pvt. Ltd.",
    gstin: "27AAACI4150J1ZO",
    address: "1073/1-2-3, Pirangoot, Pune - 412115",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "",
    contact: "(020) 22922172",
    deliveryAddress: "1073/1-2-3, Pirangoot, 412115, Pune",
    paymentTerms: "60 Days After Delivery",
  },
  {
    id: "statfield",
    name: "Statfield (India) Private Limited",
    gstin: "27AACCS5982J1ZU",
    address: "1073/1-2-3, Pirangoot, Pune - 412115",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "",
    contact: "(020) 22922172",
    deliveryAddress: "1073/1-2-3, Pirangoot, 412115, Pune",
    paymentTerms: "60 Days After Delivery",
  },
  {
    id: "galaxy",
    name: "Galaxy Parking Systems Pvt Ltd",
    gstin: "27AAJCG3944M1Z3",
    address:
      "Office No.1202, Floor No. 12, Mayuresh Cosmos Premises, Plot No.37, Sector-11, CBD Belapur, Navi Mumbai - 400 614",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "",
    contact: "",
    deliveryAddress:
      "Survey no 108/1/B/2, Wawanje village, Taloja MIDC, Taluka-Panvel, Dist-Raigad, Pin-410208",
    paymentTerms: "30 Days Credit",
  },
  {
    id: "radhe",
    name: "Radhe Industries",
    gstin: "27AAPFR7137Q1Z7",
    address:
      "A3-A7, New Jawaharlal Nehru Ind Est, Mukawadi, Pirangut, Mulshi, Pune - 412115",
    stateName: "Maharashtra",
    stateCode: "27",
    placeOfSupply: "Maharashtra",
    contactPerson: "",
    contact: "9819089958",
    deliveryAddress:
      "A3-A7, New Jawaharlal Nehru Ind Est, Mukawadi, Pirangut, Mulshi, Pune 412115",
    paymentTerms: "45 Days Post Delivery",
  },
];

// ── PRODUCTS ─────────────────────────────────────────────────────────────────
// Each product has:
//   id, name (display), code, hsn, unit, defaultPrice
//   prices: { companyId: rate }  — price per unit for each company
export const PRODUCTS = [
  // ── From real invoice 12233 (K.V. Steel) ──
  {
    id: "ht-ac-1050",
    name: "HT Allen Cap 10*50 H.T.",
    code: "HT-AC-1050",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 25,
    prices: {
      kvsteel: 25.0,
      wohr: 24.0,
      intech: 24.0,
      statfield: 24.0,
      galaxy: 26.0,
      radhe: 26.0,
    },
  },
  {
    id: "ht-ac-10110",
    name: "HT Allen Cap 10*110",
    code: "HT-AC-10110",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 75,
    prices: {
      kvsteel: 75.0,
      wohr: 73.0,
      intech: 73.0,
      statfield: 73.0,
      galaxy: 76.0,
      radhe: 76.0,
    },
  },
  {
    id: "hn-m4-din934",
    name: "Hex Nut M4 DIN 934 8 Tensile Grade",
    code: "HN-M4-DIN934",
    hsn: "73182400",
    unit: "Nos.",
    defaultPrice: 6.2,
    prices: {
      kvsteel: 6.2,
      wohr: 6.0,
      intech: 6.0,
      statfield: 6.0,
      galaxy: 6.5,
      radhe: 6.5,
    },
  },

  // ── Wohr Parking (from PO 4500010776) ──
  {
    id: "c618-0501",
    name: "HEX NUT M4 DIN 934 8 TENSILE GRADE",
    code: "C618-0501",
    hsn: "84313990",
    unit: "Nos.",
    defaultPrice: 0.35,
    prices: {
      kvsteel: 0.4,
      wohr: 0.35,
      intech: 0.38,
      statfield: 0.38,
      galaxy: 0.4,
      radhe: 0.4,
    },
  },
  {
    id: "c602-0111",
    name: "CYLINDER SCREW M5X16 DIN 912 8.8 ZK",
    code: "C602-0111",
    hsn: "84313990",
    unit: "Nos.",
    defaultPrice: 1.27,
    prices: {
      kvsteel: 1.3,
      wohr: 1.27,
      intech: 1.3,
      statfield: 1.3,
      galaxy: 1.35,
      radhe: 1.35,
    },
  },
  {
    id: "c408-1361",
    name: "THREADED ROD M16X235 DIN 975 8.8 ZK",
    code: "C408-1361",
    hsn: "84313990",
    unit: "Nos.",
    defaultPrice: 53.0,
    prices: {
      kvsteel: 54.0,
      wohr: 53.0,
      intech: 55.0,
      statfield: 55.0,
      galaxy: 56.0,
      radhe: 56.0,
    },
  },
  {
    id: "c408-1306",
    name: "WASHER M5, DIN 125 ST ZK",
    code: "C408-1306",
    hsn: "84313990",
    unit: "Nos.",
    defaultPrice: 0.25,
    prices: {
      kvsteel: 0.28,
      wohr: 0.25,
      intech: 0.28,
      statfield: 0.28,
      galaxy: 0.3,
      radhe: 0.3,
    },
  },
  {
    id: "c408-1451",
    name: "THREADED ROD M12X165 DIN 975 8.8 ZK",
    code: "C408-1451",
    hsn: "84313990",
    unit: "Nos.",
    defaultPrice: 35.0,
    prices: {
      kvsteel: 36.0,
      wohr: 35.0,
      intech: 36.0,
      statfield: 36.0,
      galaxy: 37.0,
      radhe: 37.0,
    },
  },

  // ── Intech / Statfield ──
  {
    id: "bhsspw1004",
    name: "WASHER PLAIN SS 304 M 12",
    code: "BHSSPW1004",
    hsn: "73182200",
    unit: "Nos.",
    defaultPrice: 5.5,
    prices: {
      kvsteel: 5.6,
      wohr: 5.0,
      intech: 5.5,
      statfield: 5.5,
      galaxy: 5.75,
      radhe: 5.75,
    },
  },
  {
    id: "bhhttn1001",
    name: "NUT HIGH TENSILE HEX M12",
    code: "BHHTTN1001",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 3.6,
    prices: {
      kvsteel: 3.7,
      wohr: 3.4,
      intech: 3.6,
      statfield: 3.6,
      galaxy: 3.8,
      radhe: 3.8,
    },
  },
  {
    id: "bhmssw1006",
    name: "WASHER MS SPRING M12",
    code: "BHMSSW1006",
    hsn: "73182200",
    unit: "Nos.",
    defaultPrice: 1.0,
    prices: {
      kvsteel: 1.05,
      wohr: 0.9,
      intech: 1.0,
      statfield: 1.0,
      galaxy: 1.1,
      radhe: 1.1,
    },
  },

  // ── Radhe Industries ──
  {
    id: "sku374",
    name: "NUT SERT M6",
    code: "SKU374",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 1.46,
    prices: {
      kvsteel: 1.5,
      wohr: 1.4,
      intech: 1.42,
      statfield: 1.42,
      galaxy: 1.45,
      radhe: 1.46,
    },
  },
  {
    id: "sku394",
    name: "COMBI PHILLIPS HEAD SCREW WITH WASHER M6 X 12",
    code: "SKU394",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 1.4,
    prices: {
      kvsteel: 1.42,
      wohr: 1.35,
      intech: 1.37,
      statfield: 1.37,
      galaxy: 1.39,
      radhe: 1.4,
    },
  },
  {
    id: "sku3189",
    name: "HEX BOLT M6 X 12",
    code: "SKU3189",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 1.2,
    prices: {
      kvsteel: 1.22,
      wohr: 1.15,
      intech: 1.17,
      statfield: 1.17,
      galaxy: 1.19,
      radhe: 1.2,
    },
  },
  {
    id: "sku3190",
    name: "CSK BOLT M6 X 12",
    code: "SKU3190",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 1.4,
    prices: {
      kvsteel: 1.42,
      wohr: 1.35,
      intech: 1.37,
      statfield: 1.37,
      galaxy: 1.39,
      radhe: 1.4,
    },
  },

  // ── General fasteners ──
  {
    id: "hb-m8-30",
    name: "HEX BOLT M8 X 30 GR 8.8",
    code: "HB-M8-30",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 4.5,
    prices: {
      kvsteel: 4.5,
      wohr: 4.2,
      intech: 4.3,
      statfield: 4.3,
      galaxy: 4.6,
      radhe: 4.6,
    },
  },
  {
    id: "hb-m10-40",
    name: "HEX BOLT M10 X 40 GR 8.8",
    code: "HB-M10-40",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 8.0,
    prices: {
      kvsteel: 8.0,
      wohr: 7.5,
      intech: 7.8,
      statfield: 7.8,
      galaxy: 8.2,
      radhe: 8.2,
    },
  },
  {
    id: "hn-m8",
    name: "HEX NUT M8 GR 8",
    code: "HN-M8",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 2.5,
    prices: {
      kvsteel: 2.5,
      wohr: 2.3,
      intech: 2.4,
      statfield: 2.4,
      galaxy: 2.6,
      radhe: 2.6,
    },
  },
  {
    id: "hn-m10",
    name: "HEX NUT M10 GR 8",
    code: "HN-M10",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 3.5,
    prices: {
      kvsteel: 3.5,
      wohr: 3.2,
      intech: 3.3,
      statfield: 3.3,
      galaxy: 3.6,
      radhe: 3.6,
    },
  },
  {
    id: "sw-m8",
    name: "SPRING WASHER M8",
    code: "SW-M8",
    hsn: "73182200",
    unit: "Nos.",
    defaultPrice: 0.8,
    prices: {
      kvsteel: 0.8,
      wohr: 0.7,
      intech: 0.75,
      statfield: 0.75,
      galaxy: 0.85,
      radhe: 0.85,
    },
  },
  {
    id: "pw-m8",
    name: "PLAIN WASHER M8",
    code: "PW-M8",
    hsn: "73182200",
    unit: "Nos.",
    defaultPrice: 0.6,
    prices: {
      kvsteel: 0.6,
      wohr: 0.55,
      intech: 0.58,
      statfield: 0.58,
      galaxy: 0.65,
      radhe: 0.65,
    },
  },
  {
    id: "sku2409",
    name: "M8 Hex Nut",
    code: "SKU2409",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 1.0,
    prices: {
      kvsteel: 1.05,
      wohr: 0.95,
      intech: 0.98,
      statfield: 0.98,
      galaxy: 1.02,
      radhe: 1.0,
    },
  },
  {
    id: "sku2434",
    name: "M4 Hex Nut",
    code: "SKU2434",
    hsn: "73181600",
    unit: "Nos.",
    defaultPrice: 0.23,
    prices: {
      kvsteel: 0.25,
      wohr: 0.22,
      intech: 0.23,
      statfield: 0.23,
      galaxy: 0.24,
      radhe: 0.23,
    },
  },
  {
    id: "hdwg1",
    name: "Hardware Item", // Replace with actual name
    code: "HDWG1",
    hsn: "73181500",
    unit: "Nos.",
    defaultPrice: 183424,
    prices: {
      kvsteel: 0,
      wohr: 180000,
      intech: 181000,
      statfield: 181000,
      galaxy: 183424,
      radhe: 183500,
    },
  },
];

// Get price for a specific product + company combination
export function getPriceForCompany(productId, companyId) {
  const p = PRODUCTS.find((x) => x.id === productId);
  if (!p) return 0;
  return p.prices[companyId] ?? p.defaultPrice ?? 0;
}

// Legacy helpers kept for backward compatibility
export function getProductPrice(code, companyId) {
  const p = PRODUCTS.find((x) => x.code === code || x.id === code);
  if (!p) return 0;
  return p.prices[companyId] ?? p.defaultPrice ?? 0;
}
export function getCompanyById(id) {
  return COMPANIES.find((c) => c.id === id) || null;
}
