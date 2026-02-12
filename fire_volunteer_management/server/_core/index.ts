import "dotenv/config";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerGoogleOAuthRoutes } from "./googleOAuth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initializeScheduledTasks } from "../scheduledTasks";
import { handleLineWebhook } from "./lineWebhook";
import { apiLimiter, webhookLimiter } from "./rateLimit";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    // nosec: createServer for port availability check only, not for serving content
    // lgtm[js/insecure-http] - local port check, not serving client content
    const server = net.createServer(); // NOSONAR
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Start the Express server.
 *
 * SECURITY NOTE: This server uses HTTP internally but is designed to run behind
 * a reverse proxy (nginx, load balancer, or cloud provider) that handles HTTPS
 * termination. This is a standard and secure architecture pattern where:
 * - The reverse proxy handles TLS/SSL certificates and HTTPS connections from clients
 * - Internal communication between proxy and application uses HTTP over a private network
 * - The 'trust proxy' setting enables proper handling of X-Forwarded-* headers
 *
 * For production deployment, ensure:
 * 1. The application is behind a reverse proxy with HTTPS enabled
 * 2. The proxy forwards X-Forwarded-Proto and X-Forwarded-For headers
 * 3. Direct access to the application port (3000) is blocked from external networks
 *
 * @see https://expressjs.com/en/guide/behind-proxies.html
 */
async function startServer() {
  const app = express();
  // createServer uses HTTP as TLS termination is handled by reverse proxy
  // nosec: This is intentional - see security note above
  // lgtm[js/insecure-http] - HTTPS handled by reverse proxy, standard architecture
  const server = createServer(app); // NOSONAR - secure deployment behind HTTPS proxy

  // Enable trust proxy for rate limiting to work correctly behind proxies
  // Use 1 to trust only the first proxy (recommended for most deployments)
  app.set("trust proxy", 1);

  // Enable gzip compression for all responses
  app.use(compression());

  // Security: Add HSTS (HTTP Strict Transport Security) header
  // This tells browsers to only access this site via HTTPS for the next year
  // Prevents downgrade attacks and cookie hijacking
  app.use((req, res, next) => {
    // Only set HSTS in production when behind HTTPS proxy
    if (process.env.NODE_ENV === "production") {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload"
      );
    }
    next();
  });

  // Configure cookie parser to read cookies from requests
  app.use(cookieParser());

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Apply rate limiting to all /api routes
  app.use("/api", apiLimiter);

  // 測試登入頁面（獨立 HTML，不經過前端框架）
  // Apply rate limiting to prevent DoS attacks on file system access
  app.get("/test-login", apiLimiter, (req, res) => {
    res.sendFile(path.resolve(import.meta.dirname, "test-login.html"));
  });

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // Google OAuth routes under /api/auth/google
  registerGoogleOAuthRoutes(app);

  // LINE webhook under /api/line/webhook with stricter rate limiting
  app.post("/api/line/webhook", webhookLimiter, handleLineWebhook);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);

    // 初始化排程任務（只在生產環境執行）
    if (process.env.NODE_ENV === "production") {
      initializeScheduledTasks();
      console.log("[Server] 排程任務已啟動");
    } else {
      console.log("[Server] 開發環境，排程任務未啟動（可透過 API 手動觸發）");
    }
  });
}

startServer().catch(console.error);
