import { handlePrintfulError, parsePrintfulProduct } from "../shopUtils";

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
  const CORS_ERROR_MSG =
    "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.";

  it("should return default error for unknown/unhandled error types (like null or undefined)", () => {
    expect(handlePrintfulError(null)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(undefined)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(123)).toBe("API Error: Unknown Error");
  });

  it("should use custom context prefix", () => {
    expect(handlePrintfulError(null, "Custom Context")).toBe(
      "Custom Context: Unknown Error",
    );
  });

  describe("Error objects", () => {
    it("should handle Error object without response (falls back to message)", () => {
      const err = new Error("Something went wrong");
      expect(handlePrintfulError(err)).toBe(
        "API Error: undefined - Something went wrong",
      );
    });

    it("should handle Error object with response status and statusText", () => {
      const err = new Error("Request failed") as unknown as Record<
        string,
        unknown
      >;
      err.response = { status: 404, statusText: "Not Found" };
      expect(handlePrintfulError(err)).toBe("API Error: 404 - Not Found");
    });

    it("should handle Error object with response status but no statusText (falls back to err.message)", () => {
      const err = new Error("Request failed") as unknown as Record<
        string,
        unknown
      >;
      err.response = { status: 500 };
      expect(handlePrintfulError(err)).toBe("API Error: 500 - Request failed");
    });

    it("should handle Error object that triggers CORS error condition by message", () => {
      const err = new Error("Network Error");
      expect(handlePrintfulError(err)).toBe(CORS_ERROR_MSG);
    });

    it("should handle Error object that triggers CORS error condition by code", () => {
      const err = new Error("Some error") as unknown as Record<string, unknown>;
      err.code = "ERR_NETWORK";
      expect(handlePrintfulError(err)).toBe(CORS_ERROR_MSG);
    });
  });

  describe("Plain objects", () => {
    it("should handle plain object with response status and statusText", () => {
      const err = { response: { status: 401, statusText: "Unauthorized" } };
      expect(handlePrintfulError(err)).toBe("API Error: 401 - Unauthorized");
    });

    it("should handle plain object with response status and message", () => {
      const err = { response: { status: 400 }, message: "Bad Request" };
      expect(handlePrintfulError(err)).toBe("API Error: 400 - Bad Request");
    });

    it("should handle plain object with response status but no statusText or message (falls back to Unknown Error)", () => {
      const err = { response: { status: 403 } };
      expect(handlePrintfulError(err)).toBe("API Error: 403 - Unknown Error");
    });

    it("should handle plain object without response but with message", () => {
      const err = { message: "Some specific error message" };
      expect(handlePrintfulError(err)).toBe(
        "API Error: undefined - Some specific error message",
      );
    });

    it("should handle plain object that triggers CORS error condition by message", () => {
      const err = { message: "Network Error" };
      expect(handlePrintfulError(err)).toBe(CORS_ERROR_MSG);
    });

    it("should handle plain object that triggers CORS error condition by code", () => {
      const err = { code: "ERR_NETWORK" };
      expect(handlePrintfulError(err)).toBe(CORS_ERROR_MSG);
    });
  });

  describe("String errors", () => {
    it("should handle string error", () => {
      expect(handlePrintfulError("String error message")).toBe(
        "API Error: undefined - String error message",
      );
    });
  });
});
