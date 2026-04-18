import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { topic, shop } = await authenticate.webhook(request);
  console.info("EcoPass privacy webhook received", { topic, shop });

  try {
    await prisma.$transaction([
      prisma.session.deleteMany({ where: { shop } }),
      prisma.shop.deleteMany({ where: { domain: shop } }),
    ]);
  } catch (error) {
    console.error("EcoPass shop redact cleanup failed", { shop, error });
  }

  return new Response(null, { status: 200 });
}

