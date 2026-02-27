import { handlePrintfulError, parsePrintfulProduct } from "../shopUtils";

describe("handlePrintfulError", () => {
  it("should format standard API error with status and statusText", () => {
    const error = {
      response: {
        status: 404,
        statusText: "Not Found",
      },
    };
    const result = handlePrintfulError(error);
    expect(result).toBe("API Error: 404 - Not Found");
  });

  it("should fallback to error message if statusText is missing", () => {
    const error = {
      response: {
        status: 500,
      },
      message: "Internal Server Error",
    };
    const result = handlePrintfulError(error);
    expect(result).toBe("API Error: 500 - Internal Server Error");
  });

  it("should handle error without response property", () => {
    const error = {
      message: "Network request failed",
    };
    const result = handlePrintfulError(error);
    expect(result).toBe("API Error: undefined - Network request failed");
  });

  it("should return specific message for CORS Network Error", () => {
    const error = {
      message: "Network Error",
    };
    const result = handlePrintfulError(error);
    expect(result).toContain("CORS Error: Unable to connect to Printful API");
  });

  it("should return specific message for CORS ERR_NETWORK code", () => {
    const error = {
      code: "ERR_NETWORK",
      message: "Some other message",
    };
    const result = handlePrintfulError(error);
    expect(result).toContain("CORS Error: Unable to connect to Printful API");
  });

  it("should use custom context if provided", () => {
    const error = {
      response: {
        status: 400,
        statusText: "Bad Request",
      },
    };
    const result = handlePrintfulError(error, "Custom Context");
    expect(result).toBe("Custom Context: 400 - Bad Request");
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
