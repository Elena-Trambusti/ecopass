import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.info("EcoPass privacy webhook received", {
    topic,
    shop,
    customerId: payload?.customer?.id ?? null,
    ordersRequested: Array.isArray(payload?.orders_requested) ? payload.orders_requested.length : 0,
  });

  return new Response(null, { status: 200 });
}

