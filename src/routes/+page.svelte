<script>
	import { onMount } from 'svelte';
	import { lastSale } from '../stores';

	let affiliates = [];
	let loading = false;

	let jobResult = null;

	async function loadAffiliates() {
		loading = true;
		try {
			const res = await fetch('/api/goaffpro');
			const data = await res.json();
			lastSale.set(data);
			console.log(data);
		} catch (err) {
			console.error('Error loading affiliates:', err);
		} finally {
			loading = false;
		}
	}

	async function pushToSheet() {
		try {
			const res = await fetch('/api/push-sheet', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify($lastSale)
			});
			const result = await res.json();
			console.log('Push result:', result);
			alert(`✅ Inserted ${result.inserted} rows`);
		} catch (err) {
			console.error('Error pushing:', err);
		}
	}

	// function to test /api/daily-job
	async function runDailyJob() {
		loading = true;
		try {
			const res = await fetch('/api/daily-job');
			jobResult = await res.json();
			console.log('Daily Job Result:', jobResult);
		} catch (err) {
			console.error('Error running daily job:', err);
			jobResult = { error: String(err) };
		} finally {
			loading = false;
		}
	}
</script>

<button
	on:click={loadAffiliates}
	disabled={loading}
	class="cursor-pointer bg-gray-800 px-4 py-2 text-white"
>
	{loading ? 'Refreshing...' : 'Load Data'}
</button>

<button on:click={pushToSheet} class="ml-4 cursor-pointer bg-gray-800 px-4 py-2 text-white"
	>📤 Push to Google Sheet</button
>

<button class="ml-4 cursor-pointer bg-green-700 px-4 py-2 text-white" on:click={runDailyJob}
	>🕒 Run Daily Job</button
>

{#if jobResult}
	<h3>Daily Job Result</h3>
	<pre>{JSON.stringify(jobResult, null, 2)}</pre>
{/if}

{#if loading}
	<div class="loading">⏳ Loading affiliates...</div>
{:else if affiliates?.length}
	<p>Total affiliates: {$lastSale.length}</p>
	<pre>{JSON.stringify($lastSale, null, 2)}</pre>
{/if}
