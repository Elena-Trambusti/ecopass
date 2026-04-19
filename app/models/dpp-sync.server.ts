import { buildAutoDppFromProduct } from "../utils/dpp";
import type { ProductWithDppFields } from "./products-page.server";

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

export async function ensureAutoMetafieldsForProducts(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  products: ProductWithDppFields[],
) {
  for (const product of products) {
    const hasMaterials =
      Boolean(product.customMateriali?.value) || Boolean(product.legacyMaterials?.value);
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
