import type { HeadersFunction, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useSearchParams } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { NavMenu } from "@shopify/app-bridge-react";
import { Banner, BlockStack } from "@shopify/polaris";
import polarisItalian from "@shopify/polaris/locales/it.json";
import { authenticate, ECOPASS_BILLING_PLAN } from "../shopify.server";
import {
  getMerchantSafeBillingError,
  isBillingApiBlockedForAppDistribution,
} from "../utils/billing.server";

export type AppLoaderData = {
  apiKey: string;
  billingUnavailablePublicDistribution?: boolean;
  billingIssueMessage?: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
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
      return json<AppLoaderData>({
        apiKey: process.env.SHOPIFY_API_KEY ?? "",
        billingUnavailablePublicDistribution: true,
      });
    }
    const merchantSafeBillingError = getMerchantSafeBillingError(error);
    if (merchantSafeBillingError) {
      return json<AppLoaderData>({
        apiKey: process.env.SHOPIFY_API_KEY ?? "",
        billingIssueMessage: merchantSafeBillingError,
      });
    }
    throw error;
  }

  return json<AppLoaderData>({ apiKey: process.env.SHOPIFY_API_KEY ?? "" });
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

/** Mantiene shop/host/embedded nelle navigazioni (necessario per App Bridge). */
function AppNavMenu() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  const suffix = qs ? `?${qs}` : "";

  return (
    <NavMenu>
      <Link to={`/app${suffix}`} rel="home">
        EcoPass
      </Link>
    </NavMenu>
  );
}

export default function AppLayout() {
  const { apiKey, billingUnavailablePublicDistribution, billingIssueMessage } =
    useLoaderData<AppLoaderData>();

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey} i18n={polarisItalian}>
      <AppNavMenu />
      <BlockStack gap="300">
        {billingUnavailablePublicDistribution ? (
          <Banner tone="warning" title="Billing API non disponibile in questo ambiente">
            L&apos;app non è ancora in distribuzione pubblica: Shopify blocca i test Billing API in questa fase.
            App e dashboard restano utilizzabili in sviluppo.
          </Banner>
        ) : null}
        {billingIssueMessage ? (
          <Banner tone="critical" title="Problema di fatturazione">
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
