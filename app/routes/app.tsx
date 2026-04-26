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
import { authenticate, ECOPASS_BILLING_PLAN, ECOPASS_BILLING_PLAN_ANNUAL } from "../shopify.server";
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
  console.log("[EcoPass Loader Start]", request.url);
  
  let uiLocale: AdminLocale = "it";
  let headers = new Headers();
  
  try {
    const localeResult = await getUiLocale(request);
    uiLocale = localeResult.locale;
    const setCookie = localeResult.setCookie;
    if (setCookie) headers.append("Set-Cookie", setCookie);

    const isTestCharge = process.env.NODE_ENV !== "production";
    console.log("[EcoPass Loader] NODE_ENV:", process.env.NODE_ENV, "isTestCharge:", isTestCharge);
    console.log("[EcoPass Loader] API_KEY presente:", Boolean(process.env.SHOPIFY_API_KEY));

    console.log("[EcoPass Loader] Authenticating...");
    const { billing } = await authenticate.admin(request);
    console.log("[EcoPass Loader] Authenticated OK");

    try {
      await billing.require({
        plans: [ECOPASS_BILLING_PLAN, ECOPASS_BILLING_PLAN_ANNUAL],
        isTest: isTestCharge,
        onFailure: async () =>
          billing.request({
            plan: ECOPASS_BILLING_PLAN,
            isTest: isTestCharge,
          }),
      });
      console.log("[EcoPass Loader] Billing OK");
    } catch (billingError) {
      // Le Response sono redirect al checkout Shopify - lasciale passare!
      if (billingError instanceof Response) {
        throw billingError;
      }
      
      console.log("[EcoPass Loader] Billing error type:", billingError?.constructor?.name);
      
      if (isBillingApiBlockedForAppDistribution(billingError)) {
        return json<AppLoaderData>(
          {
            apiKey: process.env.SHOPIFY_API_KEY ?? "",
            billingUnavailablePublicDistribution: true,
            uiLocale,
          },
          { headers },
        );
      }
      
      const merchantSafeBillingError = getMerchantSafeBillingError(billingError);
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
      
      console.log("[EcoPass Loader] Unhandled billing error, showing banner");
      return json<AppLoaderData>(
        {
          apiKey: process.env.SHOPIFY_API_KEY ?? "",
          billingIssueMessage: uiLocale === "it" 
            ? "Verifica abbonamento in corso. L'app è temporaneamente in modalità limitata."
            : "Subscription verification in progress. App temporarily in limited mode.",
          uiLocale,
        },
        { headers },
      );
    }

    return json<AppLoaderData>(
      { apiKey: process.env.SHOPIFY_API_KEY ?? "", uiLocale },
      { headers },
    );
  } catch (error) {
    // Le Response sono redirect OAuth intenzionali di Shopify - lasciale passare!
    if (error instanceof Response) {
      console.log("[EcoPass Loader] OAuth redirect, passing through");
      throw error;
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[EcoPass Loader CRITICAL ERROR]", {
      url: request.url,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Per errori reali, mostra una risposta valida
    return json<AppLoaderData>(
      { 
        apiKey: process.env.SHOPIFY_API_KEY ?? "", 
        uiLocale,
        billingIssueMessage: uiLocale === "it" 
          ? "Errore di connessione. Ricarica la pagina o contatta il supporto."
          : "Connection error. Please refresh or contact support."
      },
      { headers },
    );
  }
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
  console.log("[EcoPass Client] AppLayout rendering...");
  
  const { apiKey, billingUnavailablePublicDistribution, billingIssueMessage, uiLocale } =
    useLoaderData<AppLoaderData>();

  console.log("[EcoPass Client] Data received:", { apiKey: !!apiKey, billingUnavailablePublicDistribution, billingIssueMessage, uiLocale });
  
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
  const error = useRouteError();
  console.error("[EcoPass App ErrorBoundary]", error);
  return boundary.error(error);
}
