import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

/**
 * Per app embeddate, facciamo redirect automatico all'autenticazione Shopify.
 * Il form manuale non funziona nell'iframe per problemi di sicurezza (CSP).
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  if (shop) {
    // Redirect all'autenticazione Shopify
    const authUrl = `/auth?shop=${encodeURIComponent(shop)}`;
    console.log("[EcoPass Login] Redirecting to auth:", authUrl);
    return redirect(authUrl);
  }
  
  // Se manca shop, redirect alla root che gestisce il caso
  console.log("[EcoPass Login] Missing shop param, redirecting to root");
  return redirect("/");
}

export default function AuthLogin() {
  // Questo componente non dovrebbe mai renderizzare
  // perché il loader fa sempre redirect
  return null;
}
