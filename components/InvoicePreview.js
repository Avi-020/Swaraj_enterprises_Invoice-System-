// components/InvoicePreview.js
// Matches Invoice 12233 layout exactly.
// Uses same field names as index.js: items[].name, items[].quantity, items[].rate, items[].hsn, items[].disc

import { SELLER, TAX_RATE, numberToWords } from "../lib/demoData";

const S = {
  wrap: {
    background: "#fff",
    width: "794px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "10px",
    color: "#000",
    padding: "20px 24px 16px 24px",
    boxSizing: "border-box",
    margin: "0 auto",
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    border: "1px solid #000",
  },
  td: {
    border: "1px solid #000",
    padding: "3px 5px",
    verticalAlign: "top",
    fontSize: "8.5px",
  },
  tdC: {
    border: "1px solid #000",
    padding: "3px 5px",
    verticalAlign: "top",
    fontSize: "8.5px",
    textAlign: "center",
  },
  tdR: {
    border: "1px solid #000",
    padding: "3px 5px",
    verticalAlign: "top",
    fontSize: "8.5px",
    textAlign: "right",
  },
  bold: { fontWeight: "bold" },
  label: { fontSize: "7.5px", color: "#444" },
};

function fmt(n) {
  return (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MIN_ROWS = 10;

export default function InvoicePreview({ invoice }) {
  if (!invoice) return null;

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

  // ── Totals — self-contained, no external dependency ──
  const validItems = items.filter((it) => it.name && it.quantity && it.rate);
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

  // pad to MIN_ROWS
  const displayItems = [...validItems];
  while (displayItems.length < MIN_ROWS) displayItems.push(null);

  return (
    <div id="invoice-print" style={S.wrap}>
      {/* ── HEADER ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "4px",
        }}
      >
        <div
          style={{
            fontWeight: "bold",
            fontSize: "15px",
            letterSpacing: "0.5px",
          }}
        >
          GST TAX INVOICE
        </div>
        <div
          style={{
            position: "absolute",
            left: "52%",
            fontStyle: "italic",
            fontSize: "9.5px",
          }}
        >
          (ORIGINAL FOR RECIPIENT)
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            fontWeight: "bold",
            fontSize: "11px",
          }}
        >
          e-Invoice
        </div>
      </div>

      {/* ── IRN / ACK ── */}
      <div style={{ fontSize: "8px", marginBottom: "5px", lineHeight: "1.7" }}>
        <div>
          <b>IRN :</b>{" "}
          {invoice.irn || "(will be generated on e-invoicing portal)"}
        </div>
        <div>
          <b>Ack No. :</b> {invoice.ackNo || ""}
        </div>
        <div>
          <b>Ack Date :</b> {invoiceDate}
        </div>
      </div>

      {/* ── MAIN TABLE ── */}
      <table style={S.table}>
        <tbody>
          {/* ROW 1: Seller | Invoice No + Dated */}
          <tr>
            <td style={{ ...S.td, width: "52%" }} rowSpan={2}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  marginBottom: "2px",
                }}
              >
                {SELLER.name}
              </div>
              <div style={{ fontSize: "8px", lineHeight: "1.6" }}>
                {SELLER.address}
                <br />
                GSTIN/UIN: {SELLER.gstin}
                <br />
                State Name : {SELLER.stateName}, Code : {SELLER.stateCode}
                <br />
                PAN: {SELLER.pan}
                <br />
                Contact person : {SELLER.contactPerson}
                <br />
                Contact : {SELLER.contact}
                <br />
                E-Mail : {SELLER.email}
              </div>
            </td>
            <td style={{ ...S.td, width: "24%" }}>
              <div style={S.label}>Invoice No.</div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginTop: "1px",
                }}
              >
                {invoiceNo}
              </div>
              <div style={{ ...S.label, marginTop: "5px" }}>e-Way Bill No.</div>
              <div style={{ fontSize: "8px", marginTop: "1px" }}>
                {ewayBillNo || ""}
              </div>
            </td>
            <td style={{ ...S.td, width: "24%" }}>
              <div style={S.label}>Dated</div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "12px",
                  marginTop: "1px",
                }}
              >
                {invoiceDate}
              </div>
              <div style={{ fontSize: "7px", color: "#444" }}>Buyer Name</div>
              <div style={{ fontSize: "8px", fontWeight: "bold" }}>
                {transportDetails.buyerNameTxt || ""}
              </div>{" "}
              <div style={{ fontSize: "7px", color: "#444" }}>Cell No.</div>
              <div style={{ fontSize: "8px", fontWeight: "bold" }}>
                {transportDetails.cellNo || ""}
              </div>{" "}
            </td>
          </tr>

          {/* ROW 1b: PO / Dispatch | LR / PO Date / Destination */}
          <tr>
            <td style={S.td}>
              <div style={S.label}>Department</div>
              <div style={{ ...S.label, marginTop: "4px" }}>
                Purchase Order No.
              </div>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "8.5px",
                  marginTop: "1px",
                }}
              >
                {poNumber || ""}
              </div>
              <div style={{ fontSize: "7px", color: "#444" }}>
                Truck / Tempo No.
              </div>
              <div style={{ fontSize: "8px", fontWeight: "bold" }}>
                {transportDetails.truckNo || ""}
              </div>
              <div style={{ ...S.label, marginTop: "4px" }}>
                Dispatch through
              </div>
              <div
                style={{
                  fontSize: "8.5px",
                  fontWeight: "bold",
                  marginTop: "1px",
                }}
              >
                {transportDetails.dispatchThrough || ""}
              </div>
            </td>
            <td style={S.td}>
              <div style={S.label}>LR Details</div>
              <div style={{ ...S.label, marginTop: "4px" }}>PO Date</div>
              <div style={{ fontSize: "8.5px", marginTop: "1px" }}>
                {poDate || ""}
              </div>
              <div style={{ ...S.label, marginTop: "4px" }}>
                Material Given To
              </div>
              <div style={{ ...S.label, marginTop: "4px" }}>Destination</div>
              <div style={{ fontSize: "8.5px", marginTop: "1px" }}>
                {transportDetails.destination || ""}
              </div>
            </td>
          </tr>

          {/* ROW 2: Buyer | Delivery Address */}
          <tr>
            <td style={S.td}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "8px",
                  marginBottom: "2px",
                }}
              >
                Buyer (Bill to)
              </div>
              <div style={{ fontWeight: "bold", fontSize: "10px" }}>
                {buyer.name || "—"}
              </div>
              <div
                style={{ fontSize: "8px", lineHeight: "1.6", marginTop: "2px" }}
              >
                {buyer.address || ""}
                <br />
                GSTIN/UIN : {buyer.gstin || ""}
                <br />
                State Name : {buyer.stateName || "Maharashtra"}, Code :{" "}
                {buyer.stateCode || "27"}
                <br />
                Place of Supply: {buyer.placeOfSupply || "Maharashtra"}
                <br />
                {buyer.contactPerson ? (
                  <>
                    Contact person : {buyer.contactPerson}
                    <br />
                  </>
                ) : null}
                {buyer.contact ? <>Contact : {buyer.contact}</> : null}
              </div>
            </td>
            <td style={S.td} colSpan={2}>
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "8px",
                  marginBottom: "2px",
                }}
              >
                Delivery Address
              </div>
              <div style={{ fontSize: "8px", lineHeight: "1.6" }}>
                {buyer.address || ""}
              </div>
            </td>
          </tr>

          {/* ── ITEM TABLE HEADER ── */}
          <tr style={{ background: "#f8f8f8" }}>
            <td
              style={{
                ...S.tdC,
                width: "4%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              Sl
              <br />
              No.
            </td>
            <td
              style={{ ...S.td, fontWeight: "bold", fontSize: "8px" }}
              colSpan={2}
            >
              Description of Goods
            </td>
            <td
              style={{
                ...S.tdC,
                width: "10%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              HSN/SAC
            </td>
            <td
              style={{
                ...S.tdC,
                width: "11%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              Quantity
            </td>
            <td
              style={{
                ...S.tdR,
                width: "8%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              Rate
            </td>
            <td
              style={{
                ...S.tdC,
                width: "5%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              per
            </td>
            <td
              style={{
                ...S.tdC,
                width: "7%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              Disc.%
            </td>
            <td
              style={{
                ...S.tdR,
                width: "10%",
                fontWeight: "bold",
                fontSize: "8px",
              }}
            >
              Amount
            </td>
          </tr>

          {/* ── ITEM ROWS ── */}
          {displayItems.map((it, i) => (
            <tr key={i} style={{ minHeight: "20px" }}>
              <td style={{ ...S.tdC, height: "20px" }}>{it ? i + 1 : ""}</td>
              <td style={S.td} colSpan={2}>
                {it ? it.name || "" : ""}
              </td>
              <td style={S.tdC}>{it ? it.hsn || "" : ""}</td>
              <td style={S.tdC}>
                {it
                  ? `${Number(it.quantity).toLocaleString("en-IN")} Nos.`
                  : ""}
              </td>
              <td style={S.tdR}>{it ? fmt(it.rate) : ""}</td>
              <td style={S.tdC}>{it ? "Nos." : ""}</td>
              <td style={S.tdC}>{it?.disc ? `${it.disc}%` : ""}</td>
              <td style={S.tdR}>
                {it ? fmt(Number(it.quantity) * Number(it.rate)) : ""}
              </td>
            </tr>
          ))}

          {/* Subtotal */}
          <tr>
            <td style={S.td} colSpan={8}></td>
            <td style={S.tdR}>{fmt(taxableValue)}</td>
          </tr>

          {/* CGST */}
          <tr>
            <td style={S.td} colSpan={6}></td>
            <td
              style={{ ...S.td, textAlign: "right", fontSize: "8.5px" }}
              colSpan={2}
            >
              Output CGST @ {TAX_RATE}%&nbsp;&nbsp;&nbsp;{TAX_RATE} %
            </td>
            <td style={S.tdR}>{fmt(cgst)}</td>
          </tr>

          {/* SGST */}
          <tr>
            <td style={S.td} colSpan={6}></td>
            <td
              style={{ ...S.td, textAlign: "right", fontSize: "8.5px" }}
              colSpan={2}
            >
              Output SGST @ {TAX_RATE}%&nbsp;&nbsp;&nbsp;{TAX_RATE} %
            </td>
            <td style={S.tdR}>{fmt(sgst)}</td>
          </tr>

          {/* Round Off */}
          <tr>
            <td style={{ ...S.td, fontSize: "8px" }}>Less :</td>
            <td style={S.td} colSpan={5}></td>
            <td
              style={{
                ...S.td,
                fontStyle: "italic",
                fontWeight: "bold",
                textAlign: "right",
                fontSize: "8.5px",
              }}
              colSpan={2}
            >
              Rd.Off
            </td>
            <td style={S.tdR}>
              {Math.abs(roundOff) > 0 ? fmt(Math.abs(roundOff)) : ""}
            </td>
          </tr>

          {/* Grand Total */}
          <tr>
            <td style={S.td} colSpan={5}></td>
            <td
              style={{
                ...S.td,
                fontWeight: "bold",
                textAlign: "right",
                fontSize: "9px",
              }}
              colSpan={2}
            >
              Total &nbsp; {totalQty.toLocaleString("en-IN")} Nos.
            </td>
            <td style={S.td}></td>
            <td style={{ ...S.tdR, fontWeight: "bold", fontSize: "12px" }}>
              {fmt(grandTotal)}
            </td>
          </tr>

          {/* Amount in words */}
          <tr>
            <td style={S.td} colSpan={9}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <div>
                  <div style={{ fontSize: "8px", marginBottom: "2px" }}>
                    Amount Chargeable (in words)
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: "9px" }}>
                    {numberToWords(grandTotal)}
                  </div>
                </div>
                <div style={{ fontStyle: "italic", fontSize: "8px" }}>
                  E. &amp; O.E
                </div>
              </div>
            </td>
          </tr>

          {/* Tax breakdown — header row 1 */}
          <tr style={{ background: "#f8f8f8" }}>
            <td
              style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}
              rowSpan={2}
              colSpan={2}
            >
              Taxable
              <br />
              Value
            </td>
            <td
              style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}
              colSpan={2}
            >
              CGST
            </td>
            <td
              style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}
              colSpan={2}
            >
              SGST/UTGST
            </td>
            <td
              style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}
              colSpan={3}
            >
              Total Tax Amount
            </td>
          </tr>
          {/* header row 2 */}
          <tr style={{ background: "#f8f8f8" }}>
            <td style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}>
              Rate
            </td>
            <td style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}>
              Amount
            </td>
            <td style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}>
              Rate
            </td>
            <td style={{ ...S.tdC, fontWeight: "bold", fontSize: "8px" }}>
              Amount
            </td>
            <td style={S.td} colSpan={3}></td>
          </tr>

          {/* Tax data row */}
          <tr>
            <td style={S.tdR} colSpan={2}>
              {fmt(taxableValue)}
            </td>
            <td style={S.tdC}>{TAX_RATE}%</td>
            <td style={S.tdR}>{fmt(cgst)}</td>
            <td style={S.tdC}>{TAX_RATE}%</td>
            <td style={S.tdR}>{fmt(sgst)}</td>
            <td style={S.tdR} colSpan={3}>
              {fmt(cgst + sgst)}
            </td>
          </tr>

          {/* Tax totals row */}
          <tr>
            <td
              style={{ ...S.tdR, fontWeight: "bold", fontSize: "8.5px" }}
              colSpan={2}
            >
              Total: {fmt(taxableValue)}
            </td>
            <td style={S.tdC}></td>
            <td style={{ ...S.tdR, fontWeight: "bold", fontSize: "8.5px" }}>
              {fmt(cgst)}
            </td>
            <td style={S.tdC}></td>
            <td style={{ ...S.tdR, fontWeight: "bold", fontSize: "8.5px" }}>
              {fmt(sgst)}
            </td>
            <td
              style={{ ...S.tdR, fontWeight: "bold", fontSize: "8.5px" }}
              colSpan={3}
            >
              {fmt(cgst + sgst)}
            </td>
          </tr>

          {/* Tax in words */}
          <tr>
            <td style={{ ...S.td, fontSize: "8.5px" }} colSpan={9}>
              <span style={{ fontWeight: "bold" }}>
                Tax Amount (in words) :{" "}
              </span>
              {numberToWords(+(cgst + sgst).toFixed(2))}
            </td>
          </tr>

          {/* Declaration + Bank */}
          <tr>
            <td style={{ ...S.td, fontSize: "8px" }} colSpan={5}>
              <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                Company&apos;s PAN : {SELLER.pan}
              </div>
              <div style={{ fontWeight: "bold", marginBottom: "3px" }}>
                Declaration
              </div>
              <div style={{ fontSize: "7.5px", lineHeight: "1.6" }}>
                &quot;I/We certify that my/our registration certificate under
                the GST Act, 2017 is in force on the date on which the supply of
                the goods specified in this Tax Invoice is made by me/us &amp;
                the transaction of supply covered by this Tax Invoice has been
                effected by me/us &amp; it shall be acounted for in the turnover
                of supplies while filling of return &amp; the due tax if any
                payable on the supplies has been paid or shall be paid&quot;
              </div>
              <div style={{ marginTop: "20px", fontSize: "8.5px" }}>
                Customer&apos;s Seal and Signature
              </div>
            </td>
            <td style={{ ...S.td, fontSize: "8px" }} colSpan={4}>
              <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
                Company&apos;s Bank Details
              </div>
              <div>A/c Holder&apos;s Name : {SELLER.bank.accountHolder}</div>
              <div style={{ marginTop: "2px" }}>
                Bank Name &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:{" "}
                {SELLER.bank.bankName}
              </div>
              <div style={{ marginTop: "2px" }}>
                A/c No.
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:{" "}
                {SELLER.bank.accountNo}
              </div>
              <div style={{ marginTop: "2px" }}>
                Branch &amp; IFS Code : {SELLER.bank.branchIFSC}
              </div>
              <div
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  marginTop: "18px",
                  fontSize: "8.5px",
                }}
              >
                for {SELLER.name}
              </div>
            </td>
          </tr>

          {/* Signatories */}
          <tr>
            <td
              style={{ ...S.td, height: "40px", fontSize: "8.5px" }}
              colSpan={4}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                  height: "100%",
                  paddingBottom: "2px",
                }}
              >
                <span>Prepared by</span>
                <span>Verified by</span>
              </div>
            </td>
            <td
              style={{
                ...S.td,
                fontSize: "8.5px",
                textAlign: "right",
                verticalAlign: "bottom",
                paddingBottom: "4px",
              }}
              colSpan={5}
            >
              Authorised Signatory
            </td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          fontSize: "8px",
          marginTop: "6px",
          lineHeight: "1.8",
        }}
      >
        <div>SUBJECT TO PUNE JURISDICTION</div>
        <div>This is a Computer Generated Invoice</div>
      </div>
    </div>
  );
}
