import { createCookie } from "@remix-run/node";
import type { AdminLocale } from "../i18n/admin";

const localeCookie = createCookie("ecopass-lang", {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
  httpOnly: true,
});

export async function getUiLocale(request: Request): Promise<{ locale: AdminLocale; setCookie: string | null }> {
  const url = new URL(request.url);
  const qp = url.searchParams.get("lang");
  if (qp === "en" || qp === "it") {
    return { locale: qp, setCookie: await localeCookie.serialize(qp) };
  }
  const parsed = await localeCookie.parse(request.headers.get("Cookie"));
  if (parsed === "en" || parsed === "it") {
    return { locale: parsed, setCookie: null };
  }
  const al = request.headers.get("Accept-Language") || "";
  const locale = /^en/i.test(al.trim()) ? "en" : "it";
  return { locale, setCookie: null };
}
