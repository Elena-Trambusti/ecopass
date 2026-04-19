import type { ActionFunctionArgs } from "@remix-run/node";
import { prisma } from "../db.server";
import { authenticate } from "../shopify.server";
import { logServerError, logServerInfo } from "../utils/log.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop, topic } = await authenticate.webhook(request);
  logServerInfo("webhook.uninstall.received", { topic, shop });

  try {
    const [deletedSessions, deletedShops] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { shop } }),
      prisma.shop.deleteMany({ where: { domain: shop } }),
    ]);

    logServerInfo("webhook.uninstall.cleanup", {
      shop,
      deletedSessions: deletedSessions.count,
      deletedShops: deletedShops.count,
    });
  } catch (error) {
    logServerError("webhook.uninstall.cleanup", error, { shop });
  }

  return new Response(null, { status: 200 });
}
