const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby40n0rnGtDwq7pSloSMRDyBtRaqYUadOjxp2tOyr6BL7H_nlXJgPjUC8KIrl54WF_NTg/exec";

function getFY() {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth() + 1;
  const fyStart = mo >= 4 ? yr : yr - 1;
  const fyEnd = (fyStart + 1).toString().slice(-2);
  return fyStart.toString().slice(-2) + fyEnd;
}

export function getCurrentInvoiceNo() {
  if (typeof window === "undefined") return getFY() + "-001";
  const raw = localStorage.getItem("sw_inv_no");
  if (!raw) {
    const no = getFY() + "-001";
    localStorage.setItem("sw_inv_no", JSON.stringify({ seq: 1, no }));
    return no;
  }
  try {
    return JSON.parse(raw).no;
  } catch {
    return getFY() + "-001";
  }
}

export function incrementInvoiceNo() {
  if (typeof window === "undefined") return;
  let seq = 1;
  try {
    seq = (JSON.parse(localStorage.getItem("sw_inv_no") || "{}").seq || 0) + 1;
  } catch {}
  const no = getFY() + "-" + String(seq).padStart(3, "0");
  localStorage.setItem("sw_inv_no", JSON.stringify({ seq, no }));
  return no;
}

export async function saveInvoiceToSheet(invoice) {
  try {
    const row = {
      invoiceNo: String(invoice.invoiceNo || ""),
      invoiceDate: String(invoice.invoiceDate || ""),
      poNumber: String(invoice.poNumber || ""),
      poDate: String(invoice.poDate || ""),
      buyerName: String(invoice.buyerName || ""),
      buyerGstin: String(invoice.buyerGstin || ""),
      buyerAddress: String(
        invoice.buyerAddress || invoice.buyer?.address || "",
      ),

      items: (invoice.items || [])
        .map((it) => `${it.name}(${it.quantity}×₹${it.rate})`)
        .join("; "),
      taxableValue: Number(invoice.taxableValue || 0),
      cgstAmount: Number(invoice.cgstAmount || 0),
      sgstAmount: Number(invoice.sgstAmount || 0),
      totalTaxAmount: Number(invoice.totalTaxAmount || 0),
      grandTotal: Number(invoice.grandTotal || 0),
      amountInWords: String(invoice.amountInWords || ""),
      savedAt: new Date().toISOString(),
    };

    const res = await fetch("/api/save-invoice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row),
    });

    const json = await res.json();

    if (res.ok && json.status === "success") {
      const nextNo = incrementInvoiceNo();
      return { ok: true, nextInvoiceNo: nextNo };
    }
    return { ok: false, error: json.error || "Error" };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function fetchInvoiceData() {
  try {
    const res = await fetch("/api/get-invoices");
    const json = await res.json();
    return { rows: json.rows || [] };
  } catch (err) {
    return { rows: [], error: err.message };
  }
}
