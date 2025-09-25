import { json } from "@sveltejs/kit";
import { replaceSheet } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";
const SHEET_NAME = "Auto Last Sale";

export async function POST({ request }) {
  try {
    const affiliates = await request.json();

    // ✅ filter only complete affiliates
    const rows = affiliates
      .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.lastOrder)
      .map(a => [
        a.id,
        a.name,
        a.email,
        a.revenue,
        a.referralCode,
        a.lastOrder
      ]);

    await replaceSheet(SPREADSHEET_ID, SHEET_NAME, rows);

    return json({ success: true, inserted: rows.length });
  } catch (err) {
    console.error("❌ Push failed:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
