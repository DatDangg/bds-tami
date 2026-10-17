// Chép worker của MapLibre vào `public/vendor/maplibre/` (chạy trước `next dev` / `next build`).
// Lý do: MapLibre tự suy ra URL worker từ `import.meta.url` của chính nó, nhưng khi bundler (Turbopack) gộp chunk thì URL đó không
// phải http(s) nên worker không tải được và bản đồ đứng im. `LazyMap` gọi `setWorkerUrl` trỏ vào đúng thư mục này. Cần chép CẢ
// `maplibre-gl-shared.mjs` vì worker import nó theo đường dẫn tương đối. Thư mục sinh ra bị gitignore (luôn khớp phiên bản đã cài).
import { copyFile, mkdir } from "node:fs/promises";

const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];
const source = new URL("../node_modules/maplibre-gl/dist/", import.meta.url);
const target = new URL("../public/vendor/maplibre/", import.meta.url);

await mkdir(target, { recursive: true });
for (const file of FILES) await copyFile(new URL(file, source), new URL(file, target));
