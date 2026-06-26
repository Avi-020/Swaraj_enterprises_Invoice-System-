// lib/googleSheets.js
// Paste your deployed Google Apps Script Web App URL here:
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE'

// ── Invoice number management ─────────────────────────────────────────────────
// Stored in localStorage under key 'sw_inv_no'
// Format: year prefix + sequential number e.g. "2627-001" (FY 2026-27)
// Auto-increments ONLY after successful save to Google Sheets.

export function getCurrentInvoiceNo() {
  if (typeof window === 'undefined') return getNextSeq()
  const stored = localStorage.getItem('sw_inv_no')
  if (!stored) {
    const initial = formatInvNo(1)
    localStorage.setItem('sw_inv_no', JSON.stringify({ seq: 1, no: initial }))
    return initial
  }
  try {
    const { no } = JSON.parse(stored)
    return no
  } catch {
    return formatInvNo(1)
  }
}

export function incrementInvoiceNo() {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem('sw_inv_no')
  let seq = 1
  try { seq = (JSON.parse(stored || '{}').seq || 0) + 1 } catch {}
  const no = formatInvNo(seq)
  localStorage.setItem('sw_inv_no', JSON.stringify({ seq, no }))
  return no
}

function formatInvNo(seq) {
  // FY prefix: if current month >= April, FY is currentYear-(currentYear+1)
  const now = new Date()
  const yr  = now.getFullYear()
  const mo  = now.getMonth() + 1 // 1-12
  const fyStart = mo >= 4 ? yr : yr - 1
  const fyEnd   = (fyStart + 1).toString().slice(-2)
  const prefix  = `${fyStart.toString().slice(-2)}${fyEnd}` // e.g. "2627"
  const padded  = String(seq).padStart(3, '0')
  return `${prefix}-${padded}`
}

// ── Save to Google Sheets ─────────────────────────────────────────────────────
export async function saveInvoiceToSheet(data) {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_URL_HERE') {
    console.warn('Google Sheets not configured — skipping save.')
    return { skipped: true }
  }

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceNo:      data.invoiceNo      || '',
        invoiceDate:    data.invoiceDate    || '',
        buyerName:      data.buyerName      || '',
        buyerGstin:     data.buyerGstin     || '',
        poNumber:       data.poNumber       || '',
        poDate:         data.poDate         || '',
        items:          (data.items || []).map(it =>
          `${it.name}(${it.quantity}×₹${it.rate})`).join('; '),
        taxableValue:   Number(data.taxableValue   || 0),
        cgstAmount:     Number(data.cgstAmount     || 0),
        sgstAmount:     Number(data.sgstAmount     || 0),
        totalTaxAmount: Number(data.totalTaxAmount || 0),
        grandTotal:     Number(data.grandTotal     || 0),
        amountInWords:  data.amountInWords  || '',
        savedAt:        new Date().toISOString(),
      }),
    })

    if (res.ok) {
      // Auto-increment invoice number only on successful save
      const nextNo = incrementInvoiceNo()
      return { ok: true, nextInvoiceNo: nextNo }
    }
    return { ok: false, error: `HTTP ${res.status}` }
  } catch (err) {
    console.error('Sheets error:', err)
    return { ok: false, error: err.message }
  }
}
