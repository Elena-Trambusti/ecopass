import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

/**
 * Shopify carica spesso l'iframe su `/?shop=...&host=...&embedded=1`.
 * Senza questa route, `/` non ha contenuto → iframe bianco e postMessage falliti.
 * Allineato a shopify-app-template-remix (routes/_index).
 */
export function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  if (url.searchParams.get("shop")) {
    return redirect(`/app?${url.searchParams.toString()}`);
  }
  return redirect("/auth/login");
}

export default function Index() {
  return null;
}
