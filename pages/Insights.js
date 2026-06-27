import { useState, useEffect } from "react";
import { fetchInvoiceData } from "../lib/googleSheets";

// ── Parse items string back into products ─────────────────────────────────
// Stored format: "Product A(10×₹25); Product B(5×₹100)"
function parseItems(itemsStr) {
  if (!itemsStr) return [];
  return itemsStr
    .split(";")
    .map((s) => {
      s = s.trim();
      const m = s.match(/^(.+)\((\d+(?:\.\d+)?)×₹([\d.]+)\)$/);
      if (!m) return null;
      return { name: m[1].trim(), qty: Number(m[2]), rate: Number(m[3]) };
    })
    .filter(Boolean);
}

// ── Parse DD-MM-YYYY or DD/MM/YYYY dates ─────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const s = String(str).trim();
  const m = s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

function monthKey(date) {
  if (!date) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  if (!key) return "";
  const [yr, mo] = key.split("-");
  const names = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${names[Number(mo) - 1]} ${yr}`;
}

// ── Compute all insights from raw rows ───────────────────────────────────
function computeInsights(rows) {
  if (!rows.length) return null;

  const now = new Date();
  const thisMonth = monthKey(now);
  const lastMonth = monthKey(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );

  // Revenue by month
  const revenueByMonth = {};
  const invoicesByMonth = {};
  const productQty = {};
  const productRevenue = {};
  const buyerRevenue = {};
  const buyerCount = {};

  let totalRevenue = 0;
  let totalInvoices = rows.length;

  for (const row of rows) {
    const date = parseDate(row["Invoice Date"]);
    const mk = monthKey(date);
    const grand = Number(row["Grand Total"]) || 0;
    const buyer = row["Buyer Name"] || "Unknown";

    totalRevenue += grand;

    if (mk) {
      revenueByMonth[mk] = (revenueByMonth[mk] || 0) + grand;
      invoicesByMonth[mk] = (invoicesByMonth[mk] || 0) + 1;
    }

    // Buyer stats
    buyerRevenue[buyer] = (buyerRevenue[buyer] || 0) + grand;
    buyerCount[buyer] = (buyerCount[buyer] || 0) + 1;

    // Product stats
    const items = parseItems(row["Items"]);
    for (const it of items) {
      productQty[it.name] = (productQty[it.name] || 0) + it.qty;
      productRevenue[it.name] =
        (productRevenue[it.name] || 0) + it.qty * it.rate;
    }
  }

  // Sort months chronologically
  const sortedMonths = Object.keys(revenueByMonth).sort();
  const last6Months = sortedMonths.slice(-6);

  // Month-on-month growth
  const thisRev = revenueByMonth[thisMonth] || 0;
  const lastRev = revenueByMonth[lastMonth] || 0;
  const growth = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : null;

  // Next month revenue prediction — simple average of last 3 months
  const last3 = sortedMonths.slice(-3).map((k) => revenueByMonth[k] || 0);
  const predicted = last3.length
    ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length)
    : null;

  // Top products by qty
  const topByQty = Object.entries(productQty)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top products by revenue
  const topByRevenue = Object.entries(productRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Top buyers
  const topBuyers = Object.entries(buyerRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Avg invoice value
  const avgInvoice =
    totalInvoices > 0 ? Math.round(totalRevenue / totalInvoices) : 0;

  return {
    totalRevenue,
    totalInvoices,
    avgInvoice,
    thisMonthRevenue: thisRev,
    lastMonthRevenue: lastRev,
    growth,
    predicted,
    last6Months,
    revenueByMonth,
    invoicesByMonth,
    topByQty,
    topByRevenue,
    topBuyers,
  };
}

const rupee = (n) =>
  "₹" +
  (Number(n) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// ── Simple bar chart component ────────────────────────────────────────────
function BarChart({ data, color = "#3B82F6" }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "6px",
        height: "80px",
      }}
    >
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "3px",
          }}
        >
          <div style={{ fontSize: "8px", color: "#6B7280" }}>
            {rupee(d.value)}
          </div>
          <div
            style={{
              width: "100%",
              background: color,
              borderRadius: "3px 3px 0 0",
              height: `${Math.max((d.value / max) * 60, 2)}px`,
              opacity: i === data.length - 1 ? 1 : 0.6,
            }}
          />
          <div
            style={{ fontSize: "8px", color: "#9CA3AF", whiteSpace: "nowrap" }}
          >
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Insights Page ────────────────────────────────────────────────────
export default function InsightsPage() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchInvoiceData().then((res) => {
      if (res.skipped) {
        setError(
          "Google Sheets not configured. Add your Apps Script URL to lib/googleSheets.js",
        );
      } else if (res.error) {
        setError("Failed to load: " + res.error);
      } else {
        setRows(res.rows);
        setInsights(computeInsights(res.rows));
      }
      setLoading(false);
    });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F1F5F9",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#0F2A4A",
          color: "#fff",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: "18px" }}>
            SWARAJ ENTERPRISES
          </div>
          <div style={{ fontSize: "12px", color: "#94A3B8" }}>
            Business Insights Dashboard
          </div>
        </div>
        <a
          href="/"
          style={{
            background: "#fff",
            color: "#0F2A4A",
            padding: "8px 16px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
            fontSize: "13px",
          }}
        >
          ← Back to Invoice
        </a>
      </div>

      <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
        {loading && (
          <div
            style={{
              textAlign: "center",
              padding: "60px",
              color: "#64748B",
              fontSize: "16px",
            }}
          >
            ⏳ Loading data from Google Sheets...
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "12px",
              padding: "20px",
              color: "#DC2626",
              marginBottom: "24px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {insights && (
          <>
            {/* KPI Cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              {[
                {
                  label: "Total Revenue",
                  value: rupee(insights.totalRevenue),
                  sub: `${insights.totalInvoices} invoices`,
                  color: "#3B82F6",
                },
                {
                  label: "This Month",
                  value: rupee(insights.thisMonthRevenue),
                  sub:
                    insights.growth != null
                      ? `${insights.growth >= 0 ? "+" : ""}${insights.growth.toFixed(1)}% vs last month`
                      : "First month",
                  color: insights.growth >= 0 ? "#10B981" : "#EF4444",
                },
                {
                  label: "Avg Invoice Value",
                  value: rupee(insights.avgInvoice),
                  sub: "per invoice",
                  color: "#8B5CF6",
                },
                {
                  label: "Next Month Forecast",
                  value: rupee(insights.predicted),
                  sub: "Based on last 3 months avg",
                  color: "#F59E0B",
                },
              ].map((card, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                    borderLeft: `4px solid ${card.color}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#64748B",
                      marginBottom: "6px",
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontSize: "22px",
                      fontWeight: "bold",
                      color: "#1E293B",
                    }}
                  >
                    {card.value}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: card.color,
                      marginTop: "4px",
                    }}
                  >
                    {card.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Chart + Top Products */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Monthly Revenue Bar Chart */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  📊 Monthly Revenue (Last 6 Months)
                </div>
                <BarChart
                  data={insights.last6Months.map((k) => ({
                    label: monthLabel(k),
                    value: insights.revenueByMonth[k] || 0,
                  }))}
                  color="#3B82F6"
                />
                {insights.predicted && (
                  <div
                    style={{
                      marginTop: "12px",
                      padding: "8px 12px",
                      background: "#FEF3C7",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#92400E",
                    }}
                  >
                    🔮 Next month forecast: <b>{rupee(insights.predicted)}</b>
                  </div>
                )}
              </div>

              {/* Top Products by Qty */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  🏆 Most Sold Products (by Qty)
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {insights.topByQty.map(([name, qty], i) => {
                    const maxQty = insights.topByQty[0][1];
                    return (
                      <div key={i}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "3px",
                          }}
                        >
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: i === 0 ? "bold" : "normal",
                            }}
                          >
                            {i === 0
                              ? "🥇"
                              : i === 1
                                ? "🥈"
                                : i === 2
                                  ? "🥉"
                                  : `${i + 1}.`}{" "}
                            {name}
                          </span>
                          <span style={{ color: "#6B7280" }}>
                            {qty.toLocaleString("en-IN")} pcs
                          </span>
                        </div>
                        <div
                          style={{
                            background: "#F1F5F9",
                            borderRadius: "4px",
                            height: "6px",
                          }}
                        >
                          <div
                            style={{
                              background: "#3B82F6",
                              borderRadius: "4px",
                              height: "6px",
                              width: `${(qty / maxQty) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Top Buyers + Top Products by Revenue */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              {/* Top Buyers */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  🏢 Top Buyers by Revenue
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {insights.topBuyers.map(([name, rev], i) => {
                    const maxRev = insights.topBuyers[0][1];
                    const invoices = rows.filter(
                      (r) => r["Buyer Name"] === name,
                    ).length;
                    return (
                      <div key={i}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "3px",
                          }}
                        >
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: i === 0 ? "bold" : "normal",
                            }}
                          >
                            {i === 0 ? "⭐" : `${i + 1}.`} {name}
                          </span>
                          <span style={{ color: "#6B7280" }}>
                            {rupee(rev)} · {invoices} inv
                          </span>
                        </div>
                        <div
                          style={{
                            background: "#F1F5F9",
                            borderRadius: "4px",
                            height: "6px",
                          }}
                        >
                          <div
                            style={{
                              background: "#10B981",
                              borderRadius: "4px",
                              height: "6px",
                              width: `${(rev / maxRev) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Products by Revenue */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "16px",
                    color: "#1E293B",
                  }}
                >
                  💰 Top Products by Revenue
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {insights.topByRevenue.map(([name, rev], i) => {
                    const maxRev = insights.topByRevenue[0][1];
                    return (
                      <div key={i}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            marginBottom: "3px",
                          }}
                        >
                          <span style={{ color: "#374151" }}>
                            {i + 1}. {name}
                          </span>
                          <span style={{ color: "#6B7280" }}>{rupee(rev)}</span>
                        </div>
                        <div
                          style={{
                            background: "#F1F5F9",
                            borderRadius: "4px",
                            height: "6px",
                          }}
                        >
                          <div
                            style={{
                              background: "#8B5CF6",
                              borderRadius: "4px",
                              height: "6px",
                              width: `${(rev / maxRev) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Invoices Table */}
            <div
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "16px",
                  color: "#1E293B",
                }}
              >
                🧾 Recent Invoices
              </div>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "13px",
                }}
              >
                <thead>
                  <tr style={{ background: "#F8FAFC" }}>
                    {[
                      "Invoice No",
                      "Date",
                      "Buyer",
                      "Grand Total",
                      "PO Number",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "8px 12px",
                          textAlign: "left",
                          fontSize: "11px",
                          color: "#64748B",
                          fontWeight: "600",
                          borderBottom: "1px solid #E2E8F0",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .slice(-10)
                    .reverse()
                    .map((row, i) => (
                      <tr
                        key={i}
                        style={{ borderBottom: "1px solid #F1F5F9" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#F8FAFC")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#fff")
                        }
                      >
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            color: "#3B82F6",
                          }}
                        >
                          {row["Invoice No"]}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#64748B" }}>
                          {row["Invoice Date"]}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#374151" }}>
                          {row["Buyer Name"]}
                        </td>
                        <td
                          style={{
                            padding: "8px 12px",
                            fontWeight: "600",
                            color: "#10B981",
                          }}
                        >
                          {rupee(row["Grand Total"])}
                        </td>
                        <td style={{ padding: "8px 12px", color: "#64748B" }}>
                          {row["PO Number"] || "—"}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
