import { useState } from "react";

/**
 * Shop / Printful API Utilities
 * Centralized configuration and helpers for e-commerce integration.
 */

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

// API Base URL (same as Notion)
const API_BASE = process.env.REACT_APP_API_BASE || "";

/**
 * Fetches data from Printful API via the backend proxy
 * @param endpoint The Printful API endpoint (e.g., 'store/products')
 */
// biome-ignore lint/suspicious/noExplicitAny: Returns raw API response
export const fetchFromPrintful = async (endpoint: string): Promise<any> => {
  try {
    // Construct the URL for the proxy
    const proxyUrl = `${API_BASE}/api/printful?endpoint=${encodeURIComponent(endpoint)}`;

    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Printful API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching from Printful:", error);
    throw error;
  }
};

/**
 * Handles Printful API errors with specific CORS error detection
 */
export const handlePrintfulError = (
  err: unknown,
  context = "API Error",
): string => {
  // biome-ignore lint/suspicious/noExplicitAny: Error handling for unknown external error shapes
  const error = err as any;
  let errorMessage = `${context}: ${error.response?.status || ""} - ${error.response?.statusText || error.message}`;

  // Handle network/CORS errors
  if (error.message === "Network Error" || error.code === "ERR_NETWORK" || error.message?.includes("Failed to fetch")) {
    errorMessage =
      "Network Error: Unable to connect to the backend API. Please check your connection.";
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
// biome-ignore lint/suspicious/noExplicitAny: External API data structure is complex
export const parsePrintfulProduct = (product: any): ParsedProduct => {
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

  const syncProduct = product.sync_product || null;
  const syncVariants = product.sync_variants || [];
  const firstVariant = Array.isArray(syncVariants)
    ? syncVariants[0] || null
    : null;
  const price = Number(firstVariant?.retail_price) || 0;

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
