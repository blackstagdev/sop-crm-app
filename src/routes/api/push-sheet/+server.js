import { json } from "@sveltejs/kit";
import { replaceSheet } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";

export async function POST({ request }) {
  try {
    const { affiliates, customers, partners, sheet, tracker } = await request.json();
  
    if (!sheet) {
      throw new Error("Missing `sheet` parameter");
    }

    // transform based on target sheet
    let rows = [];
    switch (sheet) {
      case "Last Sale Date":
        rows = affiliates
          .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.lastSale);
        break;

      case "First Sale Date":
        rows = affiliates
        .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.firstSale);
        break;

      case "Last Order Date":
        rows = customers
          .filter((c) => c.id && c.name && c.email && c.lastOrderDate);
        break;
      
      case "First Order Date":
        rows = customers
          .filter((c) => c.id && c.name && c.email && c.firstOrderDate);
        break;

      case "Partners":
          rows = partners ?? [];
          break;

      default:
        throw new Error(`Unknown sheet: ${sheet}`);
    }

    await replaceSheet(SPREADSHEET_ID, sheet, rows);

      // trackers handled separately
      if (sheet === "trackers") {
        if (tracker?.orders) {
          await setCheckpoint(SPREADSHEET_ID, "orders", tracker.orders);
        }
        if (tracker?.affiliates) {
          await setCheckpoint(SPREADSHEET_ID, "affiliates", tracker.affiliates);
        }

      }

    return json({ success: true, sheet, inserted: rows.length });
  } catch (err) {
    console.error("❌ Push failed:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
