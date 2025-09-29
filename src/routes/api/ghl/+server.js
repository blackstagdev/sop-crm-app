// src/routes/api/ghl/+server.js
import { json } from '@sveltejs/kit';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = 'pit-13bada01-23cd-484e-909c-e9f49fc24546';

// Hard-coded values
const LOCATION_ID = 'YKo6A5vmDaEqPUyWAi1r'; // replace with your real locationId
const PAGE_LIMIT = 500; // must be a number (<=500)

/**
 * Fetch one page of contacts (cursor-based, POST body required).
 */
async function fetchContactsPage({ searchAfter }) {
  const body = {
    locationId: LOCATION_ID,       // string ✅
    pageLimit: Number(PAGE_LIMIT), // number ✅
  };

  if (searchAfter) {
    body.searchAfter = searchAfter; // should be array [number, string]
  }

  const resp = await fetch(`${GHL_API_BASE}/contacts/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    throw new Error(`Failed to fetch contacts: ${resp.status} ${await resp.text()}`);
  }

  return resp.json();
}

export async function GET() {
  const allContacts = [];
  let searchAfter = null;
  let keepGoing = true;

  while (keepGoing) {
    const data = await fetchContactsPage({ searchAfter });
    const contacts = data.contacts ?? [];
    allContacts.push(...contacts);

    if (contacts.length < PAGE_LIMIT) {
      keepGoing = false;
    } else {
      searchAfter = contacts[contacts.length - 1]?.searchAfter;
      if (!searchAfter) keepGoing = false;
    }

    if (allContacts.length >= 20000) {
      keepGoing = false;
    }
  }

  return json({
    locationId: LOCATION_ID,
    count: allContacts.length,
    contacts: allContacts
  });
}
