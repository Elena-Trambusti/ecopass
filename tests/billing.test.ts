import { BillingError } from "@shopify/shopify-api";
import { describe, expect, it } from "vitest";
import {
  getBillingErrorMessages,
  getMerchantSafeBillingError,
  isBillingApiBlockedForAppDistribution,
} from "../app/utils/billing.server";

function buildBillingError(messages: string[]) {
  const billingError = Object.create(BillingError.prototype) as BillingError & {
    errorData: Array<{ message: string }>;
  };
  billingError.errorData = messages.map((message) => ({ message }));
  return billingError;
}

describe("billing helpers", () => {
  it("detects app distribution billing lock", () => {
    const error = buildBillingError(["Apps without a public distribution cannot use the Billing API"]);
    expect(isBillingApiBlockedForAppDistribution(error)).toBe(true);
  });

  it("maps declined charge to merchant-safe text", () => {
    const error = buildBillingError(["Card was declined"]);
    expect(getMerchantSafeBillingError(error)).toContain("rifiutato");
  });

  it("returns empty messages for non billing errors", () => {
    expect(getBillingErrorMessages(new Error("random"))).toEqual([]);
  });
});

