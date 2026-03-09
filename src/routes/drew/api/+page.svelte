<script>
	import { onMount } from 'svelte';

	let data = null;
	let loading = true;
	let error = null;

	async function loadAffiliates() {
		loading = true;
		error = null;

		try {
			const res = await fetch('/drew/api/goaffpro');

			if (!res.ok) {
				throw new Error('Failed to fetch affiliates');
			}

			data = await res.json();
		} catch (err) {
			error = err.message;
		} finally {
			loading = false;
		}
	}

	onMount(loadAffiliates);
</script>

<h1>Affiliate Performance (Last 30 Days)</h1>

<button on:click={loadAffiliates}> Refresh </button>

{#if loading}
	<p>Loading affiliates…</p>
{:else if error}
	<p style="color:red">{error}</p>
{:else if data?.affiliates?.length === 0}
	<p>No affiliates found.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Name</th>
				<th>Email</th>
				<th>Referral Code</th>
				<th>Revenue</th>
				<th>Sales</th>
				<th>First Sale</th>
				<th>Last Sale</th>
			</tr>
		</thead>
		<tbody>
			{#each data.affiliates as a}
				<tr class={a.salesCount === 0 ? 'zero' : ''}>
					<td>{a.name}</td>
					<td>{a.email}</td>
					<td>{a.referralCode}</td>
					<td>
						${Number(a.revenue ?? 0).toFixed(2)}
					</td>

					<td>
						{a.salesCount}
						{#if a.salesCount === 0}
							<span class="badge">No sales</span>
						{/if}
					</td>
					<td>{a.firstSale ?? '—'}</td>
					<td>{a.lastSale ?? '—'}</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		padding: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
		text-align: left;
	}

	th {
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		color: #6b7280;
	}

	.zero {
		color: #9ca3af;
	}

	.badge {
		padding: 0.15rem 0.5rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		background: #fee2e2;
		color: #991b1b;
	}

	button {
		margin-top: 1rem;
	}
</style>
