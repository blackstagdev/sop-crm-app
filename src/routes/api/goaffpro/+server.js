import { getAffiliates, getOrders, getLastOrderDate } from "$lib/goaffpro";

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

    // 4. Build results
    const results = affiliates.map((affiliate) => {
      const affOrders = ordersByAffiliate.get(affiliate.id) ?? [];
      const lastOrderDate = getLastOrderDate(affOrders);

      return {
        id: affiliate.id,
        name: affiliate.name,
        email: affiliate.email ? affiliate.email.toLowerCase() : null,
        lastOrder: lastOrderDate
    ? lastOrderDate.toISOString().split("T")[0] 
    : null,
        revenue: affiliate.subtotal_revenue,
        referralCode: affiliate.ref_code
      };
    });

    const completeResults = results.filter(r =>
      r.id && r.name && r.email && r.revenue && r.referralCode && r.lastOrder
    );

    return new Response(JSON.stringify(completeResults, null, 2), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
