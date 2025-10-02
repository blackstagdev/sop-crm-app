import fs from "fs";
import path from "path";
import { google } from "googleapis";

const jwt = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth: jwt });

export async function replaceSheet(spreadsheetId, sheetName, rows, headers = []) {
  if (!rows.length) {
    console.log("⚠️ No rows to insert, skipping.");
    return;
  }

  // If no custom headers passed → infer headers by length
  const finalHeaders = headers.length
    ? headers
    : Array.from({ length: rows[0].length }, (_, i) => `Column${i + 1}`);

  const finalRows = [finalHeaders, ...rows];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}`,
    valueInputOption: "RAW",
    requestBody: { values: finalRows },
  });

  console.log(
    `✅ Pushed ${rows.length} rows (+1 header) to ${sheetName}`
  );
}

export async function appendSheet(spreadsheetId, sheetName, rows) {
  if (!rows.length) {
    console.log("⚠️ No rows to append, skipping.");
    return;
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });

  console.log(`✅ Appended ${rows.length} rows to ${sheetName}`);
}

export async function getCheckpoint(spreadsheetId, type) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Trackers!A2:C2`, // only fetch the second row (values)
  });

  const values = res.data.values?.[0] || [];
  if (type === "orders") return values[0] || null;
  if (type === "affiliates") return values[1] || null;
  if (type === "ghlContacts") return values[2] || null;
  return null;
}

export async function setCheckpoint(spreadsheetId, type, value) {
  let range = "";
  if (type === "orders") range = `Trackers!A2`;
  if (type === "affiliates") range = `Trackers!B2`;
  if (type === "ghlContacts") range = `Trackers!C2`;

  if (!range) throw new Error(`Unknown checkpoint type: ${type}`);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });

  console.log(`✅ Updated checkpoint for ${type} → ${value}`);
}

export async function getSheetValues(spreadsheetId, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: sheetName,
  });
  return res.data.values || null;
}


