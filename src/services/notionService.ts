import type { ContentResponse } from "../types/content";

const API_BASE = process.env.REACT_APP_API_BASE || "";

const parseApiError = (payload: unknown, fallbackMessage: string) => {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    payload.error &&
    typeof payload.error === "object"
  ) {
    const nestedError = payload.error as {
      message?: string;
      failureType?: string;
      code?: string;
    };

    return nestedError.message || nestedError.failureType || nestedError.code;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallbackMessage;
};

const fetchContent = async (): Promise<ContentResponse> => {
  const response = await fetch(`${API_BASE}/api/content`, {
    method: "GET",
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(parseApiError(payload, response.statusText));
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !("meta" in payload)
  ) {
    throw new Error(
      "Content API returned an invalid response. If you use the CRACO dev server, run `pnpm dev` so Vite serves `/api` on port 8080 (proxy), or run `pnpm dev:api` in another terminal.",
    );
  }

  return payload as ContentResponse;
};

class NotionService {
  async getAllData() {
    return fetchContent();
  }
}

export default NotionService;
