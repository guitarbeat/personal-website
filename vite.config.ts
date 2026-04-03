import { existsSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import { componentTagger } from "lovable-tagger";
import { defineConfig, loadEnv } from "vite";

/** Vercel CLI writes here (not .env.local) so pulls do not wipe manual secrets. */
function mergeVercelCliEnvFiles() {
  for (const name of [".env.vercel.development", ".env.vercel.production"]) {
    const filePath = path.join(process.cwd(), name);
    if (existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}

type ApiModule = {
  default: (
    req: NodeJS.ReadableStream & {
      headers: Record<string, string | string[] | undefined>;
      method?: string;
      url?: string;
    },
    res: NodeJS.WritableStream & {
      end: (chunk?: string | Uint8Array) => void;
      getHeader: (name: string) => number | string | string[] | undefined;
      setHeader: (
        name: string,
        value: number | string | readonly string[],
      ) => void;
      statusCode: number;
      writableEnded: boolean;
    } & ApiResponseHelpers,
  ) => Promise<void> | void;
};

type ApiResponseHelpers = {
  json: (payload: unknown) => ApiResponse;
  status: (statusCode: number) => ApiResponse;
};

type ApiResponse = NodeJS.WritableStream & {
  end: (chunk?: string | Uint8Array) => void;
  getHeader: (name: string) => number | string | string[] | undefined;
  setHeader: (name: string, value: number | string | readonly string[]) => void;
  statusCode: number;
  writableEnded: boolean;
} & ApiResponseHelpers;

const API_ROUTE_LOADERS: Record<string, () => Promise<ApiModule>> = {
  "/api/content": () => import("./api/content.js"),
  "/api/content-refresh": () => import("./api/content-refresh.js"),
  "/api/health": () => import("./api/health.js"),
};

const decorateApiResponse = (response: ApiResponse) => {
  response.status = (statusCode: number) => {
    response.statusCode = statusCode;
    return response;
  };

  response.json = (payload: unknown) => {
    if (!response.getHeader("Content-Type")) {
      response.setHeader("Content-Type", "application/json; charset=utf-8");
    }

    response.end(JSON.stringify(payload));
    return response;
  };

  return response;
};

const attachLocalApiRoutes = (middlewares: {
  use: (
    handler: (
      req: NodeJS.ReadableStream & {
        headers: Record<string, string | string[] | undefined>;
        method?: string;
        url?: string;
      },
      res: ApiResponse,
      next: (error?: Error) => void,
    ) => void | Promise<void>,
  ) => void;
}) => {
  middlewares.use(async (req, res, next) => {
    const pathname = req.url?.split("?")[0];

    if (!pathname) {
      next();
      return;
    }

    const loadRoute = API_ROUTE_LOADERS[pathname];

    if (!loadRoute) {
      next();
      return;
    }

    try {
      const { default: handler } = await loadRoute();
      const decoratedResponse = decorateApiResponse(res);

      await handler(req, decoratedResponse);

      if (!decoratedResponse.writableEnded) {
        decoratedResponse.end();
      }
    } catch (error) {
      next(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

const localApiRoutesPlugin = () => ({
  name: "local-api-routes",
  configureServer(server: {
    middlewares: {
      use: typeof attachLocalApiRoutes extends (middlewares: infer T) => void
        ? T["use"]
        : never;
    };
  }) {
    attachLocalApiRoutes(server.middlewares);
  },
  configurePreviewServer(server: {
    middlewares: {
      use: typeof attachLocalApiRoutes extends (middlewares: infer T) => void
        ? T["use"]
        : never;
    };
  }) {
    attachLocalApiRoutes(server.middlewares);
  },
});

export default defineConfig(({ mode }) => {
  mergeVercelCliEnvFiles();
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      localApiRoutesPlugin(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      // Map CRA-style process.env to import.meta.env for compatibility
      "process.env.NODE_ENV": JSON.stringify(
        env.NODE_ENV || process.env.NODE_ENV || "development",
      ),
      "process.env.REACT_APP_API_BASE": JSON.stringify(
        env.REACT_APP_API_BASE || process.env.REACT_APP_API_BASE || "",
      ),
      "process.env.REACT_APP_ENABLE_VERCEL_ANALYTICS": JSON.stringify(
        env.REACT_APP_ENABLE_VERCEL_ANALYTICS ||
          process.env.REACT_APP_ENABLE_VERCEL_ANALYTICS ||
          "",
      ),
      // Security Fix: Google Sheets API keys removed to prevent client-side exposure
      "process.env.REACT_APP_PRINTFUL_API_KEY": JSON.stringify(""),
      "process.env.REACT_APP_PRINTFUL_STORE_ID": JSON.stringify(""),
      "process.env.REACT_APP_GIT_COMMIT_HASH": JSON.stringify(""),
      "process.env.REACT_APP_BUILD_DATE": JSON.stringify(
        new Date().toISOString(),
      ),
      "process.env.REACT_APP_VERSION": JSON.stringify("1.0.0"),
    },
    css: {
      preprocessorOptions: {
        scss: {
          loadPaths: [path.resolve(__dirname, "src/sass")],
        },
      },
    },
    server: {
      port: Number(env.PORT || process.env.PORT || 8080),
      host: "::",
    },
    publicDir: "public",
  };
});
