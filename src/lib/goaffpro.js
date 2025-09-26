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

  export function getLastOrder(allOrders) {
    if (!allOrders.length) return null;
  
    const byCustomer = new Map();
    for (const o of allOrders) {
      const key = o.customer?.id ?? o.customer?.email ?? o.customer_email;
      if (!key) continue;
  
      const createdAt = new Date(o.created);
      if (!byCustomer.has(key)) {
        byCustomer.set(key, [createdAt]);
      } else {
        byCustomer.get(key).push(createdAt);
      }
    }
  
    const results = [];
    for (const [key, dates] of byCustomer.entries()) {
      dates.sort((a, b) => a - b);
      const lastOrderDate = dates[dates.length - 1].toISOString().split("T")[0];
  
      results.push({
        customerId: key,
        lastOrderDate
      });
    }
  
    return results;
  }
  
  

  export function getFirstOrder(allOrders) {
    if (!allOrders.length) return null;
  
    // Group orders per customer
    const byCustomer = new Map();
    for (const o of allOrders) {
      const key = o.customer?.id ?? o.customer?.email ?? o.customer_email;
      if (!key) continue;
  
      const createdAt = new Date(o.created);
      if (!byCustomer.has(key)) {
        byCustomer.set(key, [createdAt]);
      } else {
        byCustomer.get(key).push(createdAt);
      }
    }
  
    // Collect results
    const results = [];
    for (const [key, dates] of byCustomer.entries()) {
      dates.sort((a, b) => a - b);
      let firstOrderDate = null;
  
      if (dates.length === 1) {
        firstOrderDate = dates[0].toISOString().split("T")[0];
      }
  
      results.push({
        customerId: key,
        firstOrderDate
      });
    }
  
    return results;
  }
  

  