import { useState } from "react";

/**
 * Shop / Printful API Utilities
 * Centralized configuration and helpers for e-commerce integration.
 */

// ----------------------------------------------------------------------
// Configuration
// ----------------------------------------------------------------------

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

/**
 * Handles Printful API errors with specific CORS error detection
 */
export const handlePrintfulError = (
  err: unknown,
  context = "API Error",
): string => {
  // biome-ignore lint/suspicious/noExplicitAny: Error handling for unknown external error shapes
  const error = err as any;
  let errorMessage = `${context}: ${error.response?.status} - ${error.response?.statusText || error.message}`;

  // Handle CORS errors specifically
  if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
    errorMessage =
      "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.";
  }

  return errorMessage;
};

export interface ParsedProduct {
  // biome-ignore lint/suspicious/noExplicitAny: External API data structure is complex
  syncProduct: any;
  // biome-ignore lint/suspicious/noExplicitAny: External API data structure is complex
  syncVariants: any[];
  // biome-ignore lint/suspicious/noExplicitAny: External API data structure is complex
  firstVariant: any;
  price: number;
}

/**
 * Parses Printful product data to extract key information
 */
export const parsePrintfulProduct = (product: unknown): ParsedProduct => {
  // Input validation
  if (!product || typeof product !== "object") {
    console.warn("parsePrintfulProduct: Invalid product object provided");
    return {
      syncProduct: null,
      syncVariants: [],
      firstVariant: null,
      price: 0,
    };
  }

  const p = product as Record<string, unknown>;
  const syncProduct = p.sync_product || null;
  const syncVariants = Array.isArray(p.sync_variants) ? p.sync_variants : [];
  const firstVariant = syncVariants.length > 0 ? syncVariants[0] : null;
  const price = firstVariant && typeof firstVariant === 'object' && 'retail_price' in firstVariant
    ? Number((firstVariant as Record<string, unknown>).retail_price) || 0
    : 0;

  return {
    syncProduct,
    syncVariants,
    firstVariant,
    price,
  };
};

/**
 * Custom hook for managing loading and error states in Printful components
 */
export const useShopState = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, context: string) => {
    const errorMessage = handlePrintfulError(err, context);
    setError(errorMessage);
    setLoading(false);
  };

  const startLoading = () => {
    setLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setLoading(false);
  };

  return {
    loading,
    error,
    setError,
    handleError,
    startLoading,
    stopLoading,
  };
};
