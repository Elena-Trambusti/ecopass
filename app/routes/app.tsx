import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useSearchParams } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { NavMenu } from "@shopify/app-bridge-react";
import { Banner, BlockStack } from "@shopify/polaris";
import polarisEn from "@shopify/polaris/locales/en.json";
import polarisItalian from "@shopify/polaris/locales/it.json";
import type { AdminLocale } from "../i18n/admin";
import { authenticate, ECOPASS_BILLING_PLAN } from "../shopify.server";
import {
  getMerchantSafeBillingError,
  isBillingApiBlockedForAppDistribution,
} from "../utils/billing.server";
import { getUiLocale } from "../utils/locale.server";

export type AppLoaderData = {
  apiKey: string;
  billingUnavailablePublicDistribution?: boolean;
  billingIssueMessage?: string;
  uiLocale: AdminLocale;
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { locale: uiLocale, setCookie } = await getUiLocale(request);
  const headers = new Headers();
  if (setCookie) headers.append("Set-Cookie", setCookie);

  const { billing } = await authenticate.admin(request);
  const isTestCharge = process.env.NODE_ENV !== "production";

  try {
    await billing.require({
      plans: [ECOPASS_BILLING_PLAN],
      isTest: isTestCharge,
      onFailure: async () =>
        billing.request({
          plan: ECOPASS_BILLING_PLAN,
          isTest: isTestCharge,
        }),
    });
  } catch (error) {
    if (isBillingApiBlockedForAppDistribution(error)) {
      return json<AppLoaderData>(
        {
          apiKey: process.env.SHOPIFY_API_KEY ?? "",
          billingUnavailablePublicDistribution: true,
          uiLocale,
        },
        { headers },
      );
    }
    const merchantSafeBillingError = getMerchantSafeBillingError(error);
    if (merchantSafeBillingError) {
      return json<AppLoaderData>(
        {
          apiKey: process.env.SHOPIFY_API_KEY ?? "",
          billingIssueMessage: merchantSafeBillingError,
          uiLocale,
        },
        { headers },
      );
    }
    throw error;
  }

  return json<AppLoaderData>(
    { apiKey: process.env.SHOPIFY_API_KEY ?? "", uiLocale },
    { headers },
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

function AppNavMenu({ uiLocale }: { uiLocale: AdminLocale }) {
  const [searchParams] = useSearchParams();
  const otherLang = uiLocale === "it" ? "en" : "it";
  const langParams = new URLSearchParams(searchParams);
  langParams.set("lang", otherLang);
  const appQs = langParams.toString();

  const homeTo = searchParams.toString() ? `/app?${searchParams.toString()}` : "/app";

  return (
    <NavMenu>
      <Link to={homeTo} rel="home">
        EcoPass
      </Link>
      <Link to={`/app?${appQs}`}>{uiLocale === "it" ? "English" : "Italiano"}</Link>
    </NavMenu>
  );
}

export default function AppLayout() {
  const { apiKey, billingUnavailablePublicDistribution, billingIssueMessage, uiLocale } =
    useLoaderData<AppLoaderData>();

  const polarisLocale = uiLocale === "en" ? polarisEn : polarisItalian;

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisLocale}>
      <AppNavMenu uiLocale={uiLocale} />
      <BlockStack gap="300">
        {billingUnavailablePublicDistribution ? (
          <Banner tone="warning" title={uiLocale === "it" ? "Billing API non disponibile" : "Billing API unavailable"}>
            {uiLocale === "it"
              ? "L'app non è ancora in distribuzione pubblica: Shopify blocca i test Billing API in questa fase."
              : "This app is not on public distribution yet: Shopify restricts Billing API in this phase."}
          </Banner>
        ) : null}
        {billingIssueMessage ? (
          <Banner tone="critical" title={uiLocale === "it" ? "Fatturazione" : "Billing"}>
            {billingIssueMessage}
          </Banner>
        ) : null}
        <Outlet />
      </BlockStack>
    </AppProvider>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}
