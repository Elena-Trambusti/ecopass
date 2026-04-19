import { describe, expect, it } from "vitest";
import { isHexColor } from "../app/utils/validation";

describe("isHexColor", () => {
  it("accepts valid 6-digit hex", () => {
    expect(isHexColor("#1E8E5A")).toBe(true);
    expect(isHexColor("#ffffff")).toBe(true);
  });

  it("rejects invalid hex", () => {
    expect(isHexColor("#fff")).toBe(false);
    expect(isHexColor("red")).toBe(false);
    expect(isHexColor("")).toBe(false);
  });
});
