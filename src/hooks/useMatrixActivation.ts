import { useCallback, useEffect, useRef, useState } from "react";

const MATRIX_DISABLED_VALUES = new Set(["0", "false", "off", "no"]);
const MATRIX_ENABLED_VALUES = new Set(["1", "true", "on", "yes"]);

export function shouldShowMatrixFromSearch(
  search: string | URLSearchParams,
): boolean {
  const params =
    typeof search === "string" || search instanceof URLSearchParams
      ? new URLSearchParams(search)
      : new URLSearchParams();

  if (!params.has("matrix")) {
    return false;
  }

  const value = params.get("matrix");
  if (!value) {
    return false;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === "") {
    return false;
  }

  if (MATRIX_DISABLED_VALUES.has(normalizedValue)) {
    return false;
  }

  if (MATRIX_ENABLED_VALUES.has(normalizedValue)) {
    return true;
  }

  return false;
}

export function useMatrixActivation() {
  const [showMatrix, setShowMatrix] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return shouldShowMatrixFromSearch(window.location.search);
  });

  const matrixReadyCallbackRef = useRef<(() => void) | null>(null);

  const handleMatrixActivate = useCallback(() => setShowMatrix(true), []);
  const handleMatrixSuccess = useCallback(() => setShowMatrix(false), []);
  const handleRouteMatrixChange = useCallback((shouldShow: boolean) => {
    setShowMatrix((prev) => (prev === shouldShow ? prev : shouldShow));
  }, []);

  const handleMatrixReady = useCallback((callback: (() => void) | null) => {
    matrixReadyCallbackRef.current =
      typeof callback === "function" ? callback : null;
  }, []);

  useEffect(() => {
    if (!showMatrix) {
      return;
    }

    matrixReadyCallbackRef.current?.();
  }, [showMatrix]);

  return {
    showMatrix,
    handleMatrixActivate,
    handleMatrixSuccess,
    handleRouteMatrixChange,
    handleMatrixReady,
  };
}
