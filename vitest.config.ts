import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias },
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/setup.ts"],
        },
      },
      {
        // Component React (RTL) cần DOM.
        // Test page (Server Component đọc Payload) dùng vi.mock("@payload-config"): alias để Vite phân giải được import; file thật không được nạp vì đã bị mock.
        resolve: { alias: { ...alias, "@payload-config": fileURLToPath(new URL("./src/payload.config.ts", import.meta.url)) } },
        test: {
          name: "ui",
          include: ["src/**/*.test.tsx"],
          environment: "jsdom",
          setupFiles: ["tests/setup.ts", "tests/setup-dom.ts"],
          // next-intl/navigation import `next/navigation` không đuôi .js: để Vite resolve (như project integration).
          server: { deps: { inline: ["next-intl"] } },
        },
      },
      {
        resolve: { alias },
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          setupFiles: ["tests/setup.ts"],
          testTimeout: 30_000,
          // next-intl import `next/server` không đuôi .js: để Vite resolve thay vì Node ESM thuần.
          server: { deps: { inline: ["next-intl"] } },
        },
      },
    ],
  },
});
