import { parsePrintfulProduct, validatePrintfulConfig } from "../shopUtils";

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

describe("validatePrintfulConfig", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it("should return the config when required environment variable is set", () => {
    process.env.REACT_APP_PRINTFUL_STORE_ID = "test_store_id";

    const config = validatePrintfulConfig();

    expect(config).toEqual({
      storeId: "test_store_id",
    });
  });

  it("should throw an error when REACT_APP_PRINTFUL_STORE_ID is not set", () => {
    delete process.env.REACT_APP_PRINTFUL_STORE_ID;

    expect(() => validatePrintfulConfig()).toThrow(
      "REACT_APP_PRINTFUL_STORE_ID is not set",
    );
  });
});
