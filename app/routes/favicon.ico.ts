import type { LoaderFunctionArgs } from "@remix-run/node";

export function loader(_args: LoaderFunctionArgs) {
  return new Response(null, { status: 204 });
}

