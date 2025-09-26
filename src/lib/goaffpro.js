export async function getAffiliates() {
  const res = await fetch(
    `https://api.goaffpro.com/v1/admin/affiliates?fields=id,name,email,company_name,total_referral_earnings,total_network_earnings,total_other_earnings,number_of_orders,status,created_at, ref_code`,
    { headers: { "X-GOAFFPRO-ACCESS-TOKEN": "5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22" } }
  );
  return res.json();
}

export async function getOrders() {
  const res = await fetch(
    `https://api.goaffpro.com/v1/admin/orders?fields=id,affiliate_id,number,total,subtotal,commission,created,customer_email,status,customer`,
    { headers: { "X-GOAFFPRO-ACCESS-TOKEN": "5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22" } }
  );
  return res.json();
}

export function getLastSaleDate(orders) {
    if (!orders.length) return null;
    return orders
      .map((o) => new Date(o.created))
      .sort((a, b) => b - a)[0];
  }

export function getFirstSaleDate(orders) {
    if (!orders.length) return null;
  
    if (orders.length === 1) {
      return new Date(orders[0].created);
    }
  
    return null;
  }

  export function getLastOrder(orders) {
    if (!orders.length) return null;
  
    const sorted = [...orders].sort((a, b) => new Date(b.created) - new Date(a.created));
    const last = sorted[0];
  
    return {
      date: new Date(last.created),
      customerName: last.customer?.name ?? null,
      customerEmail: last.customer?.email ?? last.customer_email ?? null
    };
  }
  

export function getFirstOrder(allOrders) {
  if (!allOrders.length) return null;

  // Count orders globally per unique customer
  const counts = new Map();
  for (const o of allOrders) {
    const key = o.customer?.id ?? o.customer?.email ?? o.customer_email;
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Keep only customers who appear exactly once globally
  const firstTimers = allOrders.filter(o => {
    const key = o.customer?.id ?? o.customer?.email ?? o.customer_email;
    return key && counts.get(key) === 1;
  });

  if (!firstTimers.length) return null;

  // Get the earliest first-timer (by created date)
  const first = firstTimers.sort((a, b) => new Date(a.created) - new Date(b.created))[0];

  return {
    date: new Date(first.created),
    customerName: first.customer?.name ?? null,
    customerEmail: first.customer?.email ?? first.customer_email ?? null
  };
}

  