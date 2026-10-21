// Guard sau `pnpm build` (docker/Dockerfile): fail nếu placeholder build lọt vào bundle (BL-053). Cấu hình theo môi trường phải
// đọc LÚC CHẠY; một chuỗi placeholder còn trong .next/server|static nghĩa là Next đã gập `process.env.NEXT_PUBLIC_*` lúc build.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const BUILD_PLACEHOLDERS = ["build-placeholder.invalid"];

export function findPlaceholderFiles(dir, placeholders = BUILD_PLACEHOLDERS) {
  const hits = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) hits.push(...findPlaceholderFiles(path, placeholders));
    else if (/\.(js|mjs|cjs|json|html|rsc|txt)$/.test(entry.name)) {
      const text = readFileSync(path, "utf8");
      if (placeholders.some((p) => text.includes(p))) hits.push(path);
    }
  }
  return hits;
}

if (process.argv[1]?.endsWith("check-build-placeholder.mjs")) {
  const hits = ["server", "static"].flatMap((sub) => {
    try {
      return findPlaceholderFiles(join(".next", sub));
    } catch {
      return [];
    }
  });
  if (hits.length > 0) {
    console.error(`Placeholder build bị nhúng vào bundle (cấu hình phải đọc lúc chạy):\n${hits.join("\n")}`);
    process.exit(1);
  }
  console.log("check-build-placeholder: OK");
}
