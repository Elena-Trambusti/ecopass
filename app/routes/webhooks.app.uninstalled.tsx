import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop, topic } = await authenticate.webhook(request);
  console.info("EcoPass webhook received", { topic, shop });

  try {
    const [deletedSessions, deletedShops] = await prisma.$transaction([
      prisma.session.deleteMany({ where: { shop } }),
      prisma.shop.deleteMany({ where: { domain: shop } }),
    ]);

    console.info("EcoPass uninstall cleanup completed", {
      shop,
      deletedSessions: deletedSessions.count,
      deletedShops: deletedShops.count,
    });
  } catch (error) {
    console.error("EcoPass uninstall cleanup failed", { shop, error });
  }

  return new Response(null, { status: 200 });
}
