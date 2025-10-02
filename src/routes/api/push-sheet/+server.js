import { json } from "@sveltejs/kit";
import {  getSheetValues, replaceSheet, appendSheet, setCheckpoint } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";

export async function POST({ request }) {
  try {
    const { affiliates, customers, partners, sheet, tracker, contacts } = await request.json();
  
    if (!sheet) {
      throw new Error("Missing `sheet` parameter");
    }

    // transform based on target sheet
    let rows = [];
    let headers = [];
    console.log(tracker)
    if (sheet === "trackers") {
      if (tracker?.orders) {
        await setCheckpoint(SPREADSHEET_ID, "orders", tracker.orders);
      }
      if (tracker?.affiliates) {
        await setCheckpoint(SPREADSHEET_ID, "affiliates", tracker.affiliates);
      }
      if (tracker?.ghlContacts) {
        await setCheckpoint(SPREADSHEET_ID, "ghlContacts", tracker.ghlContacts);
      }
  
    } else {
      switch (sheet) {
        case "Last Sale Date":
          rows = affiliates
            .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.lastSale || a.totalSale)
            .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.lastSale, a.totalSale]);
          headers = ["ID", "Name", "Email", "Revenue", "Referral Code", "Last Sale", "Sale"];
          break;
  
        case "First Sale Date":
          rows = affiliates
            .filter(a => a.id && a.name && a.email && a.revenue && a.referralCode && a.firstSale || a.totalSale)
            .map(a => [a.id, a.name, a.email, a.revenue, a.referralCode, a.firstSale, a.totalSale]);
          headers = ["ID", "Name", "Email", "Revenue", "Referral Code", "First Sale", "Sale"];
          break;
  
        case "Last Order Date":
          rows = customers
            .filter(c => c.id && c.name && c.email && c.lastOrderDate && c.totalSale && c.revenue)
            .map(c => [c.id, c.name, c.email, c.lastOrderDate, c.totalSale, c.revenue]);
          headers = ["ID", "Name", "Email", "Last Order Date", "Sale", "Revenue"];
          break;
        
        case "First Order Date":
          rows = customers
            .filter(c => c.id && c.name && c.email && c.firstOrderDate && c.totalSale && c.revenue)
            .map(c => [c.id, c.name, c.email, c.firstOrderDate, c.totalSale, c.revenue]);
          headers = ["ID", "Name", "Email", "First Order Date", "Sale", "Revenue"];
          break;
  
        case "Partners":
          rows = partners?.map(p => Object.values(p)) ?? [];
          headers = Object.keys(partners?.[0] ?? {}); 
          break;
        
        case "GHL Contacts":
          if (Array.isArray(contacts) && contacts.length > 0) {
          
            const keySet = new Set();
            contacts.forEach(c => {
              Object.keys(c).forEach(k => keySet.add(k));
            });
        
            headers = Array.from(keySet);
        
            rows = contacts.map(c => headers.map(h => c[h] ?? ""));
          } else {
            rows = [];
            headers = [];
          }
          break;
  
        default:
          throw new Error(`Unknown sheet: ${sheet}`);
      }
    }

    if (rows.length > 0) {
      // Fetch existing sheet rows
      const existing = await getSheetValues(SPREADSHEET_ID, sheet);
    
      if (existing && existing.length > 1) {
        // Sheet already has header + rows → append
        await appendSheet(SPREADSHEET_ID, sheet, rows);
        return json({ success: true, sheet, inserted: rows.length, mode: "append" });
      } else {
        // Sheet empty (or just header) → replace
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
