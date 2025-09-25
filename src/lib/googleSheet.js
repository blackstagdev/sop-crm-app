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
