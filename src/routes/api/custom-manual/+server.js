// /api/custom-manual/+server.js
import { json } from "@sveltejs/kit";
import { appendSheet, getSheetValues } from "$lib/googleSheet.js";

export async function POST({ request }) {
  try {
    const payload = await request.json();

    const { SPREADSHEET_ID, SHEET_NAME, ...data } = payload;

    if (!SPREADSHEET_ID || !SHEET_NAME) {
      return json({ success: false, message: "Spreadsheet ID and Sheet Name are required" }, { status: 400 });
    }

    if (!data || Object.keys(data).length === 0) {
      return json({ success: false, message: "No row data provided" }, { status: 400 });
    }

    // Convert payload to row format for Google Sheets
    const rows = [[
      data.name,
      data.email,
      data.score,
      data.correct,
      data.total,
      data.course_name,
      data.category,
      data.topic_name,
      data.item_fact,
      data.submitted_at,
    ]];



    await appendSheet(SPREADSHEET_ID, SHEET_NAME, rows);


    return json({ success: true, sheet: SHEET_NAME, inserted: rows.length, mode });
  } catch (err) {
    console.error("❌ Failed to append row:", err);
    return json({ success: false, message: err.message }, { status: 500 });
  }
}
