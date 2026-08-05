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
  it("should return default message for unknown error types with default context", () => {
    expect(handlePrintfulError(123)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(null)).toBe("API Error: Unknown Error");
    expect(handlePrintfulError(undefined)).toBe("API Error: Unknown Error");
  });

  it("should return default message for unknown error types with custom context", () => {
    expect(handlePrintfulError(123, "Custom Context")).toBe("Custom Context: Unknown Error");
  });

  describe("Error instances", () => {
    it("should handle Error instance without response", () => {
      const err = new Error("Standard error message");
      expect(handlePrintfulError(err)).toBe("API Error: undefined - Standard error message");
    });

    it("should handle Error instance with response containing status and statusText", () => {
      const err: any = new Error("Standard error message");
      err.response = { status: 404, statusText: "Not Found" };
      expect(handlePrintfulError(err)).toBe("API Error: 404 - Not Found");
    });

    it("should handle Error instance with response falling back to error message", () => {
      const err: any = new Error("Standard error message");
      err.response = { status: 500 };
      expect(handlePrintfulError(err)).toBe("API Error: 500 - Standard error message");
    });

    it("should handle Error instance triggering CORS/Network error via message", () => {
      const err = new Error("Network Error");
      expect(handlePrintfulError(err)).toBe(
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration."
      );
    });

    it("should handle Error instance triggering CORS/Network error via code", () => {
      const err: any = new Error("Some other message");
      err.code = "ERR_NETWORK";
      expect(handlePrintfulError(err)).toBe(
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration."
      );
    });
  });

  describe("Plain object errors", () => {
    it("should handle object error with response containing status and statusText", () => {
      const err = { response: { status: 403, statusText: "Forbidden" } };
      expect(handlePrintfulError(err)).toBe("API Error: 403 - Forbidden");
    });

    it("should handle object error with response falling back to message", () => {
      const err = { response: { status: 401 }, message: "Unauthorized access" };
      expect(handlePrintfulError(err)).toBe("API Error: 401 - Unauthorized access");
    });

    it("should handle object error with response falling back to Unknown Error", () => {
      const err = { response: { status: 400 } };
      expect(handlePrintfulError(err)).toBe("API Error: 400 - Unknown Error");
    });

    it("should handle object error without response but with message", () => {
      const err = { message: "Some internal error" };
      expect(handlePrintfulError(err)).toBe("API Error: undefined - Some internal error");
    });

    it("should handle object error triggering CORS/Network error via message", () => {
      const err = { message: "Network Error" };
      expect(handlePrintfulError(err)).toBe(
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration."
      );
    });

    it("should handle object error triggering CORS/Network error via code", () => {
      const err = { code: "ERR_NETWORK" };
      expect(handlePrintfulError(err)).toBe(
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration."
      );
    });
  });

  describe("String errors", () => {
    it("should handle simple string error", () => {
      const err = "A terrible thing happened";
      expect(handlePrintfulError(err)).toBe("API Error: undefined - A terrible thing happened");
    });
  });
});
