import fs from "fs";
import path from "path";
import { google } from "googleapis";

const jwt = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth: jwt });

export async function replaceSheet(spreadsheetId, sheetName, rows) {
  if (!rows.length) {
    console.log("⚠️ No rows to insert, skipping.");
    return;
  }

  // If rows are objects, extract headers from keys
  let headers = [];
  let finalRows = [];

  if (typeof rows[0] === "object" && !Array.isArray(rows[0])) {
    headers = Object.keys(rows[0]); // first row keys
    finalRows = [
      headers, // header row
      ...rows.map(r => headers.map(h => r[h] ?? "")), // ensure consistent order
    ];
  } else {
    finalRows = rows; // already arrays
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}`, // adjust if needed
    valueInputOption: "RAW",
    requestBody: {
      values: rows,
    },
  });

  console.log(`✅ Pushed ${rows.length} rows to Google Sheet`);
}

export async function getCheckpoint(spreadsheetId, type) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Trackers!A2:B2`, // only fetch the second row (values)
  });

  const values = res.data.values?.[0] || [];
  if (type === "orders") return values[0] || null;
  if (type === "affiliates") return values[1] || null;
  return null;
}

export async function setCheckpoint(spreadsheetId, type, value) {
  let range = "";
  if (type === "orders") range = `Trackers!A2`;
  if (type === "affiliates") range = `Trackers!B2`;

  if (!range) throw new Error(`Unknown checkpoint type: ${type}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });

  console.log(`✅ Updated checkpoint for ${type} → ${value}`);
}

