// Seed DEV cho BL-045: bổ sung gallery nhiều ảnh để khung chi tiết mới (bộ đếm, dải ảnh nhỏ, mũi tên) hiển thị thật.
//  - Dự án: thêm ảnh tải về ở `seed/scraped-extra/` (xem `scripts/fetch-scraped-extra.mjs`, gitignore) tới tối đa 6 ảnh.
//  - Tin BĐS: mượn lại ảnh nội thất của các tin cho thuê (không tải thêm) cho đủ 6 ảnh; 1 tin được đặt `isFeatured`.
//  - Cho thuê: 3 căn có `videoUrl` YouTube để thử nút video.
// Chạy: `pnpm seed:galleries` (= `payload run scripts/seed-galleries.ts`). Idempotent; từ chối khi NODE_ENV=production hoặc DATABASE_URL trùng staging/prod (`checkSeedEnvironment`).
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";
import { TRANSLATION_JOB_CONTEXT_KEY } from "../src/hooks/translation/translation-targets";

import { checkSeedEnvironment } from "../src/lib/rentals/sample-amenities";

const guard = checkSeedEnvironment(process.env);
if (!guard.allowed) {
  console.error(`seed:galleries từ chối chạy: ${guard.reason}. Script này chỉ dành cho DB dev.`);
  process.exit(1);
}

const TARGET_GALLERY = 6;
const SAMPLE_VIDEO = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
const context = () => ({ [TRANSLATION_JOB_CONTEXT_KEY]: true });
const Q = { depth: 0, limit: 1, pagination: false, overrideAccess: true } as const;
const ALL = { depth: 0, limit: 0, pagination: false, overrideAccess: true } as const;
const EXTRA_DIR = path.resolve(process.cwd(), "seed/scraped-extra");

interface Manifest {
  images: { file: string; project: string }[];
}
type Doc = { id: string; title: string; gallery?: (string | { id: string })[] | null };
const galleryIds = (doc: Doc) => (doc.gallery ?? []).map((g) => (typeof g === "string" ? g : g.id));

async function uploadExtra(payload: Payload, file: string, alt: string): Promise<string> {
  const found = await payload.find({ collection: "media", where: { alt: { equals: alt } }, locale: "vi", fallbackLocale: false, ...Q });
  if (found.docs[0]) return found.docs[0].id as string;
  const data = await readFile(path.join(EXTRA_DIR, "images", file));
  const created = await payload.create({
    collection: "media",
    data: { alt },
    file: { data, mimetype: "image/webp", name: file, size: data.byteLength },
    locale: "vi",
    depth: 0,
    overrideAccess: true,
    context: context(),
  });
  return created.id as string;
}

async function seedProjectGalleries(payload: Payload) {
  const manifest = JSON.parse(await readFile(path.join(EXTRA_DIR, "manifest.json"), "utf8")) as Manifest;
  const byProject = Map.groupBy(manifest.images, (m) => m.project);
  let updated = 0;
  for (const [title, items] of byProject) {
    const found = (await payload.find({ collection: "projects", where: { title: { equals: title } }, locale: "vi", fallbackLocale: false, ...Q })).docs[0] as unknown as Doc | undefined;
    if (!found || galleryIds(found).length >= TARGET_GALLERY) continue;
    const ids = galleryIds(found);
    for (const [i, item] of items.entries()) {
      if (ids.length >= TARGET_GALLERY) break;
      ids.push(await uploadExtra(payload, item.file, `${title} - ảnh bổ sung ${i + 1}`));
    }
    await payload.update({ collection: "projects", id: found.id, data: { gallery: ids } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
    updated += 1;
  }
  return updated;
}

const hashOf = (s: string) => createHash("sha1").update(s).digest().readUInt32BE(0);

async function seedPostGalleries(payload: Payload) {
  const rentals = (await payload.find({ collection: "rentals", ...ALL })).docs as unknown as Doc[];
  const pool = rentals.map(galleryIds).filter((g) => g.length >= TARGET_GALLERY);
  const posts = (await payload.find({ collection: "property-posts", locale: "vi", fallbackLocale: false, ...ALL })).docs as unknown as (Doc & { isFeatured?: boolean; status?: string })[];
  let updated = 0;
  for (const post of posts) {
    const ids = galleryIds(post);
    if (ids.length >= TARGET_GALLERY || pool.length === 0) continue;
    const source = pool[hashOf(post.title) % pool.length];
    for (const id of source) if (ids.length < TARGET_GALLERY && !ids.includes(id)) ids.push(id);
    await payload.update({ collection: "property-posts", id: post.id, data: { gallery: ids } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
    updated += 1;
  }
  const firstPublished = posts.find((p) => p.status === "published");
  if (firstPublished && !posts.some((p) => p.isFeatured && p.status === "published")) {
    await payload.update({ collection: "property-posts", id: firstPublished.id, data: { isFeatured: true } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
  }
  return updated;
}

async function seedRentalVideos(payload: Payload) {
  const rentals = (await payload.find({ collection: "rentals", sort: "createdAt", locale: "vi", fallbackLocale: false, ...ALL })).docs as unknown as (Doc & { videoUrl?: string | null; status?: string })[];
  const published = rentals.filter((r) => r.status === "published");
  const withVideo = published.filter((r) => r.videoUrl).length;
  for (const rental of published.filter((r) => !r.videoUrl).slice(0, Math.max(0, 3 - withVideo))) {
    await payload.update({ collection: "rentals", id: rental.id, data: { videoUrl: SAMPLE_VIDEO } as never, locale: "vi", depth: 0, overrideAccess: true, context: context() });
  }
}

const payload = await getPayload({ config });
try {
  payload.logger.info(`Gallery dự án cập nhật: ${await seedProjectGalleries(payload)}`);
  payload.logger.info(`Gallery tin BĐS cập nhật: ${await seedPostGalleries(payload)}`);
  await seedRentalVideos(payload);
  payload.logger.info("Seed galleries xong.");
} finally {
  await payload.destroy();
}
