import { json } from "@sveltejs/kit";
import { replaceSheet, appendSheet, setCheckpoint } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";

export async function POST({ request }) {
  try {
    const { affiliates, customers, partners, sheet, tracker } = await request.json();
  
    if (!sheet) {
      throw new Error("Missing `sheet` parameter");
    }

    // transform based on target sheet
    let rows = [];
    let headers = [];
    if (sheet === "trackers") {
      if (tracker?.orders) {
        await setCheckpoint(SPREADSHEET_ID, "orders", tracker.orders);
      }
      if (tracker?.affiliates) {
        await setCheckpoint(SPREADSHEET_ID, "affiliates", tracker.affiliates);
      }
  
    } else {
      switch (sheet) {
        case "Last Sale Date":
          rows = affiliates
            .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.lastSale)
            .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.lastSale]);
          headers = ["ID", "Name", "Email", "Revenue", "Referral Code", "Last Sale"];
          break;
  
        case "First Sale Date":
          rows = affiliates
            .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.firstSale)
            .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.firstSale]);
          headers = ["ID", "Name", "Email", "Revenue", "Referral Code", "First Sale"];
          break;
  
        case "Last Order Date":
          rows = customers
            .filter(c => c.id && c.name && c.email && c.lastOrderDate)
            .map(c => [c.id, c.name, c.email, c.lastOrderDate]);
          headers = ["ID", "Name", "Email", "Last Order Date"];
          break;
        
        case "First Order Date":
          rows = customers
            .filter(c => c.id && c.name && c.email && c.firstOrderDate)
            .map(c => [c.id, c.name, c.email, c.firstOrderDate]);
          headers = ["ID", "Name", "Email", "First Order Date"];
          break;
  
        case "Partners":
          rows = partners?.map(p => Object.values(p)) ?? [];
          headers = Object.keys(partners?.[0] ?? {}); // infer headers from first partner
          break;
  
        default:
          throw new Error(`Unknown sheet: ${sheet}`);
      }
    }

    if (rows.length > 0) {
      if (tracker?.orders && tracker?.affiliates) {
        // ✅ Append when tracker has both values
        await appendSheet(SPREADSHEET_ID, sheet, rows);
        return json({ success: true, sheet, inserted: rows.length, mode: "append" });
      } else {
        // ✅ Replace otherwise
        await replaceSheet(SPREADSHEET_ID, sheet, rows, headers);
        return json({ success: true, sheet, inserted: rows.length, mode: "replace" });
      }
    }

    return json({ success: true, sheet, inserted: 0, mode: "skipped" });
  } catch (err) {
    console.error("❌ Push failed:", err);
    return json({ success: false, error: err.message }, { status: 500 });
  }
}
