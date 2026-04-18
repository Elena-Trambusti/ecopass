import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import "@shopify/polaris/build/esm/styles.css";

/**
 * Shell HTML minimale (come shopify-app-template-remix).
 * App Bridge è iniettato da AppProvider nella route `app`.
 */
export default function App() {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
