import type { CollectionSlug, Payload } from "payload";

import { TRANSLATION_JOB_CONTEXT_KEY } from "../../hooks/translation/translation-targets";
import { projectsBackfill } from "./projects";
import { propertyPostsBackfill } from "./property-posts";
import type { BackfillAdapter, DocPlan } from "./types";

/** Collection hỗ trợ của `pnpm backfill:listing-fields` (thứ tự chạy + báo cáo; không truyền `--collection` → chạy tất cả). */
export const BACKFILL_ADAPTERS: readonly BackfillAdapter[] = [projectsBackfill, propertyPostsBackfill];

export interface BackfillOptions {
  apply: boolean;
  collections: string[];
}

/** `[--apply] [--collection <slug>[,<slug>]]` (lặp `--collection` được). Tham số lạ → ném lỗi để không chạy nhầm ý. */
export function parseBackfillArgs(argv: readonly string[], adapters: readonly BackfillAdapter[] = BACKFILL_ADAPTERS): BackfillOptions {
  const known = adapters.map((a) => a.collection);
  let apply = false;
  const collections: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] ?? "";
    if (arg === "--apply") apply = true;
    else if (arg === "--collection" || arg.startsWith("--collection=")) {
      const value = arg === "--collection" ? argv[++i] : arg.slice("--collection=".length);
      if (!value) throw new Error("--collection cần tên collection");
      collections.push(...value.split(",").map((v) => v.trim()).filter(Boolean));
    } else throw new Error(`Tham số không hỗ trợ: ${arg}. Dùng: [--apply] [--collection ${known.join("|")}]`);
  }
  for (const slug of collections) if (!known.includes(slug)) throw new Error(`Collection chưa hỗ trợ: ${slug} (có: ${known.join(", ")})`);
  return { apply, collections: collections.length > 0 ? [...new Set(collections)] : known };
}

export interface CollectionResult {
  adapter: BackfillAdapter;
  plans: DocPlan[];
}

const shortError = (error: unknown) => ((error instanceof Error ? error.message : String(error)).split("\n")[0] ?? "").slice(0, 300);

/**
 * Lập kế hoạch rồi (chỉ khi `apply`) ghi các ô trống qua Payload Local API: locale `vi`, `overrideAccess`, context của job dịch để
 * KHÔNG xếp job dịch tự động (bản EN để admin soát). Không gửi `status` → không xuất bản / đổi trạng thái tin. Lỗi một tin không dừng cả lượt.
 */
export async function runBackfill(payload: Payload, options: BackfillOptions, adapters: readonly BackfillAdapter[] = BACKFILL_ADAPTERS): Promise<CollectionResult[]> {
  const results: CollectionResult[] = [];
  for (const adapter of adapters.filter((a) => options.collections.includes(a.collection))) {
    const plans = await adapter.plan(payload);
    if (options.apply) {
      for (const plan of plans) {
        if (Object.keys(plan.patch).length === 0) continue;
        try {
          await payload.update({
            collection: adapter.collection as CollectionSlug,
            id: plan.id,
            data: plan.patch,
            locale: "vi",
            depth: 0,
            overrideAccess: true,
            context: { [TRANSLATION_JOB_CONTEXT_KEY]: true },
          });
        } catch (error) {
          plan.error = shortError(error);
        }
      }
    }
    results.push({ adapter, plans });
  }
  return results;
}
