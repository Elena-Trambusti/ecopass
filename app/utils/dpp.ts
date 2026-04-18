export type ProductFingerprintInput = {
  title: string;
  productType: string;
  vendor: string;
  tags: string[];
};

export function buildAutoDppFromProduct(product: ProductFingerprintInput) {
  const fingerprint = `${product.title} ${product.productType} ${product.vendor} ${product.tags.join(" ")}`.toLowerCase();

  if (fingerprint.includes("snowboard")) {
    return {
      materiali: "Legno, fibra di vetro, acciaio",
      carbonFootprint: "18.5 kg CO2e",
      riciclabilita: 62,
    };
  }

  if (fingerprint.includes("shirt") || fingerprint.includes("t-shirt") || fingerprint.includes("hoodie")) {
    return {
      materiali: "Cotone, poliestere riciclato",
      carbonFootprint: "6.8 kg CO2e",
      riciclabilita: 81,
    };
  }

  if (fingerprint.includes("shoe") || fingerprint.includes("sneaker")) {
    return {
      materiali: "Gomma, tessuto tecnico, EVA",
      carbonFootprint: "9.7 kg CO2e",
      riciclabilita: 58,
    };
  }

  return {
    materiali: "Composito tecnico certificato",
    carbonFootprint: "8.9 kg CO2e",
    riciclabilita: 70,
  };
}

