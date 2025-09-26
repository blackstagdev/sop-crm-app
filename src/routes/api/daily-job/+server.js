import { json } from '@sveltejs/kit';

export async function GET(event) {
	try {
		// 1. Fetch affiliates (using event.fetch)
		const res = await event.fetch('/api/goaffpro');
		const data = await res.json();

		const sheets = ["Last Sale Date", "First Sale Date", "Last Order Date", "First Order Date"];
		const results = [];

		// 2. Push to Google Sheets
		for (const sheet of sheets) {
			const pushRes = await event.fetch('/api/push-sheet', {
			  method: 'POST',
			  headers: { 'Content-Type': 'application/json' },
			  body: JSON.stringify({ data, sheet })
			});
			const result = await pushRes.json();
			results.push(result);
		  }

		return json({ success: true, result });
	} catch (err) {
		console.error('Daily job failed:', err);
		return json({ success: false, error: String(err) }, { status: 500 });
	}
}
