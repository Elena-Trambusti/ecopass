export type ProductWithDppFields = {
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

const PRODUCTS_QUERY = `#graphql
  query EcoPassProductsPage($first: Int!, $after: String, $sortKey: ProductSortKeys!) {
    products(first: $first, after: $after, sortKey: $sortKey) {
      pageInfo {
        hasNextPage
        endCursor
      }
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

export async function fetchProductsPage(
  admin: { graphql: (query: string, init?: { variables?: Record<string, unknown> }) => Promise<Response> },
  options: { first: number; after: string | null },
) {
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: {
      first: options.first,
      after: options.after ?? undefined,
      sortKey: "TITLE",
    },
  });

  const payload = (await response.json()) as {
    data?: {
      products?: {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
        nodes?: ProductWithDppFields[];
      };
    };
  };

  const pageInfo = payload.data?.products?.pageInfo ?? {
    hasNextPage: false,
    endCursor: null,
  };

  const nodes =
    payload.data?.products?.nodes?.filter(
      (p): p is ProductWithDppFields => Boolean(p?.id) && Boolean(p?.title),
    ) ?? [];

  return {
    nodes,
    pageInfo: {
      hasNextPage: Boolean(pageInfo.hasNextPage),
      endCursor: pageInfo.endCursor ?? null,
    },
  };
}
