const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby40n0rnGtDwq7pSloSMRDyBtRaqYUadOjxp2tOyr6BL7H_nlXJgPjUC8KIrl54WF_NTg/exec";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "GET",
      redirect: "follow",
    });
    const text = await response.text();
    console.log("[get-invoices]", text.slice(0, 200));
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {}
    return res.status(200).json({ rows: parsed.rows || [] });
  } catch (err) {
    return res.status(500).json({ rows: [], error: err.message });
  }
}
