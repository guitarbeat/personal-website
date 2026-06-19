import { parsePrintfulProduct, handlePrintfulError } from "../shopUtils";

describe("parsePrintfulProduct", () => {
  it("should return default values for null product", () => {
    const result = parsePrintfulProduct(null);
    expect(result).toEqual({
      syncProduct: null,
      syncVariants: [],
      firstVariant: null,
      price: 0,
    });
  });

  it("should return default values for undefined product", () => {
    const result = parsePrintfulProduct(undefined);
    expect(result).toEqual({
      syncProduct: null,
      syncVariants: [],
      firstVariant: null,
      price: 0,
    });
  });

  it("should return default values for non-object product", () => {
    const result = parsePrintfulProduct("invalid");
    expect(result).toEqual({
      syncProduct: null,
      syncVariants: [],
      firstVariant: null,
      price: 0,
    });
  });

  it("should parse a valid product correctly", () => {
    const mockProduct = {
      sync_product: { id: 123, name: "Test Product" },
      sync_variants: [
        { id: 1, retail_price: "29.99" },
        { id: 2, retail_price: "34.99" },
      ],
    };

    const result = parsePrintfulProduct(mockProduct);

    expect(result.syncProduct).toEqual(mockProduct.sync_product);
    expect(result.syncVariants).toEqual(mockProduct.sync_variants);
    expect(result.firstVariant).toEqual(mockProduct.sync_variants[0]);
    expect(result.price).toBe(29.99);
  });

  it("should handle product with empty variants array", () => {
    const mockProduct = {
      sync_product: { id: 123 },
      sync_variants: [],
    };

    const result = parsePrintfulProduct(mockProduct);

    expect(result.syncProduct).toEqual(mockProduct.sync_product);
    expect(result.syncVariants).toEqual([]);
    expect(result.firstVariant).toBeNull();
    expect(result.price).toBe(0);
  });

  it("should handle missing retail_price", () => {
    const mockProduct = {
      sync_product: { id: 123 },
      sync_variants: [{ id: 1 }], // No retail_price
    };

    const result = parsePrintfulProduct(mockProduct);

    expect(result.price).toBe(0);
  });

  it("should handle malformed retail_price", () => {
    const mockProduct = {
      sync_product: { id: 123 },
      sync_variants: [{ id: 1, retail_price: "invalid" }],
    };

    const result = parsePrintfulProduct(mockProduct);

    expect(result.price).toBe(0);
  });
});


describe("handlePrintfulError", () => {
  it("should return default message for null or undefined", () => {
    expect(handlePrintfulError(null)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(undefined)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(123)).toBe("API Error: Unknown Error");
  });

  it("should handle string errors", () => {
    expect(handlePrintfulError("Something went wrong")).toBe("API Error: undefined - Something went wrong");
  });

  it("should handle standard Error instances", () => {
    const err = new Error("Standard error");
    expect(handlePrintfulError(err)).toBe("API Error: undefined - Standard error");
  });

  it("should handle Error instances with a response object", () => {
    const err = new Error("Request failed");
    (err as any).response = { status: 404, statusText: "Not Found" };
    expect(handlePrintfulError(err)).toBe("API Error: 404 - Not Found");
  });

  it("should handle Error instances with response but no statusText", () => {
    const err = new Error("Fallback message");
    (err as any).response = { status: 500 };
    expect(handlePrintfulError(err)).toBe("API Error: 500 - Fallback message");
  });

  it("should identify CORS / Network errors by message", () => {
    const err = new Error("Network Error");
    expect(handlePrintfulError(err)).toContain("CORS Error");
  });

  it("should identify CORS / Network errors by code", () => {
    const err = new Error("Some error");
    (err as any).code = "ERR_NETWORK";
    expect(handlePrintfulError(err)).toContain("CORS Error");
  });

  it("should handle generic objects resembling errors", () => {
    const err = { message: "Object error" };
    expect(handlePrintfulError(err)).toBe("API Error: undefined - Object error");
  });

  it("should handle generic objects with response", () => {
    const err = { response: { status: 403, statusText: "Forbidden" } };
    expect(handlePrintfulError(err)).toBe("API Error: 403 - Forbidden");
  });

  it("should handle generic objects representing CORS errors", () => {
    const err = { code: "ERR_NETWORK" };
    expect(handlePrintfulError(err)).toContain("CORS Error");
  });

  it("should use a custom context", () => {
    const err = new Error("Test error");
    expect(handlePrintfulError(err, "Custom Context")).toBe("Custom Context: undefined - Test error");
  });
});
