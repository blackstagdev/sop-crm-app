// /api/custom-manual/+server.js
import { json } from "@sveltejs/kit";
import { appendSheet } from "$lib/googleSheet.js";

// ✅ Optional: define your API key
const API_KEY = "mysecretapikey";

export async function OPTIONS() {
  // Preflight CORS
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*", // adjust if you want to restrict domains
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST({ request }) {
  try {
    // Check authorization header if required
    const auth = request.headers.get("Authorization");
    if (!auth || auth !== `Bearer ${API_KEY}`) {
      return json(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const payload = await request.json();
    const { SPREADSHEET_ID, SHEET_NAME, ...data } = payload;

    if (!SPREADSHEET_ID || !SHEET_NAME) {
      return json(
        { success: false, message: "Spreadsheet ID and Sheet Name are required" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return json(
        { success: false, message: "No row data provided" },
        { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
      );
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

    return json(
      { success: true, sheet: SHEET_NAME, inserted: rows.length, mode: "append" },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (err) {
    console.error("❌ Failed to append row:", err);
    return json(
      { success: false, message: err.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}
