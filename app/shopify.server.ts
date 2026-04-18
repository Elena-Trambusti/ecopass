import "@shopify/shopify-app-remix/server/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  DeliveryMethod,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import type { Session } from "@shopify/shopify-api";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./db.server";

const productMetafieldDefinitions = [
  {
    name: "Materiali",
    key: "materials",
    type: "list.single_line_text_field",
    description: "Composizione materiale del prodotto per DPP UE 2026.",
  },
  {
    name: "Carbon Footprint",
    key: "carbon_footprint",
    type: "single_line_text_field",
    description: "Impronta di carbonio dichiarata per unità di prodotto.",
  },
  {
    name: "Recyclability Index",
    key: "recyclability_index",
    type: "number_integer",
    description: "Indice di riciclabilità da 0 a 100.",
  },
] as const;

const shopSettingsMetafieldDefinitions = [
  {
    name: "EcoPass Badge Color",
    key: "badge_color",
    type: "single_line_text_field",
    description: "Colore badge configurato nella dashboard EcoPass.",
  },
  {
    name: "EcoPass Text Color",
    key: "text_color",
    type: "single_line_text_field",
    description: "Colore testo badge configurato nella dashboard EcoPass.",
  },
  {
    name: "EcoPass Border Radius",
    key: "border_radius",
    type: "number_integer",
    description: "Raggio angoli badge in px.",
  },
  {
    name: "EcoPass Font Size",
    key: "font_size",
    type: "number_integer",
    description: "Dimensione font badge in px.",
  },
  {
    name: "EcoPass Enabled",
    key: "is_enabled",
    type: "boolean",
    description: "Abilitazione globale badge EcoPass.",
  },
] as const;

async function ensureMetafieldDefinitions(session: Session) {
  try {
    const endpoint = `https://${session.shop}/admin/api/${ApiVersion.January25}/graphql.json`;
    const headers = {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken ?? "",
    };

    async function ensureDefinitionSet(
      ownerType: "PRODUCT" | "SHOP",
      namespace: string,
      definitions: ReadonlyArray<{
        name: string;
        key: string;
        type: string;
        description: string;
      }>,
      storefrontReadable: boolean,
    ) {
      const definitionsQuery = `#graphql
        query EcoPassMetafieldDefinitions($ownerType: MetafieldOwnerType!, $namespace: String!) {
          metafieldDefinitions(first: 100, ownerType: $ownerType, namespace: $namespace) {
            nodes {
              key
            }
          } 
        }
      `;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: definitionsQuery,
          variables: { ownerType, namespace },
        }),
      });

      if (!response.ok) {
        console.error("EcoPass: errore nel recupero metafield definitions", {
          ownerType,
          namespace,
          status: response.status,
        });
        return;
      }

      const payload = (await response.json()) as {
        data?: {
          metafieldDefinitions?: {
            nodes?: Array<{ key: string }>;
          };
        };
      };

      const existingKeys = new Set(
        payload.data?.metafieldDefinitions?.nodes?.map((item) => item.key) ?? [],
      );

      for (const definition of definitions) {
        if (existingKeys.has(definition.key)) continue;

        const mutation = `#graphql
          mutation CreateEcoPassDefinition($definition: MetafieldDefinitionInput!) {
            metafieldDefinitionCreate(definition: $definition) {
              createdDefinition {
                id
                key
              }
              userErrors {
                field
                message
              }
            }
          }
        `;

        const createResponse = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            query: mutation,
            variables: {
              definition: {
                name: definition.name,
                namespace,
                key: definition.key,
                ownerType,
                type: definition.type,
                description: definition.description,
                pin: true,
                access: storefrontReadable
                  ? {
                      storefront: "PUBLIC_READ",
                    }
                  : undefined,
              },
            },
          }),
        });

        if (!createResponse.ok) {
          console.error("EcoPass: errore creazione metafield definition", {
            ownerType,
            namespace,
            key: definition.key,
            status: createResponse.status,
          });
          continue;
        }

        const createPayload = (await createResponse.json()) as {
          data?: {
            metafieldDefinitionCreate?: {
              userErrors?: Array<{ message: string }>;
            };
          };
        };

        const userErrors =
          createPayload.data?.metafieldDefinitionCreate?.userErrors ?? [];
        if (userErrors.length > 0) {
          console.error("EcoPass: userErrors metafieldDefinitionCreate", {
            ownerType,
            namespace,
            key: definition.key,
            userErrors,
          });
        }
      }
    }

    await ensureDefinitionSet("PRODUCT", "ecopass", productMetafieldDefinitions, false);
    await ensureDefinitionSet("SHOP", "ecopass_settings", shopSettingsMetafieldDefinitions, true);
  } catch (error) {
    // Non blocchiamo il login dell'app: registriamo solo in log.
    console.error("EcoPass: ensureMetafieldDefinitions failed", error);
  }
}

export const ECOPASS_BILLING_PLAN = "EcoPass Pro";
export const ECOPASS_BILLING_PRICE_EUR = 14.99;
export const ECOPASS_BILLING_TRIAL_DAYS = 7;

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY ?? "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET ?? "",
  appUrl: process.env.SHOPIFY_APP_URL ?? "",
  authPathPrefix: "/auth",
  scopes: (process.env.SCOPES ?? "").split(",").filter(Boolean),
  apiVersion: ApiVersion.January25,
  sessionStorage: new PrismaSessionStorage(prisma),
  billing: {
    [ECOPASS_BILLING_PLAN]: {
      lineItems: [
        {
          amount: ECOPASS_BILLING_PRICE_EUR,
          currencyCode: "EUR",
          interval: BillingInterval.Every30Days,
        },
      ],
      trialDays: ECOPASS_BILLING_TRIAL_DAYS,
    },
  },
  /** Nome corretto della chiave in shopifyApp (non `appDistribution`). */
  distribution: AppDistribution.AppStore,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/app/uninstalled",
    },
    CUSTOMERS_DATA_REQUEST: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers/data_request",
    },
    CUSTOMERS_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/customers/redact",
    },
    SHOP_REDACT: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks/shop/redact",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      await ensureMetafieldDefinitions(session);
    },
  },
  future: {
    unstable_newEmbeddedAuthStrategy: true,
  },
});

export default shopify;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
