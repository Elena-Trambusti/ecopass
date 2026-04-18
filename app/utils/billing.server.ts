import { BillingError } from "@shopify/shopify-api";

export function getBillingErrorMessages(error: unknown): string[] {
  if (!(error instanceof BillingError)) return [];
  const data = error.errorData;
  if (!Array.isArray(data)) return [];
  return data
    .map((entry: { message?: string }) => entry?.message)
    .filter((message): message is string => typeof message === "string");
}

export function isBillingApiBlockedForAppDistribution(error: unknown): boolean {
  return getBillingErrorMessages(error).some((message) =>
    message.toLowerCase().includes("cannot use the billing api"),
  );
}

export function getMerchantSafeBillingError(error: unknown): string | null {
  const messages = getBillingErrorMessages(error);
  if (messages.length === 0) return null;
  const joined = messages.join(" ");
  if (joined.toLowerCase().includes("declined")) {
    return "Il pagamento e' stato rifiutato. Aggiorna il metodo di pagamento su Shopify e riprova.";
  }
  return "Non siamo riusciti a verificare il tuo abbonamento EcoPass Pro. Riprova tra pochi minuti.";
}

