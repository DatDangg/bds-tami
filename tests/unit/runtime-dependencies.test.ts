import { readdirSync, readFileSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Image production chỉ cài `dependencies` (docker/Dockerfile, stage prod-deps) nhưng chạy `payload migrate`, `pnpm seed`,
// `pnpm jobs`, `next start` từ mã nguồn trong ./src, ./scripts, ./migrations, ./seed. Một package chỉ nằm trong devDependencies
// mà mã đó import sẽ làm container chết với ERR_MODULE_NOT_FOUND (đã xảy ra với @aws-sdk/client-s3).
const repoRoot = process.cwd();
const runtimeRoots = ["src", "scripts", "migrations", "seed"];
// Chỉ chạy ở stage builder (có đủ devDependencies), không có trong runtime của container.
const buildTimeOnlyFiles = new Set(["scripts/upload-sourcemaps.mjs"]);
const sourceFile = /\.(ts|tsx|mjs|js)$/;
const nonRuntimeFile = /\.(test|spec)\.|\.d\.m?ts$|(^|\/)test-utils\.tsx?$/;
// Neo ở đầu dòng để không bắt nhầm chữ "from" trong SQL của migrations.
const importStatement = /^\s*(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']|^\s*import\s*["']([^"']+)["']|\bimport\(\s*["']([^"']+)["']\s*\)/gm;
const builtins = new Set(builtinModules);
const configuredAliases = ["@/", "@payload-config"];

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? listSourceFiles(path) : [path];
  });
}

function packageNameOf(specifier: string): string {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : (parts[0] ?? specifier);
}

describe("import runtime nằm trong dependencies", () => {
  it("không import package chỉ có ở devDependencies hoặc không khai báo", () => {
    const manifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { dependencies: Record<string, string> };
    const missing = new Map<string, string>();
    for (const root of runtimeRoots) {
      for (const file of listSourceFiles(join(repoRoot, root))) {
        const relativePath = relative(repoRoot, file).replaceAll("\\", "/");
        if (!sourceFile.test(file) || nonRuntimeFile.test(relativePath) || buildTimeOnlyFiles.has(relativePath)) continue;
        for (const match of readFileSync(file, "utf8").matchAll(importStatement)) {
          const specifier = match[1] ?? match[2] ?? match[3] ?? "";
          if (specifier === "" || specifier.startsWith(".")) continue;
          if (specifier.startsWith("node:") || builtins.has(specifier) || configuredAliases.some((alias) => specifier.startsWith(alias))) continue;
          const name = packageNameOf(specifier);
          if (!(name in manifest.dependencies)) missing.set(name, relativePath);
        }
      }
    }
    expect([...missing].map(([name, file]) => `${name} (vd ${file})`)).toEqual([]);
  });
});
