import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

const port = Number(process.env.PORT ?? 5173);
const host = "127.0.0.1";

export default defineConfig({
  plugins: [remix()],
  server: {
    host,
    port,
    strictPort: true,
    // Shopify CLI espone l'app su un dominio trycloudflare.com in dev.
    // Permettiamo questi host per evitare il blocco "Blocked request. This host is not allowed."
    allowedHosts: [".trycloudflare.com", "localhost", "127.0.0.1"],
  },
});
