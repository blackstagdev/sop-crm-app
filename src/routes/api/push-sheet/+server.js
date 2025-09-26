import { json } from "@sveltejs/kit";
import { replaceSheet } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";

export async function POST({ request }) {
  try {
    const { affiliates, customers, partners, sheet } = await request.json();

    console.log(affiliates, customers, partners, sheet)
  
    if (!sheet) {
      throw new Error("Missing `sheet` parameter");
    }

    // transform based on target sheet
    let rows = [];
    switch (sheet) {
      case "Last Sale Date":
        rows = affiliates
          .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.lastSale)
          .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.lastSale]);
        break;

      case "First Sale Date":
        rows = affiliates
        .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.firstSale)
        .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.firstSale]);
        break;

      case "Last Order Date":
        rows = customers
          .filter((c) => c.id && c.name && c.email && c.lastOrderDate)
          .map((c) => [c.id, c.name, c.email, c.lastOrderDate]);
        break;
      
      case "First Order Date":
        rows = customers
          .filter((c) => c.id && c.name && c.email && c.firstOrderDate)
          .map((c) => [c.id, c.name, c.email, c.firstOrderDate]);
        break;

      case "Partners":
          rows = partners?.map((p) => Object.values(p)) ?? [];
          break;

      default:
        throw new Error(`Unknown sheet: ${sheet}`);
    }

    await replaceSheet(SPREADSHEET_ID, sheet, rows);

    return json({ success: true, sheet, inserted: rows.length });
  } catch (err) {
    console.error("❌ Push failed:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
