import { json } from '@sveltejs/kit';
import { getCheckpoint } from "$lib/googleSheet.js";

const SPREADSHEET_ID = "1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA";

export async function GET(event) {
	try {
		//  Load checkpoints (last fetched dates)
		const latestOrdersDate = await getCheckpoint(SPREADSHEET_ID, "orders");
		const latestAffiliatesDate = await getCheckpoint(SPREADSHEET_ID, "affiliates");

		// 1. Fetch affiliates (using event.fetch)
		const res = await event.fetch(
			`/api/goaffpro?orders_since=${encodeURIComponent(
			  latestOrdersDate || ""
			)}&affiliates_since=${encodeURIComponent(latestAffiliatesDate || "")}`
		  );

		const data = await res.json();

		const sheets = ["Last Sale Date", "First Sale Date", "Last Order Date", "First Order Date", "Partners", "GHL Contacts", "trackers"];
		const results = [];

		// 2. Push to Google Sheets
		for (const sheet of sheets) {
			const pushRes = await event.fetch('/api/push-sheet', {
			  method: 'POST',
			  headers: { 'Content-Type': 'application/json' },
			  body: JSON.stringify({ ...data, sheet })
			});
			const result = await pushRes.json();
			results.push(result);
		  }

		return json({ success: true, results });
	} catch (err) {
		console.error('Daily job failed:', err);
		return json({ success: false, error: String(err) }, { status: 500 });
	}
}
