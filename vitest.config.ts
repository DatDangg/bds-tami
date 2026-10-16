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
        resolve: { alias },
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
