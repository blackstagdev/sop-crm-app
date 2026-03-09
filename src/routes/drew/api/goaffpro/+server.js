import {
    getAffiliates,
    getOrders,
    getLastSaleDate,
    getFirstSaleDate
  } from "$lib/goaffpro";
  
  import {
    getSheetValues,
    replaceSheet,
    appendSheet
  } from "$lib/googleSheet.js";
  
  const SPREADSHEET_ID = "1TQXiYx6zYfSceDoltiPNpqcnZLr3dOgDjXQszL3yBFo"; 
  const SHEET_NAME = "affiliates";
  
  export async function GET({ url }) {
    // Read query params
    const ordersSince = url.searchParams.get("orders_since");
    const affiliatesSince = url.searchParams.get("affiliates_since");
  
    try {
      // 1. Fetch all affiliates
      const affiliatesRes = await getAffiliates(affiliatesSince);
      const affiliates = affiliatesRes.affiliates ?? affiliatesRes.data ?? [];
  
      // 2. Fetch all orders (without affiliate_id filter)
      const ordersRes = await getOrders(ordersSince);
      const orders = ordersRes.orders ?? ordersRes.data ?? [];
  
      // 3. Group orders by affiliate_id
      const ordersByAffiliate = new Map();
      for (const order of orders) {
        const affId = order.affiliate_id;
        if (!affId) continue;
  
        if (!ordersByAffiliate.has(affId)) ordersByAffiliate.set(affId, []);
        ordersByAffiliate.get(affId).push(order);
      }
  
      // 4. Affiliates summary (KEEP affiliates even if they have 0 sales)
      const affiliateResults = affiliates
        .map((affiliate) => {
          const affOrders = ordersByAffiliate.get(affiliate.id) ?? [];
          const lastSaleDate = getLastSaleDate(affOrders);
          const firstSaleDate = getFirstSaleDate(affOrders);
  
          return {
            id: affiliate.id ?? null,
            name: affiliate.name ?? null,
            email: affiliate.email ? String(affiliate.email).toLowerCase() : null,
            lastSale: lastSaleDate ? lastSaleDate.toISOString().split("T")[0] : null,
            firstSale: firstSaleDate ? firstSaleDate.toISOString().split("T")[0] : null,
            revenue: Number(affiliate.subtotal_revenue ?? 0), // normalize to number
            referralCode: affiliate.ref_code ?? null,
            salesCount: affOrders.length
          };
        })
        // only remove truly broken records (NOT 0 sales)
        .filter((r) => r.id && r.name && r.email && r.referralCode);
  
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
            lastOrderDate: createdAt,
            totalSale: Number(o.total ?? 0),
            revenue: Number(o.subtotal ?? 0)
          });
        } else {
          const c = customerMap.get(key);
          c.orderCount++;
          if (createdAt < c.firstOrderDate) c.firstOrderDate = createdAt;
          if (createdAt > c.lastOrderDate) c.lastOrderDate = createdAt;
  
          // If you want totals across multiple orders, uncomment:
          // c.totalSale = (c.totalSale ?? 0) + Number(o.total ?? 0);
          // c.revenue = (c.revenue ?? 0) + Number(o.subtotal ?? 0);
  
          customerMap.set(key, c);
        }
      }
  
      const customerResults = [...customerMap.values()].map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        firstOrderDate: c.orderCount === 1 ? c.firstOrderDate.toISOString().split("T")[0] : null,
        lastOrderDate: c.lastOrderDate ? c.lastOrderDate.toISOString().split("T")[0] : null,
        totalSale: c.totalSale,
        revenue: c.revenue
      }));
  
      // 6. Find latest created_at for orders and affiliates
      const latestOrderDate = orders.length
        ? new Date(Math.max(...orders.map((o) => new Date(o.created).getTime())))
        : null;
  
      const latestAffiliateDate = affiliates.length
        ? new Date(Math.max(...affiliates.map((a) => new Date(a.created_at).getTime())))
        : null;
  
      // 7. Build sheet rows for "30days"
      const headers = [
        "ID",
        "Name",
        "Email",
        "Referral Code",
        "Revenue",
        "Sales Count",
        "First Sale",
        "Last Sale"
      ];
  
      const rows = affiliateResults.map((a) => [
        a.id,
        a.name,
        a.email,
        a.referralCode,
        a.revenue,
        a.salesCount,
        a.firstSale ?? "",
        a.lastSale ?? ""
      ]);
  
      // 8. Auto-save to Google Sheet on every GET
      if (rows.length > 0) {
        await replaceSheet(SPREADSHEET_ID, SHEET_NAME, rows, headers);
      }
  
      // 9. Final response object
      const completeResults = {
        affiliates: affiliateResults,
        customers: customerResults,
        partners: affiliates,
        tracker: {
          orders: latestOrderDate ?? null,
          affiliates: latestAffiliateDate ?? null
        }
      };
  
      return new Response(JSON.stringify(completeResults, null, 2), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }
  