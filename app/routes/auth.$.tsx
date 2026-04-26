import type { LoaderFunctionArgs } from "@remix-run/node";
import shopify from "../shopify.server";

/**
 * Route splat richiesta da @shopify/shopify-app-remix per OAuth / token exchange
 * (es. /auth/callback, /auth/session-token, ecc.).
 * NON catturare le eccezioni: shopify-app-remix lancia Response 302 per i redirect OAuth.
 */
export async function loader({ request }: LoaderFunctionArgs) {
  await shopify.authenticate.admin(request);
  return null;
}
