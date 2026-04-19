import { describe, expect, it } from "vitest";
import { buildAutoDppFromProduct } from "../app/utils/dpp";

describe("buildAutoDppFromProduct", () => {
  it("returns snowboard defaults for snowboard-like products", () => {
    const payload = buildAutoDppFromProduct({
      title: "Super Snowboard",
      productType: "",
      vendor: "",
      tags: [],
    });

    expect(payload.materiali).toContain("Legno");
    expect(payload.carbonFootprint).toBe("18.5 kg CO2e");
    expect(payload.riciclabilita).toBe(62);
  });

  it("returns fallback values for generic products", () => {
    const payload = buildAutoDppFromProduct({
      title: "Generic Product",
      productType: "",
      vendor: "",
      tags: [],
    });

    expect(payload.materiali).toBe("Composito tecnico certificato");
    expect(payload.riciclabilita).toBe(70);
  });

  it("returns shirt-like defaults", () => {
    const payload = buildAutoDppFromProduct({
      title: "Hoodie",
      productType: "T-shirt",
      vendor: "",
      tags: [],
    });
    expect(payload.riciclabilita).toBe(81);
  });

  it("returns shoe-like defaults", () => {
    const payload = buildAutoDppFromProduct({
      title: "Sneaker",
      productType: "shoe",
      vendor: "",
      tags: [],
    });
    expect(payload.riciclabilita).toBe(58);
  });
});


