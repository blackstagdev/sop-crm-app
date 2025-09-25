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

export function getLastOrderDate(orders) {
    if (!orders.length) return null;
    return orders
      .map((o) => new Date(o.created))
      .sort((a, b) => b - a)[0];
  }