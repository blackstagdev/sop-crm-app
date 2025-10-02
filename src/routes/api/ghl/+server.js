// src/routes/api/ghl/+server.js
import { json } from '@sveltejs/kit';
import { getCheckpoint, setCheckpoint } from '$lib/googleSheet.js';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_KEY = 'pit-13bada01-23cd-484e-909c-e9f49fc24546';

// Hard-coded values
const LOCATION_ID = 'YKo6A5vmDaEqPUyWAi1r'; 
const PAGE_LIMIT = 500; // must be a number (<=500)
const SPREADSHEET_ID = '1KKmny7DXdsIr0g3437N3m9B4KGQwI0ygeXrr12vkkxA';
const CHECKPOINT_KEY = 'ghlContacts';

// --- Recursive Flatten Helper ---
function flattenObject(obj, prefix = '', res = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value)) {
      // array of primitives → join into single string
      if (value.every(v => typeof v !== 'object' || v === null)) {
        res[newKey] = value.join(', ');
      } else {
        // array of objects → flatten each with index
        value.forEach((v, i) => {
          flattenObject(v, `${newKey}_${i}`, res);
        });
      }
    } else if (value !== null && typeof value === 'object') {
      // nested object → recurse
      flattenObject(value, newKey, res);
    } else {
      res[newKey] = value ?? '';
    }
  }
  return res;
}

function flattenContact(contact) {
  return flattenObject(contact);
}

/**
 * Fetch one page of contacts (cursor-based, POST body required).
 */
async function fetchContactsPage({ searchAfter }) {
  const body = {
    locationId: LOCATION_ID,      
    pageLimit: Number(PAGE_LIMIT), 
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

  let searchAfter = await getCheckpoint(SPREADSHEET_ID, CHECKPOINT_KEY);

  const allContacts = [];
  let searchAfter = null;
  let keepGoing = true;
  let lastSearchAfter = null;

  while (keepGoing) {
    const data = await fetchContactsPage({ searchAfter });
    const contacts = data.contacts ?? [];
    allContacts.push(...contacts);

    if (contacts.length < PAGE_LIMIT) {
      keepGoing = false;
    } else {
      searchAfter = contacts[contacts.length - 1]?.searchAfter;
      lastSearchAfter = searchAfter;
      if (!searchAfter) keepGoing = false;
    }

    if (allContacts.length >= 20000) {
      keepGoing = false;
    }
  }

    if (lastSearchAfter) {
      await setCheckpoint(SPREADSHEET_ID, CHECKPOINT_KEY, lastSearchAfter);
    }

  const flattenedContacts = allContacts.map(flattenContact);

  return json({
    locationId: LOCATION_ID,
    count: allContacts.length,
    tracker: { ghlContacts: lastSearchAfter },
    contacts: flattenedContacts
  });
}
