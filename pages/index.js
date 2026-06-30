// pages/index.js — Swaraj Enterprises Invoice Generator
// Fixed: product dropdown working, PDF download fixed (passes invoice object, not DOM id)

import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import {
  SELLER,
  COMPANIES,
  PRODUCTS,
  getPriceForCompany,
  TAX_RATE,
  numberToWords,
} from "../lib/demoData";
import { parsePOFromFile } from "../lib/poParser";
import InvoicePreview from "../components/InvoicePreview";
import {
  saveInvoiceToSheet,
  getCurrentInvoiceNo,
  incrementInvoiceNo,
} from "../lib/googleSheets";

function todayStr() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

// ─── Searchable Company combobox ────────────────────────────────────────────
function CompanyCombobox({ value, onChange }) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const filtered = COMPANIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  );

  function select(company) {
    onChange(company);
    setQuery(company.name);
    setOpen(false);
  }

  function handleManual(name) {
    setQuery(name);
    const match = COMPANIES.find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (match) {
      onChange(match);
    } else {
      onChange({
        id: "manual",
        name,
        address: "",
        gstin: "",
        stateName: "Maharashtra",
        stateCode: "27",
        placeOfSupply: "Maharashtra",
        contactPerson: "",
        contact: "",
      });
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          handleManual(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search or type company name..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => select(c)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
                fontSize: "13px",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#EFF6FF")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
            >
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontSize: "11px", color: "#64748B" }}>
                {c.gstin} · {c.stateName}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Searchable Product combobox ─────────────────────────────────────────────
function ProductCombobox({ value, onChange, companyId }) {
  const [query, setQuery] = useState(value?.name || "");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setQuery(value?.name || "");
  }, [value?.name]);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Filter by name OR code
  const filtered =
    query.length < 1
      ? PRODUCTS
      : PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.code.toLowerCase().includes(query.toLowerCase()),
        );

  function select(product) {
    const price = companyId
      ? getPriceForCompany(product.id, companyId)
      : product.defaultPrice;
    onChange({
      productId: product.id,
      name: product.name,
      hsn: product.hsn,
      unit: product.unit,
      rate: price,
    });
    setQuery(product.name);
    setOpen(false);
  }

  function handleManualInput(name) {
    setQuery(name);
    const match = PRODUCTS.find(
      (p) => p.name.toLowerCase() === name.toLowerCase(),
    );
    if (match) {
      select(match);
    } else {
      onChange({ productId: "manual", name, hsn: "", unit: "Nos.", rate: "" });
    }
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          handleManualInput(e.target.value);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        placeholder="Search or type product name..."
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-200 outline-none"
      />
      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {filtered.map((p) => {
            const price = companyId
              ? getPriceForCompany(p.id, companyId)
              : p.defaultPrice;
            return (
              <div
                key={p.id}
                onClick={() => select(p)}
                style={{
                  padding: "7px 12px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: "12px",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#EFF6FF")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                <div style={{ fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: "10px", color: "#64748B" }}>
                  Code: {p.code} · HSN: {p.hsn} · ₹{price} / {p.unit}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Empty item ───────────────────────────────────────────────────────────────
const emptyItem = () => ({
  productId: "",
  name: "",
  hsn: "",
  unit: "Nos.",
  quantity: "",
  rate: "",
  disc: "",
});

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvoiceGenerator() {
  const [company, setCompany] = useState(null);
  const [invoiceNo, setInvoiceNo] = useState("");

  useEffect(() => {
    // Load current invoice number from localStorage on mount
    const { syncInvoiceNoWithSheets } = require("../lib/googleSheets");
    syncInvoiceNoWithSheets().then((no) => setInvoiceNo(no));
  }, []);
  const [invoiceDate, setInvoiceDate] = useState(todayStr());
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState("");
  const [dispatch, setDispatch] = useState("");
  const [destination, setDestination] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [buyerNameTxt, setBuyerNameTxt] = useState("");
  const [cellNo, setCellNo] = useState("");
  const [items, setItems] = useState([emptyItem()]);
  const [showPreview, setShowPreview] = useState(false);
  const [poFile, setPoFile] = useState("");
  const [poWarnings, setPoWarnings] = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const fileRef = useRef(null);

  // Update single field of item at index i
  function updateItem(i, field, val) {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
  }

  // Product selected from combobox — merge fields but keep existing quantity
  function onProductSelect(i, data) {
    setItems((prev) => {
      const next = [...prev];
      const existing = next[i];
      next[i] = {
        ...existing,
        ...data,
        // Don't overwrite quantity if already set from PO or manual entry
        quantity: existing.quantity || data.quantity || "",
      };
      return next;
    });
  }

  // Company changed — reprice all existing items
  function onCompanyChange(c) {
    setCompany(c);
    setItems((prev) =>
      prev.map((it) => {
        if (!it.productId || it.productId === "manual") return it;
        return { ...it, rate: getPriceForCompany(it.productId, c.id) };
      }),
    );
  }

  // PO PDF upload + extraction
  async function handlePo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPoFile(file.name);
    setExtracting(true);
    setPoWarnings([]);
    try {
      const data = await parsePOFromFile(file);
      if (data.poNumber) setPoNumber(data.poNumber);
      if (data.poDate) setPoDate(data.poDate);

      // Match company from extraction
      if (data.companyId) {
        const matched = COMPANIES.find((c) => c.id === data.companyId);
        if (matched) onCompanyChange(matched);
      } else if (data.buyerGstin) {
        const matched = COMPANIES.find((c) => c.gstin === data.buyerGstin);
        if (matched) onCompanyChange(matched);
      }

      if (data.items && data.items.length > 0) {
        setItems(
          data.items.map((it) => ({
            productId: it.code || "manual",
            name: it.description || it.name || "",
            hsn: it.hsn || "",
            unit: it.unit || "Nos.",
            quantity: it.qty || it.quantity || "",
            rate: it.rate || "",
            disc: "",
          })),
        );
      }
      if (data.warning) setPoWarnings([data.warning]);
    } catch (err) {
      setPoWarnings(["Failed to read PDF: " + err.message]);
    } finally {
      setExtracting(false);
    }
  }

  // Build invoice object passed to preview + PDF + sheets
  function buildInvoice() {
    const validItems = items
      .filter((it) => {
        // Accept items that have either (name OR description) AND (quantity OR qty) AND rate
        const hasName = it.name || it.description;
        const hasQty = Number(it.quantity || it.qty) > 0;
        const hasRate = Number(it.rate) > 0;
        return hasName && hasQty && hasRate;
      })
      .map((it) => ({
        productId: it.productId || "manual",
        name: it.name || it.description || "",
        hsn: it.hsn || "",
        quantity: Number(it.quantity || it.qty) || 0,
        rate: Number(it.rate) || 0,
        unit: it.unit || "Nos.",
        disc: it.disc || "",
        amount: +(Number(it.quantity || it.qty) * Number(it.rate)).toFixed(2),
      }));

    const buyer = company
      ? {
          name: company.name || "",
          address: company.address || "",
          gstin: company.gstin || "",
          stateName: company.stateName || "Maharashtra",
          stateCode: company.stateCode || "27",
          placeOfSupply: company.placeOfSupply || "Maharashtra",
          contactPerson: company.contactPerson || "",
          contact: company.contact || "",
        }
      : {
          name: "— Select Company —",
          address: "",
          gstin: "",
          stateName: "",
          stateCode: "",
          placeOfSupply: "",
          contactPerson: "",
          contact: "",
        };

    return {
      invoiceNo,
      invoiceDate,
      poNumber,
      poDate,
      buyer,
      items: validItems,
      transportDetails: {
        dispatchThrough: dispatch,
        destination,
        truckNo,
        buyerNameTxt,
        cellNo,
      },
    };
  }

  const invoice = buildInvoice();
  const canAction = company && invoiceNo && invoice.items.length > 0;

  // Generate — save to sheets + download PDF
  async function handleGenerate() {
    if (!canAction) return;
    setDownloading(true);
    setSaveStatus("saving");

    const tv = invoice.items.reduce((s, it) => s + it.amount, 0);
    const cgst = +((tv * TAX_RATE) / 100).toFixed(2);
    const sgst = cgst;
    const grand = Math.round(tv + cgst + sgst);

    // Save to Google Sheets
    const res = await saveInvoiceToSheet({
      invoiceNo,
      invoiceDate,
      poNumber,
      poDate,
      buyerName: invoice.buyer.name,
      buyerGstin: invoice.buyer.gstin,
      buyerAddress: invoice.buyer.address,
      items: invoice.items,
      taxableValue: tv,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalTaxAmount: +(cgst + sgst).toFixed(2),
      grandTotal: grand,
      amountInWords: numberToWords(grand),
    });

    if (res.skipped) {
      setSaveStatus("skipped");
    } else if (res.ok) {
      setSaveStatus("saved");
      // ✅ Auto-increment invoice number after successful Google Sheets save
      if (res.nextInvoiceNo) {
        setInvoiceNo(res.nextInvoiceNo);
      }
    } else {
      setSaveStatus("error");
    }

    // Download PDF
    try {
      const { downloadInvoicePdf } = await import("../lib/pdfDownload");
      downloadInvoicePdf(invoice);
    } catch (err) {
      alert("PDF error: " + err.message);
      console.error(err);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Swaraj Enterprises — Invoice Generator</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-slate-100">
        {/* Header */}
        <header className="bg-[#0F2A4A] text-white py-4 px-6 shadow-lg">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{SELLER.name}</h1>
              <p className="text-slate-300 text-xs">
                GST Invoice Generator &nbsp;·&nbsp; {SELLER.gstin}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400 hidden sm:block">
              <div>{SELLER.address.split(",").slice(0, 2).join(",")}</div>
              <div>{SELLER.stateName}</div>
            </div>
            <a
              href="/Insights"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              📊 Insights
            </a>
          </div>
        </header>

        <div className="max-w-screen-xl mx-auto px-4 py-6 grid xl:grid-cols-[480px_1fr] gap-6 items-start">
          {/* ======= LEFT — FORM ======= */}
          <div className="space-y-5">
            {/* PO Upload */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-1 text-sm">
                📄 Extract Data from PO
              </h2>
              <p className="text-slate-400 text-xs mb-3">
                Upload a PO PDF to auto-fill company, PO no., date and items.
              </p>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-lg p-5 cursor-pointer transition-colors bg-slate-50 hover:bg-blue-50">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePo}
                  className="hidden"
                />
                <span className="text-slate-500 text-sm">
                  {extracting
                    ? "⏳ Extracting..."
                    : poFile
                      ? `📎 ${poFile} — click to change`
                      : "📎 Upload PO PDF"}
                </span>
              </label>
              {poWarnings.length > 0 && (
                <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1">
                  {poWarnings.map((w, i) => (
                    <div key={i} className="text-xs text-amber-700">
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Invoice details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-4 text-sm">
                📋 Invoice Details
              </h2>
              <div className="space-y-4">
                {/* Company search */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Company (Buyer) <span className="text-red-500">*</span>
                  </label>
                  <CompanyCombobox value={company} onChange={onCompanyChange} />
                  {company && company.id !== "manual" && (
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-0.5">
                      <div className="font-semibold text-slate-700">
                        {company.address}
                      </div>
                      <div>
                        GSTIN: {company.gstin} · State: {company.stateName}
                      </div>
                    </div>
                  )}
                  {company && company.id === "manual" && (
                    <div className="mt-2 space-y-2">
                      {[
                        ["address", "Address"],
                        ["gstin", "GSTIN/UIN"],
                        ["contactPerson", "Contact Person"],
                        ["contact", "Phone"],
                      ].map(([k, lbl]) => (
                        <div key={k}>
                          <label className="text-[10px] text-slate-400 font-semibold uppercase">
                            {lbl}
                          </label>
                          <input
                            value={company[k] || ""}
                            onChange={(e) =>
                              setCompany((c) => ({ ...c, [k]: e.target.value }))
                            }
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs mt-1"
                            placeholder={lbl}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Invoice No. <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                      placeholder="e.g. 12233"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Invoice Date
                    </label>
                    <input
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      placeholder="DD-MM-YYYY"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      PO Number
                    </label>
                    <input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="Auto-filled from PO"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      PO Date
                    </label>
                    <input
                      value={poDate}
                      onChange={(e) => setPoDate(e.target.value)}
                      placeholder="Auto-filled from PO"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Dispatch Through
                    </label>
                    <input
                      value={dispatch}
                      onChange={(e) => setDispatch(e.target.value)}
                      placeholder="BY OLA AUTO"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Destination
                    </label>
                    <input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Pirangoot, Pune"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transport Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <h2 className="font-bold text-slate-800 mb-4 text-sm">
                🚚 Transport Details (Optional)
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Truck / Tempo No.
                  </label>
                  <input
                    value={truckNo}
                    onChange={(e) => setTruckNo(e.target.value)}
                    placeholder="MH12 AB1234"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Buyer Name (Contact)
                  </label>
                  <input
                    value={buyerNameTxt}
                    onChange={(e) => setBuyerNameTxt(e.target.value)}
                    placeholder="Contact person name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Cell No.
                  </label>
                  <input
                    value={cellNo}
                    onChange={(e) => setCellNo(e.target.value)}
                    placeholder="9876543210"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-slate-800 text-sm">
                  📦 Products
                </h2>
                <button
                  onClick={() => setItems((p) => [...p, emptyItem()])}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Add Row
                </button>
              </div>

              {!company && (
                <div className="mb-3 text-xs bg-blue-50 border border-blue-100 text-blue-600 rounded-lg p-2.5">
                  💡 Select a company first — prices will auto-fill based on
                  their price list.
                </div>
              )}

              <div className="space-y-3">
                {items.map((it, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-xl p-3 relative bg-slate-50"
                  >
                    {items.length > 1 && (
                      <button
                        onClick={() =>
                          setItems((p) => p.filter((_, j) => j !== i))
                        }
                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 text-xs font-bold w-5 h-5 flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}

                    {/* Product search dropdown */}
                    <div className="mb-2">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                        Product
                      </label>
                      <ProductCombobox
                        value={it}
                        onChange={(data) => onProductSelect(i, data)}
                        companyId={company?.id}
                      />
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          HSN/SAC
                        </label>
                        <input
                          value={it.hsn}
                          onChange={(e) => updateItem(i, "hsn", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Qty
                        </label>
                        <input
                          type="number"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItem(i, "quantity", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Rate ₹{" "}
                          {company &&
                            it.productId &&
                            it.productId !== "manual" && (
                              <span
                                className="text-green-600"
                                title="Auto-filled from company price list"
                              >
                                ●
                              </span>
                            )}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={it.rate}
                          onChange={(e) =>
                            updateItem(i, "rate", e.target.value)
                          }
                          className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                          Amount ₹
                        </label>
                        <div className="w-full border border-slate-100 rounded-lg px-2 py-1.5 text-xs bg-white font-semibold text-slate-700 min-h-[28px]">
                          {it.quantity && it.rate
                            ? (
                                Number(it.quantity) * Number(it.rate)
                              ).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowPreview(true)}
                disabled={!canAction}
                className="flex-1 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 rounded-xl text-sm transition-colors"
              >
                👁 Preview Invoice
              </button>
              <button
                onClick={handleGenerate}
                disabled={!canAction || downloading}
                className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg"
              >
                {downloading ? "⏳ Generating..." : "⬇ Generate & Download"}
              </button>
            </div>

            {!canAction && (
              <p className="text-xs text-center text-slate-400">
                Select a company · Enter invoice no. · Add at least one product
                with qty and rate
              </p>
            )}
            {saveStatus === "saved" && (
              <div className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-center">
                ✅ Saved to Google Sheet! Invoice number auto-updated to next
                number.
              </div>
            )}
            {saveStatus === "skipped" && (
              <div className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg p-3 text-center">
                ⚠️ PDF downloaded. Configure Google Sheets in
                lib/googleSheets.js to auto-increment invoice numbers.
              </div>
            )}
            {saveStatus === "error" && (
              <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-center">
                ❌ Could not save to Sheet. PDF downloaded. Invoice number not
                incremented.
              </div>
            )}
          </div>

          {/* ======= RIGHT — LIVE PREVIEW ======= */}
          <div className="lg:sticky lg:top-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-slate-800 text-sm">
                  🧾 Live Invoice Preview
                </h2>
                <span className="text-xs text-slate-400">
                  Scaled to fit · A4 actual size
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  background: "#f1f5f9",
                  borderRadius: "8px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    width: "794px",
                    transformOrigin: "top left",
                    transform: "scale(0.62)",
                  }}
                >
                  <InvoicePreview invoice={invoice} />
                </div>
                <div
                  style={{
                    height: `${1123 * 0.62}px`,
                    marginTop: `-${1123 * 0.62}px`,
                    pointerEvents: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======= FULL PREVIEW MODAL ======= */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-auto">
          <div
            className="bg-white rounded-xl w-full mt-4 mb-8"
            style={{ maxWidth: "860px" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10 rounded-t-xl">
              <h3 className="font-bold text-slate-800">
                Invoice Preview — {invoiceNo}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={downloading}
                  className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {downloading ? "⏳..." : "⬇ Download PDF"}
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold px-4 py-2 rounded-lg"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <div className="overflow-auto p-6 bg-slate-100">
              <InvoicePreview invoice={invoice} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
