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
  let errorMessage = `${context}: Unknown Error`;

  if (err instanceof Error) {
    const errorObj = err as unknown as Record<string, unknown>;
    const response = errorObj.response as Record<string, unknown> | undefined;
    const code = errorObj.code as string | undefined;

    if (response) {
      errorMessage = `${context}: ${response.status} - ${response.statusText || err.message}`;
    } else {
      errorMessage = `${context}: undefined - ${err.message}`;
    }

    // Handle CORS errors specifically
    if (err.message === "Network Error" || code === "ERR_NETWORK") {
      errorMessage =
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.";
    }
  } else if (typeof err === "object" && err !== null) {
    const errObj = err as Record<string, unknown>;
    const response = errObj.response as Record<string, unknown> | undefined;
    const code = errObj.code as string | undefined;
    const message = errObj.message as string | undefined;

    if (response) {
      errorMessage = `${context}: ${response.status} - ${response.statusText || message || "Unknown Error"}`;
    } else if (message) {
      errorMessage = `${context}: undefined - ${message}`;
    }

    if (message === "Network Error" || code === "ERR_NETWORK") {
      errorMessage =
        "CORS Error: Unable to connect to Printful API. Please ensure the development server is running with the correct proxy configuration.";
    }
  } else if (typeof err === "string") {
    errorMessage = `${context}: undefined - ${err}`;
  }

  return errorMessage;
};

export interface PrintfulSyncProduct {
  id: number;
  name?: string;
  [key: string]: unknown;
}

export interface PrintfulSyncVariant {
  id: number;
  retail_price?: string | number;
  [key: string]: unknown;
}

export interface ParsedProduct {
  syncProduct: PrintfulSyncProduct | null;
  syncVariants: PrintfulSyncVariant[];
  firstVariant: PrintfulSyncVariant | null;
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

  const syncProduct = (p.sync_product as PrintfulSyncProduct) || null;
  const syncVariants = (p.sync_variants as PrintfulSyncVariant[]) || [];
  const firstVariant =
    Array.isArray(syncVariants) && syncVariants.length > 0
      ? syncVariants[0] || null
      : null;
  const price =
    firstVariant?.retail_price &&
    !Number.isNaN(Number(firstVariant.retail_price))
      ? Number(firstVariant.retail_price)
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
