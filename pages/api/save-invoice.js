const APPS_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycby40n0rnGtDwq7pSloSMRDyBtRaqYUadOjxp2tOyr6BL7H_nlXJgPjUC8KIrl54WF_NTg/exec";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(req.body),
      redirect: "follow",
    });
    const text = await response.text();
    console.log("[save-invoice]", text);
    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {}
    if (parsed.status === "success")
      return res.status(200).json({ status: "success" });
    return res.status(500).json({ error: parsed.message || text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
