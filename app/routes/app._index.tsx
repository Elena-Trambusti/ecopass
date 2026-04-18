import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  InlineStack,
  Page,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import { useMemo, useState } from "react";
import { getOrCreateSettingsByShopDomain, saveSettingsByShopDomain } from "../models/settings.server";
import { authenticate } from "../shopify.server";
import { buildAutoDppFromProduct } from "../utils/dpp";

type LoaderData = {
  settings: {
    badgeColor: string;
    textColor: string;
    borderRadius: number;
    fontSize: number;
    isEnabled: boolean;
  };
  products: Array<{
    id: string;
    title: string;
  }>;
};

type ActionData =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

const BILLING_PLAN_LABEL = "EcoPass Pro";
const BILLING_PRICE_EUR = 14.99;
const BILLING_TRIAL_DAYS = 7;
const BILLING_CYCLE_DAYS = 30;

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

function isHexColor(value: string) {
  return /^#([0-9a-fA-F]{6})$/.test(value);
}

async function syncSettingsToShopMetafields(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  payload: {
    badgeColor: string;
    textColor: string;
    borderRadius: number;
    fontSize: number;
    isEnabled: boolean;
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

async function syncAutoProductMetafields(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  productId: string,
  payload: {
    materiali?: string;
    carbonFootprint?: string;
    riciclabilita?: number;
  },
) {
  const metafields: Array<{
    ownerId: string;
    namespace: string;
    key: string;
    type: string;
    value: string;
  }> = [];

  if (payload.materiali != null) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "materiali",
      type: "single_line_text_field",
      value: payload.materiali,
    });
  }
  if (payload.carbonFootprint != null) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "carbon_footprint",
      type: "single_line_text_field",
      value: payload.carbonFootprint,
    });
  }
  if (payload.riciclabilita != null) {
    metafields.push({
      ownerId: productId,
      namespace: "custom",
      key: "riciclabilit",
      type: "number_integer",
      value: String(payload.riciclabilita),
    });
  }
  if (metafields.length === 0) return;

  const mutation = `#graphql
    mutation EcoPassSetProductMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        userErrors {
          field
          message
        }
      }
    }
  `;

  const response = await admin.graphql(mutation, {
    variables: {
      metafields,
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
    throw new Error(`Errore salvataggio metafield prodotto: ${userErrors.map((e) => e.message).join("; ")}`);
  }
}

type ProductForAutofill = {
  id: string;
  title: string;
  productType: string;
  vendor: string;
  tags: string[];
  customMateriali?: { value?: string } | null;
  customCarbon?: { value?: string } | null;
  customRiciclabilita?: { value?: string } | null;
  legacyMaterials?: { value?: string } | null;
  legacyCarbon?: { value?: string } | null;
  legacyRecyclability?: { value?: string } | null;
};

async function ensureAutoMetafieldsForProducts(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  products: ProductForAutofill[],
) {
  for (const product of products) {
    const hasMaterials = Boolean(product.customMateriali?.value) || Boolean(product.legacyMaterials?.value);
    const hasCarbon = Boolean(product.customCarbon?.value) || Boolean(product.legacyCarbon?.value);
    const hasRecyclability =
      Boolean(product.customRiciclabilita?.value) || Boolean(product.legacyRecyclability?.value);

    if (hasMaterials && hasCarbon && hasRecyclability) continue;

    const auto = buildAutoDppFromProduct({
      title: product.title,
      productType: product.productType ?? "",
      vendor: product.vendor ?? "",
      tags: product.tags ?? [],
    });

    await syncAutoProductMetafields(admin, product.id, {
      materiali: hasMaterials ? undefined : auto.materiali,
      carbonFootprint: hasCarbon ? undefined : auto.carbonFootprint,
      riciclabilita: hasRecyclability ? undefined : auto.riciclabilita,
    });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const settings = await getOrCreateSettingsByShopDomain(session.shop);
  const productsQuery = `#graphql
    query EcoPassProducts {
      products(first: 50, sortKey: TITLE) {
        nodes {
          id
          title
          productType
          vendor
          tags
          customMateriali: metafield(namespace: "custom", key: "materiali") {
            value
          }
          customCarbon: metafield(namespace: "custom", key: "carbon_footprint") {
            value
          }
          customRiciclabilita: metafield(namespace: "custom", key: "riciclabilit") {
            value
          }
          legacyMaterials: metafield(namespace: "ecopass", key: "materials") {
            value
          }
          legacyCarbon: metafield(namespace: "ecopass", key: "carbon_footprint") {
            value
          }
          legacyRecyclability: metafield(namespace: "ecopass", key: "recyclability_index") {
            value
          }
        }
      }
    }
  `;
  const productsResponse = await admin.graphql(productsQuery);
  const productsPayload = (await productsResponse.json()) as {
    data?: {
      products?: {
        nodes?: Array<ProductForAutofill>;
      };
    };
  };
  const productNodes =
    productsPayload.data?.products?.nodes?.filter(
      (p): p is ProductForAutofill => Boolean(p.id) && Boolean(p.title),
    ) ?? [];

  try {
    await ensureAutoMetafieldsForProducts(admin, productNodes);
  } catch (error) {
    console.error("EcoPass: errore compilazione automatica loader", error);
  }

  const products = productNodes.map((p) => ({ id: p.id, title: p.title }));

  return json<LoaderData>({
    settings: {
      badgeColor: settings.badgeColor,
      textColor: settings.textColor,
      borderRadius: settings.borderRadius,
      fontSize: settings.fontSize,
      isEnabled: settings.isEnabled,
    },
    products,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const badgeColor = String(formData.get("badgeColor") ?? "").trim();
  const textColor = String(formData.get("textColor") ?? "").trim();
  const borderRadius = Number(formData.get("borderRadius") ?? 12);
  const fontSize = Number(formData.get("fontSize") ?? 14);
  const isEnabled = formData.get("isEnabled") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!isHexColor(badgeColor)) fieldErrors.badgeColor = "Inserisci un colore HEX valido (#RRGGBB).";
  if (!isHexColor(textColor)) fieldErrors.textColor = "Inserisci un colore HEX valido (#RRGGBB).";
  if (!Number.isFinite(borderRadius)) fieldErrors.borderRadius = "Valore non valido.";
  if (!Number.isFinite(fontSize)) fieldErrors.fontSize = "Valore non valido.";

  if (Object.keys(fieldErrors).length > 0) {
    return json<ActionData>(
      { ok: false, message: "Controlla i campi evidenziati.", fieldErrors },
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
    };

    await saveSettingsByShopDomain(session.shop, payload);

    try {
      await syncSettingsToShopMetafields(admin, payload);
    } catch (syncError) {
      // Salvataggio locale riuscito: non blocchiamo l'admin UI.
      console.error("EcoPass: sync metafields settings fallita", syncError);
    }

    return json<ActionData>({ ok: true, message: "Impostazioni salvate con successo." });
  } catch (error) {
    console.error("EcoPass: errore salvataggio impostazioni", error);
    return json<ActionData>(
      { ok: false, message: "Errore di rete o database. Riprova tra pochi secondi." },
      { status: 500 },
    );
  }
}

export default function EcoPassAdminPage() {
  const { settings, products } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [badgeColor, setBadgeColor] = useState(settings.badgeColor);
  const [textColor, setTextColor] = useState(settings.textColor);
  const [borderRadius, setBorderRadius] = useState(settings.borderRadius);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [isEnabled, setIsEnabled] = useState(settings.isEnabled);

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

  return (
    <Page title="EcoPass - Badge DPP">
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
            EcoPass - Badge DPP
          </Text>
        </InlineStack>

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
              alt="Piano"
              width={24}
              height={24}
              style={{ borderRadius: "6px", display: "block", flexShrink: 0 }}
            />
            <Text as="span" variant="bodyMd">
              Piano attivo: {BILLING_PLAN_LABEL} - {BILLING_PRICE_EUR.toFixed(2)} EUR/mese, prova gratuita di{" "}
              {BILLING_TRIAL_DAYS} giorni.
            </Text>
          </InlineStack>
        </Box>
        <Card>
          <BlockStack gap="200">
            <Text as="h2" variant="headingMd">
              Termini di fatturazione (IT)
            </Text>
            <Text as="p" variant="bodyMd">
              EcoPass Pro costa {BILLING_PRICE_EUR.toFixed(2)} EUR ogni {BILLING_CYCLE_DAYS} giorni dopo una
              prova gratuita di {BILLING_TRIAL_DAYS} giorni.
            </Text>
            <Text as="p" variant="bodyMd">
              Il piano si rinnova automaticamente finche&apos; non viene annullato dal merchant tramite Shopify
              Admin.
            </Text>
            <Text as="p" variant="bodyMd">
              L&apos;annullamento interrompe i rinnovi futuri; eventuali periodi gia&apos; pagati restano attivi fino
              a scadenza.
            </Text>
          </BlockStack>
          <Box paddingBlockStart="300">
            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Billing terms (EN)
              </Text>
              <Text as="p" variant="bodyMd">
                EcoPass Pro is billed at EUR {BILLING_PRICE_EUR.toFixed(2)} every {BILLING_CYCLE_DAYS} days
                after a {BILLING_TRIAL_DAYS}-day free trial.
              </Text>
              <Text as="p" variant="bodyMd">
                The subscription renews automatically until canceled by the merchant in Shopify Admin.
              </Text>
              <Text as="p" variant="bodyMd">
                Cancellation stops future renewals; any already-paid period remains active until its end date.
              </Text>
            </BlockStack>
          </Box>
        </Card>

        <Card>
          <Form method="post">
            <BlockStack gap="400">
              <InlineStack gap="400" align="start">
                <Box minWidth="280px">
                  <ColorPickerField
                    label="Colore badge (HEX)"
                    name="badgeColor"
                    value={badgeColor}
                    onChange={setBadgeColor}
                    error={actionData && !actionData.ok ? actionData.fieldErrors?.badgeColor : undefined}
                  />
                </Box>
                <Box minWidth="280px">
                  <ColorPickerField
                    label="Colore testo (HEX)"
                    name="textColor"
                    value={textColor}
                    onChange={setTextColor}
                    error={actionData && !actionData.ok ? actionData.fieldErrors?.textColor : undefined}
                  />
                </Box>
              </InlineStack>

              <RangeSlider
                label={`Raggio angoli: ${borderRadius}px`}
                min={0}
                max={40}
                step={1}
                value={borderRadius}
                onChange={(value) => setBorderRadius(Number(value))}
                output
              />
              <input type="hidden" name="borderRadius" value={borderRadius} />

              <RangeSlider
                label={`Dimensione font: ${fontSize}px`}
                min={10}
                max={22}
                step={1}
                value={fontSize}
                onChange={(value) => setFontSize(Number(value))}
                output
              />
              <input type="hidden" name="fontSize" value={fontSize} />

              <Checkbox
                label="Attiva badge globalmente"
                name="isEnabled"
                checked={isEnabled}
                onChange={setIsEnabled}
              />

              <InlineStack align="end">
                <Button submit variant="primary" loading={isSubmitting}>
                  Salva impostazioni
                </Button>
              </InlineStack>
            </BlockStack>
          </Form>
        </Card>

        <Card>
          <BlockStack gap="300">
            <Text as="h2" variant="headingMd">
              Preview
            </Text>
            {isEnabled ? (
              <div style={previewStyle}>
                <span aria-hidden>🌱</span>
                <span>DPP EcoPass pronto</span>
              </div>
            ) : (
              <Text as="p" tone="subdued">
                Badge disattivato: non verrà visualizzato nello storefront.
              </Text>
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
