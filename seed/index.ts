import type { Payload } from "payload";

import { seedDefaultCategories } from "./categories";
import { englishSeedBlockReason, runSeedEnglish } from "./english";
import { seedGeo } from "./geo";
import { seedLegalPages } from "./pages";
import { seedSampleHomepage } from "./sample/homepage";
import { seedSampleJobPostings } from "./sample/job-postings";
import { seedSampleNews } from "./sample/news";
import { seedSampleProjects } from "./sample/projects";
import { seedSamplePropertyPosts } from "./sample/property-posts";
import { seedSampleRentals } from "./sample/rentals";
import { seedSampleServices } from "./sample/services";
import { seedShellGlobals } from "./shell-globals";

/**
 * Runner `pnpm seed` (dữ liệu nền, idempotent, chạy được ở mọi môi trường) và `pnpm seed --sample` (thêm dữ liệu mẫu
 * cho dev/staging, bị chặn khi `APP_ENV=production`). Thêm dữ liệu mới = thêm một bước vào `BASE_STEPS`/`SAMPLE_STEPS`;
 * bước sau có thể dựa vào bước trước (mẫu tin tức cần danh mục nền).
 */
export interface SeedStep {
  name: string;
  run: (payload: Payload) => Promise<string>;
}

const BASE_STEPS: readonly SeedStep[] = [
  {
    name: "địa giới",
    async run(payload) {
      const { provinces, wards } = await seedGeo(payload);
      return `tỉnh ${JSON.stringify(provinces)}, phường/xã ${JSON.stringify(wards)}`;
    },
  },
  {
    name: "danh mục mặc định",
    async run(payload) {
      const { created, skipped } = await seedDefaultCategories(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "trang pháp lý",
    async run(payload) {
      const { created, skipped } = await seedLegalPages(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
];

const SAMPLE_STEPS: readonly SeedStep[] = [
  {
    name: "menu + chân trang mẫu",
    async run(payload) {
      const { header, footer } = await seedShellGlobals(payload);
      return `header ${header ? "tạo" : "đã có"}, footer ${footer ? "tạo" : "đã có"}`;
    },
  },
  {
    name: "dịch vụ mẫu",
    async run(payload) {
      const { created, skipped } = await seedSampleServices(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "tin tức mẫu",
    async run(payload) {
      const { created, skipped } = await seedSampleNews(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "dự án mẫu",
    async run(payload) {
      const { created, skipped } = await seedSampleProjects(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "tin cho thuê mẫu",
    async run(payload) {
      const { created, skipped } = await seedSampleRentals(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "bài đăng tin BĐS mẫu",
    async run(payload) {
      const { created, skipped } = await seedSamplePropertyPosts(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    name: "tin tuyển dụng mẫu",
    async run(payload) {
      const { created, skipped } = await seedSampleJobPostings(payload);
      return `tạo ${created}, bỏ qua ${skipped}`;
    },
  },
  {
    // Sau bước dự án mẫu: hero dùng ảnh do bước đó upload.
    name: "trang chủ mẫu",
    async run(payload) {
      const { created } = await seedSampleHomepage(payload);
      return created ? "tạo" : "đã có";
    },
  },
  {
    // Cuối cùng: ghi bản EN viết sẵn lên mọi bản ghi/global/ảnh vừa được các bước trên tạo (BL-064). Bản vi không bị đụng.
    name: "dữ liệu tiếng Anh viết sẵn",
    async run(payload) {
      // Staging/prod: bỏ qua (không ném) để phần còn lại của seed --sample vẫn hoàn tất; spec BL-064 chỉ cho DB dev.
      const blocked = englishSeedBlockReason(process.env);
      if (blocked) return `bỏ qua: không phải DB dev (${blocked})`;
      const { problems } = await runSeedEnglish(payload);
      return problems > 0 ? `${problems} bản ghi lệch/lỗi (xem log cảnh báo)` : "xong";
    },
  },
];

/** `--sample` ở production là lỗi: dữ liệu mẫu không bao giờ được vào DB production. */
export function assertSampleAllowed(includeSample: boolean, appEnv: string | undefined): void {
  if (includeSample && appEnv === "production") {
    throw new Error("Không seed dữ liệu mẫu (--sample) ở production (APP_ENV=production).");
  }
}

export async function runSeed(payload: Payload, includeSample: boolean): Promise<void> {
  const steps = includeSample ? [...BASE_STEPS, ...SAMPLE_STEPS] : BASE_STEPS;
  for (const step of steps) {
    payload.logger.info(`Seed ${step.name}: ${await step.run(payload)}`);
  }
}
