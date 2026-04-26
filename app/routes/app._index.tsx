import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  IndexTable,
  InlineStack,
  Page,
  RangeSlider,
  Text,
} from "@shopify/polaris";
import { useMemo, useState } from "react";
import { adminCopy, interpolate, type AdminLocale } from "../i18n/admin";
import { ensureAutoMetafieldsForProducts } from "../models/dpp-sync.server";
import { getOrCreateSettingsByShopDomain, saveSettingsByShopDomain } from "../models/settings.server";
import { fetchProductsPage, type ProductWithDppFields } from "../models/products-page.server";
import { authenticate } from "../shopify.server";
import { logServerError } from "../utils/log.server";
import { getUiLocale } from "../utils/locale.server";
import { isHexColor } from "../utils/validation";

const PAGE_SIZE = 15;

type LoaderData = {
  uiLocale: AdminLocale;
  settings: {
    badgeColor: string;
    textColor: string;
    borderRadius: number;
    fontSize: number;
    isEnabled: boolean;
    showEstimatedFallbacks: boolean;
  };
  products: Array<{
    id: string;
    title: string;
    materialsOk: boolean;
    carbonOk: boolean;
    recycleOk: boolean;
    status: "complete" | "partial" | "empty";
  }>;
  pagination: {
    after: string | null;
    hasNextPage: boolean;
    endCursor: string | null;
    pageSize: number;
  };
};

type ActionData =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const ECOPASS_BILLING_PLAN_LABEL = "EcoPass Pro";
const ECOPASS_BILLING_PRICE_EUR = 14.99;
const ECOPASS_BILLING_TRIAL_DAYS = 7;
const ECOPASS_BILLING_CYCLE_DAYS = 30;

function rowStatus(p: ProductWithDppFields): LoaderData["products"][0] {
  const materialsOk =
    Boolean(p.customMateriali?.value) || Boolean(p.legacyMaterials?.value);
  const carbonOk = Boolean(p.customCarbon?.value) || Boolean(p.legacyCarbon?.value);
  const recycleOk =
    Boolean(p.customRiciclabilita?.value) || Boolean(p.legacyRecyclability?.value);

  let status: "complete" | "partial" | "empty";
  if (materialsOk && carbonOk && recycleOk) status = "complete";
  else if (materialsOk || carbonOk || recycleOk) status = "partial";
  else status = "empty";

  return {
    id: p.id,
    title: p.title,
    materialsOk,
    carbonOk,
    recycleOk,
    status,
  };
}

function ColorPickerField({
  label,
  name,
  value,
  onChange,
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <BlockStack gap="100">
      <Text as="p" variant="bodyMd">
        {label}
      </Text>
      <InlineStack gap="300" blockAlign="center">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value.toUpperCase())}
          style={{
            width: "48px",
            height: "32px",
            border: "1px solid #c9cccf",
            borderRadius: "8px",
            background: "transparent",
            cursor: "pointer",
          }}
          aria-label={label}
        />
        <Text as="p" tone="subdued" variant="bodySm">
          {value.toUpperCase()}
        </Text>
      </InlineStack>
      {error ? (
        <Text as="p" tone="critical" variant="bodySm">
          {error}
        </Text>
      ) : null}
    </BlockStack>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

async function syncSettingsToShopMetafields(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  payload: {
    badgeColor: string;
    textColor: string;
    borderRadius: number;
    fontSize: number;
    isEnabled: boolean;
    showEstimatedFallbacks: boolean;
  },
) {
  const shopQuery = `#graphql
    query EcoPassShopId {
      shop {
        id
      }
    }
  `;
  const shopResponse = await admin.graphql(shopQuery);
  const shopPayload = (await shopResponse.json()) as { data?: { shop?: { id?: string } } };
  const shopId = shopPayload.data?.shop?.id;
  if (!shopId) throw new Error("Impossibile recuperare Shop ID per sync metafields.");

  const mutation = `#graphql
    mutation EcoPassSyncMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const entries = [
    ["badge_color", payload.badgeColor, "single_line_text_field"],
    ["text_color", payload.textColor, "single_line_text_field"],
    ["border_radius", String(payload.borderRadius), "number_integer"],
    ["font_size", String(payload.fontSize), "number_integer"],
    ["is_enabled", String(payload.isEnabled), "boolean"],
    ["show_fallbacks", String(payload.showEstimatedFallbacks), "boolean"],
  ] as const;

  const response = await admin.graphql(mutation, {
    variables: {
      metafields: entries.map(([key, value, type]) => ({
        ownerId: shopId,
        namespace: "ecopass_settings",
        key,
        type,
        value,
      })),
    },
  });

  const jsonPayload = (await response.json()) as {
    data?: {
      metafieldsSet?: {
        userErrors?: Array<{ message: string }>;
      };
    };
  };

  const userErrors = jsonPayload.data?.metafieldsSet?.userErrors ?? [];
  if (userErrors.length > 0) {
    throw new Error(`Metafields sync error: ${userErrors.map((e) => e.message).join("; ")}`);
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { locale: uiLocale } = await getUiLocale(request);
  const authResult = await authenticate.admin(request);
  
  // Se authenticate lancia una Response (redirect OAuth), lasciala passare
  const { session, admin } = authResult;
  
  let settings;
  try {
    settings = await getOrCreateSettingsByShopDomain(session.shop);
  } catch (e) {
    if (e instanceof Response) throw e;
    console.error("[EcoPass app._index] Settings error:", e);
    settings = {
      badgeColor: "#2E7D32",
      textColor: "#FFFFFF",
      borderRadius: 12,
      fontSize: 14,
      isEnabled: true,
      showEstimatedFallbacks: true,
    };
  }

  const url = new URL(request.url);
  const after = url.searchParams.get("after") || null;

  let products: LoaderData["products"] = [];
  let pageInfo = { hasNextPage: false, endCursor: null as string | null };

  try {
    const result = await fetchProductsPage(admin, {
      first: PAGE_SIZE,
      after,
    });
    products = result.nodes.map(rowStatus);
    pageInfo = result.pageInfo;
  } catch (e) {
    if (e instanceof Response) throw e;
    console.error("[EcoPass app._index] Products fetch error:", e);
    // Mostra pagina vuota invece di crashare con 403
  }

  return json<LoaderData>({
    uiLocale,
    settings: {
      badgeColor: settings.badgeColor,
      textColor: settings.textColor,
      borderRadius: settings.borderRadius,
      fontSize: settings.fontSize,
      isEnabled: settings.isEnabled,
      showEstimatedFallbacks: settings.showEstimatedFallbacks,
    },
    products,
    pagination: {
      after,
      hasNextPage: pageInfo.hasNextPage,
      endCursor: pageInfo.endCursor,
      pageSize: PAGE_SIZE,
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "save");

  const url = new URL(request.url);
  const afterParam = url.searchParams.get("after");

  if (intent === "sync-auto") {
    try {
      const { nodes } = await fetchProductsPage(admin, {
        first: PAGE_SIZE,
        after: afterParam,
      });
      await ensureAutoMetafieldsForProducts(admin, nodes);
      const next = new URL(request.url);
      next.searchParams.set("synced", "1");
      return redirect(next.toString());
    } catch (e) {
      if (e instanceof Response) throw e;
      logServerError("app._index.sync-auto", e, { shop: session.shop });
      const { locale } = await getUiLocale(request);
      return json<ActionData>(
        { ok: false, message: adminCopy(locale).errSave },
        { status: 500 },
      );
    }
  }

  const badgeColor = String(formData.get("badgeColor") ?? "").trim();
  const textColor = String(formData.get("textColor") ?? "").trim();
  const borderRadius = Number(formData.get("borderRadius") ?? 12);
  const fontSize = Number(formData.get("fontSize") ?? 14);
  const isEnabled = formData.get("isEnabled") === "on";
  const showEstimatedFallbacks = formData.get("showEstimatedFallbacks") === "on";

  const { locale: errLocale } = await getUiLocale(request);
  const str = adminCopy(errLocale);

  const fieldErrors: Record<string, string> = {};
  if (!isHexColor(badgeColor))
    fieldErrors.badgeColor =
      errLocale === "it" ? "Inserisci un colore HEX valido (#RRGGBB)." : "Enter a valid HEX colour (#RRGGBB).";
  if (!isHexColor(textColor))
    fieldErrors.textColor =
      errLocale === "it" ? "Inserisci un colore HEX valido (#RRGGBB)." : "Enter a valid HEX colour (#RRGGBB).";
  if (!Number.isFinite(borderRadius))
    fieldErrors.borderRadius = errLocale === "it" ? "Valore non valido." : "Invalid value.";
  if (!Number.isFinite(fontSize))
    fieldErrors.fontSize = errLocale === "it" ? "Valore non valido." : "Invalid value.";

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>(
      { ok: false, message: str.errValidation, fieldErrors },
      { status: 400 },
    );
  }

  try {
    const payload = {
      badgeColor,
      textColor,
      borderRadius: clamp(Math.round(borderRadius), 0, 40),
      fontSize: clamp(Math.round(fontSize), 10, 22),
      isEnabled,
      showEstimatedFallbacks,
    };

    await saveSettingsByShopDomain(session.shop, payload);

    try {
      await syncSettingsToShopMetafields(admin, payload);
    } catch (syncError) {
      console.error("EcoPass: sync metafields settings fallita", syncError);
    }

    return json<ActionData>({ ok: true, message: str.saved });
  } catch (error) {
    logServerError("app._index.save", error, { shop: session.shop });
    return json<ActionData>({ ok: false, message: str.errSave }, { status: 500 });
  }
}

export default function EcoPassAdminPage() {
  const { uiLocale, settings, products, pagination } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const str = adminCopy(uiLocale);
  const formAction = `/app?${searchParams.toString()}`;

  const [badgeColor, setBadgeColor] = useState(settings.badgeColor);
  const [textColor, setTextColor] = useState(settings.textColor);
  const [borderRadius, setBorderRadius] = useState(settings.borderRadius);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);
  const [showEstimatedFallbacks, setShowEstimatedFallbacks] = useState(settings.showEstimatedFallbacks);

  const previewStyle = useMemo(
    () => ({
      backgroundColor: badgeColor,
      color: textColor,
      borderRadius: `${borderRadius}px`,
      fontSize: `${fontSize}px`,
      padding: "10px 14px",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      border: "1px solid rgba(0,0,0,0.08)",
      fontWeight: 600 as const,
    }),
    [badgeColor, textColor, borderRadius, fontSize],
  );

  const statusLabel = (s: LoaderData["products"][0]["status"]) => {
    if (s === "complete") return str.statusComplete;
    if (s === "partial") return str.statusPartial;
    return str.statusEmpty;
  };

  const planLine = interpolate(str.planActive, {
    price: ECOPASS_BILLING_PRICE_EUR.toFixed(2),
    cycle: ECOPASS_BILLING_CYCLE_DAYS,
    trial: ECOPASS_BILLING_TRIAL_DAYS,
  });

  function buildAppUrl(updates: Record<string, string | undefined>) {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/app?${qs}` : "/app";
  }

  const syncedOk = searchParams.get("synced") === "1";

  const rowMarkup = products.map((product, index) => (
    <IndexTable.Row id={product.id} key={product.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {product.title}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{product.materialsOk ? "✓" : "—"}</IndexTable.Cell>
      <IndexTable.Cell>{product.carbonOk ? "✓" : "—"}</IndexTable.Cell>
      <IndexTable.Cell>{product.recycleOk ? "✓" : "—"}</IndexTable.Cell>
      <IndexTable.Cell>{statusLabel(product.status)}</IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page title={str.pageTitle}>
      <BlockStack gap="400">
        <InlineStack gap="300" blockAlign="center">
          <img
            src="/ecopass-logo.svg"
            alt="EcoPass"
            width={32}
            height={32}
            style={{ borderRadius: "8px", display: "block" }}
          />
          <Text as="h1" variant="headingLg">
            {str.pageTitle}
          </Text>
        </InlineStack>

        {syncedOk ? (
          <Banner tone="success">{str.syncDone}</Banner>
        ) : null}

        {actionData?.message ? (
          <Banner tone={actionData.ok ? "success" : "critical"}>{actionData.message}</Banner>
        ) : null}

        <Box
          background="bg-surface-info"
          borderColor="border"
          borderWidth="025"
          borderRadius="300"
          padding="300"
        >
          <InlineStack gap="300" blockAlign="center" wrap={false}>
            <img
              src="/plan-logo.svg"
              alt=""
              width={24}
              height={24}
              style={{ borderRadius: "6px", display: "block", flexShrink: 0 }}
            />
            <Text as="span" variant="bodyMd">
              {planLine}
            </Text>
          </InlineStack>
        </Box>

        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              {str.billingCardIt}
            </Text>
            <Text as="p" variant="bodyMd">
              {interpolate(str.billingBodyItA, {
                price: ECOPASS_BILLING_PRICE_EUR.toFixed(2),
                cycle: ECOPASS_BILLING_CYCLE_DAYS,
                trial: ECOPASS_BILLING_TRIAL_DAYS,
              })}
            </Text>
            <Text as="p" variant="bodyMd">
              {str.billingBodyItB}
            </Text>
            <Text as="p" variant="bodyMd">
              {str.billingBodyItC}
            </Text>
          </BlockStack>
          <Box paddingBlockStart="300">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                {str.billingCardEn}
              </Text>
              <Text as="p" variant="bodyMd">
                {interpolate(str.billingBodyEnA, {
                  price: ECOPASS_BILLING_PRICE_EUR.toFixed(2),
                  cycle: ECOPASS_BILLING_CYCLE_DAYS,
                  trial: ECOPASS_BILLING_TRIAL_DAYS,
                })}
              </Text>
              <Text as="p" variant="bodyMd">
                {str.billingBodyEnB}
              </Text>
              <Text as="p" variant="bodyMd">
                {str.billingBodyEnC}
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              {str.productsTitle}
            </Text>
            <Text as="p" variant="bodyMd" tone="subdued">
              {str.productsHelp}
            </Text>
            {products.length === 0 ? (
              <Text as="p" tone="subdued">
                {uiLocale === "it" ? "Nessun prodotto nel catalogo." : "No products in the catalog."}
              </Text>
            ) : (
              <IndexTable
                resourceName={{
                  singular: uiLocale === "it" ? "prodotto" : "product",
                  plural: uiLocale === "it" ? "prodotti" : "products",
                }}
                itemCount={products.length}
                headings={[
                  { title: str.colProduct },
                  { title: str.colMaterials },
                  { title: str.colCarbon },
                  { title: str.colRecycle },
                  { title: str.colStatus },
                ]}
                selectable={false}
              >
                {rowMarkup}
              </IndexTable>
            )}

            <InlineStack gap="300" wrap>
              <Form method="post" action={formAction}>
                <input type="hidden" name="intent" value="sync-auto" />
                <Button submit loading={isSubmitting}>
                  {str.syncPage}
                </Button>
              </Form>
              {pagination.hasNextPage && pagination.endCursor ? (
                <Button url={buildAppUrl({ after: pagination.endCursor!, synced: undefined })}>
                  {str.paginationNext}
                </Button>
              ) : null}
              {pagination.after ? (
                <Button url={buildAppUrl({ after: undefined, synced: undefined })}>
                  {str.paginationStart}
                </Button>
              ) : null}
            </InlineStack>
          </BlockStack>
        </Card>

        <Card>
          <Form method="post" action={formAction}>
            <input type="hidden" name="intent" value="save" />
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                {str.appearance}
              </Text>

              <BlockStack gap="200">
                <Text as="h3" variant="headingSm">
                  {str.fallbacksTitle}
                </Text>
                <Text as="p" variant="bodySm" tone="subdued">
                  {str.fallbacksHelp}
                </Text>
                <Checkbox
                  label={str.fallbacksLabel}
                  name="showEstimatedFallbacks"
                  checked={showEstimatedFallbacks}
                  onChange={setShowEstimatedFallbacks}
                />
              </BlockStack>

              <InlineStack gap="400" align="start">
                <Box minWidth="280px">
                  <ColorPickerField
                    label={str.colorBadge}
                    name="badgeColor"
                    value={badgeColor}
                    onChange={setBadgeColor}
                    error={
                      actionData && !actionData.ok ? actionData.fieldErrors?.badgeColor : undefined
                    }
                  />
                </Box>
                <Box minWidth="280px">
                  <ColorPickerField
                    label={str.colorText}
                    name="textColor"
                    value={textColor}
                    onChange={setTextColor}
                    error={
                      actionData && !actionData.ok ? actionData.fieldErrors?.textColor : undefined
                    }
                  />
                </Box>
              </InlineStack>

              <RangeSlider
                label={`${str.radius}: ${borderRadius}px`}
                min={0}
                max={40}
                step={1}
                value={borderRadius}
                onChange={(value) => setBorderRadius(Number(value))}
                output
              />
              <input type="hidden" name="borderRadius" value={borderRadius} />

              <RangeSlider
                label={`${str.fontSize}: ${fontSize}px`}
                min={10}
                max={22}
                step={1}
                value={fontSize}
                onChange={(value) => setFontSize(Number(value))}
                output
              />
              <input type="hidden" name="fontSize" value={fontSize} />

              <Checkbox
                label={str.enableGlobal}
                name="isEnabled"
                checked={isEnabled}
                onChange={setIsEnabled}
              />

              <InlineStack align="end">
                <Button submit variant="primary" loading={isSubmitting}>
                  {str.save}
                </Button>
              </InlineStack>
            </BlockStack>
          </Form>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              {str.preview}
            </Text>
            {isEnabled ? (
              <div style={previewStyle}>
                <span aria-hidden>🌱</span>
                <span>{str.previewOn}</span>
              </div>
            ) : (
              <Text as="p" tone="subdued">
                {str.previewOff}
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
