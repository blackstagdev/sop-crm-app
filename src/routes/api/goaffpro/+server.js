import { getAffiliates, getOrders, getLastSaleDate, getFirstSaleDate, getFirstOrder, getLastOrder} from "$lib/goaffpro";

export async function GET() {
  try {
    // 1. Fetch all affiliates
    const affiliatesRes = await getAffiliates();
    const affiliates = affiliatesRes.affiliates ?? affiliatesRes.data ?? [];

    // 2. Fetch all orders (without affiliate_id filter)
    const ordersRes = await getOrders(); // don't pass id
    const orders = ordersRes.orders ?? ordersRes.data ?? [];

    // 3. Group orders by affiliate_id
    const ordersByAffiliate = new Map();
    for (const order of orders) {
      if (!ordersByAffiliate.has(order.affiliate_id)) {
        ordersByAffiliate.set(order.affiliate_id, []);
      }
      ordersByAffiliate.get(order.affiliate_id).push(order);
    }

   // 4. Affiliates summary
   const affiliateResults = affiliates.map((affiliate) => {
    const affOrders = ordersByAffiliate.get(affiliate.id) ?? [];
    const lastSaleDate = getLastSaleDate(affOrders);
    const firstSaleDate = getFirstSaleDate(affOrders);

    return {
      id: affiliate.id,
      name: affiliate.name,
      email: affiliate.email ? affiliate.email.toLowerCase() : null,
      lastSale: lastSaleDate ? lastSaleDate.toISOString().split("T")[0] : null,
      firstSale: firstSaleDate ? firstSaleDate.toISOString().split("T")[0] : null,
      revenue: affiliate.subtotal_revenue,
      referralCode: affiliate.ref_code
    };
  });

      // 5. Customers summary (global across all affiliates)
      const customerMap = new Map();

      for (const o of orders) {
        const key = o.customer?.id ?? o.customer?.email ?? o.customer_email;
        if (!key) continue;
      
        const createdAt = new Date(o.created);
      
        if (!customerMap.has(key)) {
          customerMap.set(key, {
            id: o.customer?.id ?? null,
            name: o.customer?.name ?? null,
            email: o.customer?.email ?? o.customer_email ?? null,
            orderCount: 1,
            firstOrderDate: createdAt,
            lastOrderDate: createdAt
          });
        } else {
          const c = customerMap.get(key);
          c.orderCount++;
          if (createdAt < c.firstOrderDate) c.firstOrderDate = createdAt;
          if (createdAt > c.lastOrderDate) c.lastOrderDate = createdAt;
          customerMap.set(key, c);
        }
      }
      
      const customerResults = [...customerMap.values()].map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        firstOrderDate: c.orderCount === 1 ? c.firstOrderDate.toISOString().split("T")[0] : null,
        lastOrderDate: c.lastOrderDate ? c.lastOrderDate.toISOString().split("T")[0] : null
      }));
  
      // 6. Final response object
      const completeResults = {
        affiliates: affiliateResults.filter(
          (r) =>
            r.id &&
            r.name &&
            r.email &&
            r.revenue &&
            r.referralCode &&
            r.lastSale ||
            r.firstSale
        ),
        customers: customerResults,
        partners: affiliates
      };
  
      return new Response(JSON.stringify(completeResults, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
