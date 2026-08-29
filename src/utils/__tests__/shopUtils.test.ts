import { parsePrintfulProduct, handlePrintfulError } from "../shopUtils";

describe("handlePrintfulError", () => {
  it("should return default error message for null/undefined", () => {
    expect(handlePrintfulError(null)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(undefined)).toBe("API Error: Unknown Error");
  });

  it("should handle string errors", () => {
    expect(handlePrintfulError("Something went wrong")).toBe(
      "API Error: undefined - Something went wrong",
    );
  });

  it("should handle Error instances without response", () => {
    const err = new Error("Standard error");
    expect(handlePrintfulError(err)).toBe(
      "API Error: undefined - Standard error",
    );
  });

  it("should handle Error instances with response and statusText", () => {
    const err = new Error("Standard error") as any;
    err.response = { status: 404, statusText: "Not Found" };
    expect(handlePrintfulError(err)).toBe("API Error: 404 - Not Found");
  });

  it("should handle Error instances with response but no statusText", () => {
    const err = new Error("Standard error") as any;
    err.response = { status: 500 };
    expect(handlePrintfulError(err)).toBe("API Error: 500 - Standard error");
  });

  it("should handle Network Error messages (CORS) from Error instances", () => {
    const err = new Error("Network Error");
    expect(handlePrintfulError(err)).toBe(
      "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.",
    );
  });

  it("should handle ERR_NETWORK codes (CORS) from Error instances", () => {
    const err = new Error("Some error") as any;
    err.code = "ERR_NETWORK";
    expect(handlePrintfulError(err)).toBe(
      "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.",
    );
  });

  it("should handle plain objects with message", () => {
    expect(handlePrintfulError({ message: "Object error" })).toBe(
      "API Error: undefined - Object error",
    );
  });

  it("should handle plain objects with response and statusText", () => {
    expect(
      handlePrintfulError({
        response: { status: 500, statusText: "Internal Error" },
      }),
    ).toBe("API Error: 500 - Internal Error");
  });

  it("should handle plain objects with response, no statusText, but message", () => {
    expect(
      handlePrintfulError({ response: { status: 500 }, message: "Fallback" }),
    ).toBe("API Error: 500 - Fallback");
  });

  it("should handle plain objects with response, no statusText, and no message", () => {
    expect(handlePrintfulError({ response: { status: 500 } })).toBe(
      "API Error: 500 - Unknown Error",
    );
  });

  it("should handle plain objects with Network Error message", () => {
    expect(handlePrintfulError({ message: "Network Error" })).toBe(
      "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.",
    );
  });

  it("should handle plain objects with ERR_NETWORK code", () => {
    expect(handlePrintfulError({ code: "ERR_NETWORK" })).toBe(
      "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.",
    );
  });

  it("should respect custom context", () => {
    expect(handlePrintfulError("Bad data", "Custom Context")).toBe(
      "Custom Context: undefined - Bad data",
    );
  });
});

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
