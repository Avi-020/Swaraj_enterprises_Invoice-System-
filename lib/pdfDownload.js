// lib/pdfDownload.js
// Native jsPDF — multi-page support, no content cutting.
// Items table spans pages; footer always on last page.

import { SELLER, TAX_RATE, numberToWords } from "./demoData";

const PW = 210;
const PH = 297;
const M = 8; // margin
const CW = PW - 2 * M; // 194mm content width
const MID = M + CW * 0.52; // seller/buyer divider

// Item table column widths (must sum to CW=194)
// Sl(7)+Desc(80)+HSN(18)+Qty(20)+Rate(17)+per(12)+Disc(12)+Amt(28) = 194 ✓
const COLS = [
  { w: 7, label: "Sl\nNo.", align: "center" },
  { w: 80, label: "Description of Goods", align: "left" },
  { w: 18, label: "HSN/SAC", align: "center" },
  { w: 20, label: "Quantity", align: "right" },
  { w: 17, label: "Rate", align: "right" },
  { w: 12, label: "per", align: "center" },
  { w: 12, label: "Disc.%", align: "center" },
  { w: 28, label: "Amount", align: "right" },
];

export function downloadInvoicePdf(invoice) {
  const { jsPDF } = require("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  const {
    invoiceNo = "",
    invoiceDate = "",
    ewayBillNo = "",
    poNumber = "",
    poDate = "",
    buyer = {},
    items = [],
    transportDetails = {},
  } = invoice;

  // ── Self-contained totals ──────────────────────────────────────────────────
  const validItems = items.filter(
    (it) => it.name && Number(it.quantity) > 0 && Number(it.rate) > 0,
  );
  const taxableValue = validItems.reduce(
    (s, it) => s + Number(it.quantity) * Number(it.rate),
    0,
  );
  const cgst = Math.round(((taxableValue * TAX_RATE) / 100) * 100) / 100;
  const sgst = cgst;
  const totalBefore = taxableValue + cgst + sgst;
  const grandTotal = Math.round(totalBefore);
  const roundOff = Math.round((grandTotal - totalBefore) * 100) / 100;
  const totalQty = validItems.reduce((s, it) => s + Number(it.quantity), 0);

  // ── Drawing helpers ────────────────────────────────────────────────────────
  let y = M;
  let pageNum = 1;

  // Column X positions (computed once)
  const CX = [];
  let _cx = M;
  for (const col of COLS) {
    CX.push(_cx);
    _cx += col.w;
  }

  const ln = (x1, y1, x2, y2) => doc.line(x1, y1, x2, y2);
  const sf = (bold, size) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
  };
  const fmt = (n) =>
    (Number(n) || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const tx = (t, x, yy, align = "left", maxW = 0) => {
    t = String(t ?? "");
    const opts = {};
    if (align !== "left") opts.align = align;
    if (maxW > 0) opts.maxWidth = maxW;
    doc.text(t, x, yy, opts);
  };

  // Check if we need a new page; if so add one and reset y
  function checkPage(neededH = 20) {
    if (y + neededH > PH - M) {
      doc.addPage();
      pageNum++;
      y = M;
      ln(M, y, M + CW, y); // top border of new page
    }
  }

  // ── 1. HEADER ──────────────────────────────────────────────────────────────
  sf(true, 12);

  tx("GST TAX INVOICE", PW / 2, y + 5.5, "center");

  sf(false, 7);

  tx("(ORIGINAL FOR RECIPIENT)", PW / 2, y + 9.5, "center");
  sf(true, 9);
  tx("e-Invoice", M + CW - 1, y + 5.5, "right");
  y += 11;
  ln(M, y, M + CW, y);

  // ── 2. IRN ROW ─────────────────────────────────────────────────────────────
  sf(true, 7);
  tx("IRN :", M + 1, y + 3.5);
  sf(false, 7);
  tx(
    invoice.irn || "(will be generated on e-invoicing portal)",
    M + 10,
    y + 3.5,
  );
  sf(true, 7);
  tx("Ack No. :", M + 1, y + 7);
  sf(false, 7);
  tx(invoice.ackNo || "", M + 14, y + 7);
  sf(true, 7);
  tx("Ack Date :", M + 1, y + 10.5);
  sf(false, 7);
  tx(invoiceDate, M + 16, y + 10.5);
  y += 12;
  ln(M, y, M + CW, y);

  // ── 3. SELLER (left) + META (right) ────────────────────────────────────────
  const sellerH = 38;
  const rW = (M + CW - MID) / 2;

  // Seller block
  sf(true, 9);
  tx(SELLER.name, M + 1, y + 5);
  sf(false, 7);
  const sellerLines = [
    SELLER.address,
    `GSTIN/UIN: ${SELLER.gstin}`,
    `State Name : ${SELLER.stateName}, Code : ${SELLER.stateCode}`,
    `PAN: ${SELLER.pan}`,
    `Contact person : ${SELLER.contactPerson}`,
    `Contact : ${SELLER.contact}`,
    `E-Mail : ${SELLER.email}`,
  ];
  let sy = y + 9;
  for (const sl of sellerLines) {
    const wr = doc.splitTextToSize(sl, MID - M - 3);
    doc.text(wr, M + 1, sy);
    sy += wr.length * 3.2;
  }

  // Right meta grid
  ln(MID, y, MID, y + sellerH);
  const row1Y = y,
    row2Y = y + sellerH / 2;
  ln(M, row2Y, M + CW, row2Y);
  ln(MID + rW, y, MID + rW, y + sellerH);

  // Top-right: Invoice No + Dated
  sf(false, 6.5);
  tx("Invoice No.", MID + 1, row1Y + 4);
  sf(true, 10);
  tx(invoiceNo, MID + 1, row1Y + 9);
  sf(false, 6.5);
  tx("e-Way Bill No.", MID + 1, row1Y + 14);
  sf(false, 7);
  tx(ewayBillNo || "", MID + 1, row1Y + 19);
  sf(false, 6.5);
  tx(
    `Buyer Name : ${transportDetails.buyerNameTxt || ""}`,
    MID + 1,
    row1Y + 25,
  );
  // tx(transportDetails.buyerNameTxt || "", MID + 35, row1Y + 25);

  sf(false, 6.5);
  tx(`Cell No. : ${transportDetails.cellNo || ""}`, MID + 1, row1Y + 28);

  sf(false, 6.5);
  tx("Dated", MID + rW + 1, row1Y + 4);
  sf(true, 10);
  tx(invoiceDate, MID + rW + 1, row1Y + 9);
  sf(false, 6.5);
  tx("LR Details", MID + rW + 1, row1Y + 16);
  sf(false, 6.5);
  tx("PO Date", MID + rW + 1, row1Y + 23);
  sf(false, 7);
  tx(poDate || "", MID + rW + 1, row1Y + 26);

  // Bottom-right: PO + Dispatch
  sf(false, 6.5);
  tx("Department", MID + 1, row2Y + 3);
  sf(false, 6.5);
  tx("Purchase Order No.", MID + 1, row2Y + 12);
  sf(true, 8);
  tx(poNumber || "", MID + 1, row2Y + 15);
  sf(false, 6.5);
  tx(
    `Truck / Tempo No. : ${transportDetails.truckNo || ""}`,
    MID + 1,
    row2Y + 23,
  );
  sf(false, 7);
  // tx(transportDetails.truckNo || "", MID + 45, row2Y + 23);
  sf(false, 7);
  tx(transportDetails.dispatchThrough || "", MID + 1, row2Y + 30);

  sf(false, 6.5);
  tx("Material Given To", MID + rW + 1, row2Y + 15);
  sf(false, 6.5);
  tx("Destination", MID + rW + 1, row2Y + 10);
  sf(false, 7);
  tx(transportDetails.destination || "", MID + rW + 1, row2Y + 15);

  y += sellerH;
  ln(M, y, M + CW, y);

  // ── 4. BUYER + DELIVERY ────────────────────────────────────────────────────
  const buyerH = 30;
  ln(MID, y, MID, y + buyerH);
  sf(false, 6.5);
  tx("Buyer (Bill to)", M + 1, y + 4);
  sf(true, 8.5);
  tx(buyer.name || "", M + 1, y + 9);
  sf(false, 7);
  const blines = [
    buyer.address || "",
    `GSTIN/UIN : ${buyer.gstin || ""}`,
    `State Name : ${buyer.stateName || "Maharashtra"}, Code : ${buyer.stateCode || "27"}`,
    `Place of Supply: ${buyer.placeOfSupply || "Maharashtra"}`,
    buyer.contactPerson ? `Contact person : ${buyer.contactPerson}` : "",
    buyer.contact ? `Contact : ${buyer.contact}` : "",
  ].filter(Boolean);
  let bY = y + 14;
  for (const bl of blines) {
    const wr = doc.splitTextToSize(bl, MID - M - 3);
    doc.text(wr, M + 1, bY);
    bY += wr.length * 3.0;
  }
  sf(false, 6.5);
  tx("Delivery Address", MID + 1, y + 7);
  sf(false, 7);
  const dlv = doc.splitTextToSize(buyer.address || "", M + CW - MID - 3);
  doc.text(dlv, MID + 1, y + 10);
  y += buyerH;
  ln(M, y, M + CW, y);

  // ── 5. ITEM TABLE HEADER ───────────────────────────────────────────────────
  const HDR_H = 8;
  doc.setFillColor(248, 248, 248);
  doc.rect(M, y, CW, HDR_H, "F");
  sf(true, 7);
  COLS.forEach((col, i) => {
    if (i > 0) ln(CX[i], y, CX[i], y + HDR_H);
    const ax =
      col.align === "right"
        ? CX[i] + col.w - 1
        : col.align === "center"
          ? CX[i] + col.w / 2
          : CX[i] + 1;
    const parts = col.label.split("\n");
    if (parts.length === 2) {
      tx(parts[0], ax, y + 3, col.align);
      tx(parts[1], ax, y + 6.5, col.align);
    } else {
      tx(col.label, ax, y + 5, col.align);
    }
  });
  ln(M, y, M + CW, y);
  y += HDR_H;
  ln(M, y, M + CW, y);

  // ── 6. ITEM ROWS (with page-break support) ─────────────────────────────────
  const ROW_H = 7;
  const MIN_ROWS = 6;
  const displayItems = [...validItems];
  while (displayItems.length < MIN_ROWS) displayItems.push(null);

  for (let r = 0; r < displayItems.length; r++) {
    checkPage(ROW_H + 2);
    const it = displayItems[r];
    const rowY = y;

    ln(M, rowY + ROW_H, M + CW, rowY + ROW_H);
    COLS.forEach((col, i) => {
      if (i > 0) ln(CX[i], rowY, CX[i], rowY + ROW_H);
      if (!it) return;
      sf(false, 7);
      let val = "";
      if (i === 0) val = String(r + 1);
      else if (i === 1) {
        const wr = doc.splitTextToSize(it.name || "", col.w - 2);
        doc.text(wr.slice(0, 2), CX[i] + 1, rowY + 3);
        return;
      } else if (i === 2) val = it.hsn || "";
      else if (i === 3)
        val = `${Number(it.quantity).toLocaleString("en-IN")} Nos.`;
      else if (i === 4) val = fmt(it.rate);
      else if (i === 5) val = "Nos.";
      else if (i === 6) val = it.disc ? `${it.disc}%` : "";
      else if (i === 7) val = fmt(Number(it.quantity) * Number(it.rate));
      const ax =
        col.align === "right"
          ? CX[i] + col.w - 1
          : col.align === "center"
            ? CX[i] + col.w / 2
            : CX[i] + 1;
      tx(val, ax, rowY + 4.5, col.align);
    });
    y += ROW_H;
  }

  // ── 7. TOTALS ──────────────────────────────────────────────────────────────
  checkPage(42);
  const amtEndX = M + CW;
  const labelEndX = CX[7] - 1;

  ln(M, y, M + CW, y);
  sf(false, 8);
  tx(fmt(taxableValue), amtEndX - 1, y + 4.5, "right");
  y += 5;
  ln(CX[7], y, amtEndX, y);

  sf(false, 8);
  tx(`Output CGST @ ${TAX_RATE}%`, labelEndX - 20, y + 4.5, "right");
  tx(`${TAX_RATE} %`, labelEndX, y + 4.5, "right");
  tx(fmt(cgst), amtEndX - 1, y + 4.5, "right");
  y += 5;
  ln(CX[7], y, amtEndX, y);

  tx(`Output SGST @ ${TAX_RATE}%`, labelEndX - 20, y + 4.5, "right");
  tx(`${TAX_RATE} %`, labelEndX, y + 4.5, "right");
  tx(fmt(sgst), amtEndX - 1, y + 4.5, "right");
  y += 5;
  ln(CX[7], y, amtEndX, y);

  sf(false, 7.5);
  tx("Less :", M + 1, y + 4.5);
  tx("Rd.Off", labelEndX, y + 4.5, "right");
  if (Math.abs(roundOff) > 0)
    tx(fmt(Math.abs(roundOff)), amtEndX - 1, y + 4.5, "right");
  y += 5;
  ln(M, y, M + CW, y);

  sf(true, 9);
  tx("Total", CX[4] - 2, y + 5.5, "right");
  tx(`${totalQty.toLocaleString("en-IN")} Nos.`, CX[5] + 6, y + 5.5, "center");
  tx(fmt(grandTotal), amtEndX - 1, y + 5.5, "right");
  y += 8;
  ln(M, y, M + CW, y);

  // ── 8. AMOUNT IN WORDS ─────────────────────────────────────────────────────
  checkPage(14);
  sf(false, 7.5);
  tx("Amount Chargeable (in words)", M + 1, y + 3.5);
  sf(false, 7);
  tx("E. & O.E", amtEndX - 1, y + 3.5, "right");
  sf(true, 8);
  const wLines = doc.splitTextToSize(numberToWords(grandTotal), CW - 4);
  doc.text(wLines, M + 1, y + 7.5);
  y += 6 + wLines.length * 3.5;
  ln(M, y, M + CW, y);

  // ── 9. TAX TABLE ───────────────────────────────────────────────────────────
  checkPage(30);
  // Cols: TaxableVal(48)+CGSTRate(16)+CGSTAmt(38)+SGSTRate(16)+SGSTAmt(38)+TotalTax(38) = 194 ✓
  const TC = [48, 16, 38, 16, 38, 38];
  const TCX = [];
  let tcx = M;
  for (const w of TC) {
    TCX.push(tcx);
    tcx += w;
  }
  const TH = 5.5;

  doc.setFillColor(248, 248, 248);
  doc.rect(M, y, CW, TH * 2, "F");
  sf(true, 7);
  TC.forEach((w, i) => {
    if (i > 0) ln(TCX[i], y, TCX[i], y + TH * 2);
    const ax = TCX[i] + w / 2;
    const labels1 = [
      "Taxable Value",
      "CGST",
      "",
      "SGST/UTGST",
      "",
      "Total Tax Amount",
    ];
    const parts = labels1[i].split("\n");
    if (parts.length === 2) {
      tx(parts[0], ax, y + 2.5, "center");
      tx(parts[1], ax, y + 6, "center");
    } else if (labels1[i]) tx(labels1[i], ax, y + 4.5, "center");
  });
  ln(M, y + TH, M + CW, y + TH);
  sf(false, 7);
  ["", "Rate", "Amount", "Rate", "Amount", ""].forEach((l, i) => {
    if (l) tx(l, TCX[i] + TC[i] / 2, y + TH + 3.5, "center");
  });
  y += TH * 2;
  ln(M, y, M + CW, y);

  const taxAmt = Math.round(((taxableValue * TAX_RATE) / 100) * 100) / 100;
  sf(false, 7.5);
  TC.forEach((w, i) => {
    if (i > 0) ln(TCX[i], y, TCX[i], y + TH + 1);
    const ax = TCX[i] + w / 2;
    const vals = [
      fmt(taxableValue),
      `${TAX_RATE}%`,
      fmt(taxAmt),
      `${TAX_RATE}%`,
      fmt(taxAmt),
      fmt(taxAmt * 2),
    ];
    const align = i === 1 || i === 3 ? "center" : "right";
    tx(vals[i], align === "right" ? TCX[i] + w - 1 : ax, y + 4, align);
  });
  y += TH + 1;
  ln(M, y, M + CW, y);

  sf(true, 7.5);
  tx(`Total: ${fmt(taxableValue)}`, TCX[0] + TC[0] - 1, y + 4, "right");
  TC.forEach((w, i) => {
    if (i > 0) ln(TCX[i], y, TCX[i], y + TH + 1);
  });
  tx(fmt(taxAmt), TCX[2] + TC[2] - 1, y + 4, "right");
  tx(fmt(taxAmt), TCX[4] + TC[4] - 1, y + 4, "right");
  tx(fmt(taxAmt * 2), TCX[5] + TC[5] - 1, y + 4, "right");
  y += TH + 1;
  ln(M, y, M + CW, y);

  sf(true, 7.5);
  tx("Tax Amount (in words) :", M + 1, y + 4);
  sf(false, 7.5);
  tx(numberToWords(+(cgst + sgst).toFixed(2)), M + 44, y + 4);
  y += 6.5;
  ln(M, y, M + CW, y);

  // ── 10. DECLARATION + BANK ─────────────────────────────────────────────────
  checkPage(38);
  const declH = 38;
  ln(MID, y, MID, y + declH);
  sf(true, 7.5);
  tx(`Company's PAN : ${SELLER.pan}`, M + 1, y + 4);
  sf(true, 7.5);
  tx("Declaration", M + 1, y + 8.5);
  sf(false, 6.5);
  const declText =
    '"I/We certify that my/our registration certificate under the GST Act, 2017 is in force on the date on which the supply of the goods specified in this Tax Invoice is made by me/us & the transaction of supply covered by this Tax Invoice has been effected by me/us & it shall be acounted for in the turnover of supplies while filling of return & the due tax if any payable on the supplies has been paid or shall be paid"';
  const dLines = doc.splitTextToSize(declText, MID - M - 3);
  doc.text(dLines, M + 1, y + 13);
  sf(false, 7.5);
  tx("Customer's Seal and Signature", M + 1, y + declH - 3);

  sf(true, 7.5);
  tx("Company's Bank Details", MID + 1, y + 4);
  sf(false, 7.5);
  const bankRows = [
    `A/c Holder's Name : ${SELLER.bank.accountHolder}`,
    `Bank Name         : ${SELLER.bank.bankName}`,
    `A/c No.           : ${SELLER.bank.accountNo}`,
    `Branch & IFS Code : ${SELLER.bank.branchIFSC}`,
  ];
  let bkY = y + 9;
  for (const br of bankRows) {
    const bls = doc.splitTextToSize(br, M + CW - MID - 3);
    doc.text(bls, MID + 1, bkY);
    bkY += bls.length * 3.5;
  }
  sf(true, 7.5);
  tx(`for ${SELLER.name}`, M + CW - 1, y + declH - 6, "right");
  y += declH;
  ln(M, y, M + CW, y);

  // ── 11. SIGNATORIES ────────────────────────────────────────────────────────
  checkPage(20);
  const sigH = 16,
    sigW = CW / 3;
  ln(M + sigW, y, M + sigW, y + sigH);
  ln(M + sigW * 2, y, M + sigW * 2, y + sigH);
  sf(false, 7.5);
  tx("Prepared by", M + 1, y + sigH - 2);
  tx("Verified by", M + sigW + 1, y + sigH - 2);
  tx("Authorised Signatory", M + CW - 1, y + sigH - 2, "right");
  y += sigH;
  ln(M, y, M + CW, y);

  // ── 12. FOOTER ─────────────────────────────────────────────────────────────
  checkPage(12);
  sf(false, 7.5);
  tx("SUBJECT TO PUNE JURISDICTION", PW / 2, y + 4, "center");
  tx("This is a Computer Generated Invoice", PW / 2, y + 8, "center");
  y += 10;

  // ── OUTER BORDER (only page 1) ─────────────────────────────────────────────
  // For multi-page we just rely on section lines; outer border wraps content on p1
  if (pageNum === 1) {
    doc.rect(M, M, CW, y - M, "S");
  }

  doc.save(`Invoice-${invoiceNo || "draft"}.pdf`);
}
