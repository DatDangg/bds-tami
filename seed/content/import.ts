import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import type { Payload } from "payload";

import {
  checkNewsEntry,
  CONTENT_DATASET,
  countImportProblems,
  type ImportKind,
  type ImportLine,
  type ImportStatus,
  importConfirmProblem,
  normaliseMarkdown,
  parseFrontmatter,
  resolveImagePath,
} from "./import-plan";
import { newsData, projectData } from "./import-data";

/**
 * Nhập 3 dự án + 8 tin pháp lý (bộ dữ liệu `seed/content/2026-10-23/`, đã duyệt 2026-10-23) — BL-072. Chỉ TẠO MỚI, chỉ locale `vi`,
 * không cập nhật/xoá bản ghi đã có (khớp theo slug / tên / alt). Mặc định dry-run: đọc DB + kiểm đủ ảnh/ảnh bìa, không ghi gì.
 * `apply` = dry-run trước (còn lỗi thì dừng, chưa ghi gì) rồi mới ghi thật. Xem `seed/content/README.md`.
 */
export interface ImportOptions {
  /** Thư mục chứa `projects-data.mjs`. */
  dataDir: string;
  /** Thư mục tin `*.md`; `null` = không nhập tin. */
  newsDir: string | null;
  /** `news-covers.json` (slug tin → ảnh bìa); chỉ đọc khi có tin. */
  coversFile: string;
  /** Thư mục ảnh NGOÀI repo (chứa `manifest.json`; đường dẫn ảnh tính từ đây). */
  imgDir: string;
  apply: boolean;
  status?: "published" | "draft";
  dataset?: string;
  env?: Record<string, string | undefined>;
}

export interface ImportReport {
  lines: ImportLine[];
  problems: number;
  /** Đã ghi thật (apply và dry-run sạch lỗi). */
  applied: boolean;
}

type ImageRef = { file: string; alt?: string; title?: string };
type Manifest = Record<string, { gallery: ImageRef[]; amenitiesImage?: ImageRef; locationImage?: ImageRef; floorPlans?: ImageRef[]; documents?: { file: string; title: string }[] }>;
type Found = { id: string; [key: string]: unknown };
// Dữ liệu dự án là module .mjs tự do; kiểu chặt không có giá trị hơn việc script chạy dry-run.
type ProjectData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const NEWS_CATEGORY = "Pháp lý & Quy hoạch";
const DRY_RUN_ID = "(dry-run)";
const MIME: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".pdf": "application/pdf" };
const FIND = { depth: 0, limit: 1, pagination: false, overrideAccess: true } as const;

interface Pass {
  payload: Payload;
  options: ImportOptions;
  dry: boolean;
  status: "published" | "draft";
  lines: ImportLine[];
  media: { create: number; exists: number };
  toLexical: (markdown: string) => never;
}

const note = (pass: Pass, kind: ImportKind, key: string, status: ImportStatus, detail?: string) => pass.lines.push({ kind, key, status, ...(detail ? { detail } : {}) });
const errorCount = (pass: Pass) => countImportProblems(pass.lines);

async function first(payload: Payload, collection: string, where: object): Promise<Found | undefined> {
  const found = await payload.find({ collection: collection as never, where: where as never, locale: "vi", fallbackLocale: false, trash: true, ...FIND });
  return found.docs[0] as Found | undefined;
}

async function createVi(payload: Payload, collection: string, data: object): Promise<string> {
  return ((await payload.create({ collection: collection as never, data: data as never, locale: "vi", depth: 0, overrideAccess: true })) as unknown as { id: string }).id;
}

/** Id media theo alt (đã có thì dùng lại). Dry-run chỉ kiểm file có trên đĩa; lỗi file ở apply ném ra (dry-run đã chặn trước). */
async function mediaIdFor(pass: Pass, ref: ImageRef): Promise<string | null> {
  const alt = ref.alt ?? ref.title ?? path.basename(ref.file);
  const found = await first(pass.payload, "media", { alt: { equals: alt } });
  if (found) {
    pass.media.exists++;
    return found.id;
  }
  const local = resolveImagePath(pass.options.imgDir, ref.file);
  if (pass.dry) {
    try {
      await access(local);
    } catch {
      note(pass, "media", ref.file, "error", `thiếu file ảnh ${local}`);
      return null;
    }
    pass.media.create++;
    return DRY_RUN_ID;
  }
  const data = await readFile(local);
  const mimetype = MIME[path.extname(local).toLowerCase()] ?? "application/octet-stream";
  const created = await pass.payload.create({ collection: "media", data: { alt } as never, file: { data, mimetype, name: path.basename(local), size: data.byteLength }, locale: "vi", depth: 0, overrideAccess: true });
  pass.media.create++;
  return created.id as string;
}

async function importDevelopers(pass: Pass, developers: Record<string, { name: string; website?: string }>): Promise<Record<string, string>> {
  const ids: Record<string, string> = {};
  for (const [key, developer] of Object.entries(developers)) {
    const found = await first(pass.payload, "developers", { name: { equals: developer.name } });
    if (found) {
      ids[key] = found.id;
      note(pass, "developer", developer.name, "exists");
      continue;
    }
    ids[key] = pass.dry ? DRY_RUN_ID : await createVi(pass.payload, "developers", developer);
    note(pass, "developer", developer.name, "create");
  }
  return ids;
}

interface Dependencies {
  authorId: string;
  provinceId: string;
  wardId?: string;
  developerIds: Record<string, string>;
  manifest: Manifest;
}

async function loadDependencies(pass: Pass, developers: Record<string, { name: string; website?: string }>): Promise<Dependencies | null> {
  const manifestPath = path.join(pass.options.imgDir, "manifest.json");
  let manifest: Manifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  } catch (error) {
    note(pass, "media", manifestPath, "error", `không đọc được manifest.json (${(error as Error).message})`);
    return null;
  }
  const author = await first(pass.payload, "staff", { role: { equals: "admin" } });
  const province = await first(pass.payload, "provinces", { slug: { equals: "ha-noi" } });
  if (!author) note(pass, "project", "(tác giả)", "error", "chưa có tài khoản admin làm tác giả");
  if (!province) note(pass, "project", "(tỉnh)", "error", "thiếu tỉnh ha-noi (nạp địa giới lúc khởi tạo môi trường: docs/runbooks/deploy.md)");
  if (!author || !province) return null;
  const ward = await first(pass.payload, "wards", { and: [{ slug: { equals: "phuong-phu-thuong" } }, { province: { equals: province.id } }] });
  return { authorId: author.id, provinceId: province.id, wardId: ward?.id, developerIds: await importDevelopers(pass, developers), manifest };
}

async function importProject(pass: Pass, deps: Dependencies, p: ProjectData): Promise<void> {
  if (await first(pass.payload, "projects", { slug: { equals: p.slug } })) {
    note(pass, "project", p.slug, "exists");
    return;
  }
  const media = deps.manifest[p.slug];
  if (!media?.gallery?.length) {
    note(pass, "project", p.slug, "error", "thiếu ảnh gallery trong manifest.json");
    return;
  }
  const category = await first(pass.payload, "categories", { and: [{ scope: { equals: "project" } }, { name: { equals: p.category } }] });
  if (!category) {
    note(pass, "project", p.slug, "error", `thiếu danh mục dự án "${p.category}": tạo trong /admin → Danh mục (phạm vi Dự án, đúng tên này), xem docs/runbooks/english-pack.md bước 2`);
    return;
  }
  const errorsBefore = errorCount(pass);
  const gallery = await mediaIdsFor(pass, media.gallery);
  const floorPlans: Array<{ title: string; image: string | null }> = [];
  for (const plan of (media.floorPlans ?? []).filter((item) => /\.(jpe?g|png|webp)$/i.test(item.file))) floorPlans.push({ title: plan.title ?? plan.alt ?? "", image: await mediaIdFor(pass, plan) });
  const documents: Array<string | null> = [];
  // Trường Tài liệu chỉ nhận PDF: tài liệu dạng ảnh (sơ đồ tiện ích, bảng bàn giao) đưa vào Mặt bằng.
  for (const doc of media.documents ?? []) {
    const id = await mediaIdFor(pass, { file: doc.file, alt: doc.title });
    if (/\.pdf$/i.test(doc.file)) documents.push(id);
    else floorPlans.push({ title: doc.title, image: id });
  }
  const locationImage = media.locationImage ? await mediaIdFor(pass, media.locationImage) : null;
  const amenitiesImage = media.amenitiesImage ? await mediaIdFor(pass, media.amenitiesImage) : null;
  if (errorCount(pass) > errorsBefore) return;
  const detail = `${gallery.length} ảnh, ${floorPlans.length} mặt bằng, ${documents.length} tài liệu`;
  if (pass.dry) {
    note(pass, "project", p.slug, "create", detail);
    return;
  }
  await createVi(pass.payload, "projects", projectData(pass, deps, p, { categoryId: category.id, gallery, floorPlans, documents, locationImage, amenitiesImage }));
  note(pass, "project", p.slug, "create", detail);
}

async function mediaIdsFor(pass: Pass, refs: ImageRef[]): Promise<Array<string | null>> {
  const ids: Array<string | null> = [];
  for (const ref of refs) ids.push(await mediaIdFor(pass, ref));
  return ids;
}

async function importNews(pass: Pass, deps: Dependencies, newsDir: string): Promise<void> {
  const categoryFound = await first(pass.payload, "categories", { and: [{ scope: { equals: "news" } }, { name: { equals: NEWS_CATEGORY } }] });
  const categoryId = categoryFound?.id ?? (pass.dry ? DRY_RUN_ID : await createVi(pass.payload, "categories", { name: NEWS_CATEGORY, scope: "news" }));
  note(pass, "news-category", NEWS_CATEGORY, categoryFound ? "exists" : "create");
  const covers = JSON.parse(await readFile(pass.options.coversFile, "utf8")) as Record<string, ImageRef>;
  for (const file of (await readdir(newsDir)).filter((name) => name.endsWith(".md")).sort()) {
    const { meta, body } = parseFrontmatter(await readFile(path.join(newsDir, file), "utf8"));
    const cover = covers[meta.slug ?? ""];
    const alreadyExists = Boolean(meta.slug) && Boolean(await first(pass.payload, "news", { slug: { equals: meta.slug } }));
    const problems = checkNewsEntry({ file, meta, body, hasCover: Boolean(cover), status: pass.status, alreadyExists });
    for (const problem of problems) note(pass, "news", meta.slug ?? file, "error", problem);
    if (problems.length > 0) continue;
    if (alreadyExists) {
      note(pass, "news", meta.slug!, "exists");
      continue;
    }
    const errorsBefore = errorCount(pass);
    const coverId = cover ? await mediaIdFor(pass, cover) : null;
    let content: never | null = null;
    try {
      content = pass.toLexical(body);
    } catch (error) {
      note(pass, "news", meta.slug!, "error", `không chuyển được markdown (${(error as Error).message})`);
    }
    if (errorCount(pass) > errorsBefore) continue;
    if (!pass.dry) await createVi(pass.payload, "news", newsData(pass, deps, { meta, content, categoryId, coverId }));
    note(pass, "news", meta.slug!, "create");
  }
}

async function runPass(payload: Payload, options: ImportOptions, dry: boolean): Promise<ImportReport> {
  const editorConfig = await editorConfigFactory.default({ config: payload.config });
  const pass: Pass = {
    payload,
    options,
    dry,
    status: options.status ?? "published",
    lines: [],
    media: { create: 0, exists: 0 },
    toLexical: (markdown) => convertMarkdownToLexical({ editorConfig, markdown: normaliseMarkdown(markdown) }) as never,
  };
  const { DEVELOPERS, PROJECTS } = (await import(pathToFileURL(path.join(options.dataDir, "projects-data.mjs")).href)) as { DEVELOPERS: Record<string, { name: string; website?: string }>; PROJECTS: ProjectData[] };
  const deps = await loadDependencies(pass, DEVELOPERS);
  if (deps) {
    for (const project of PROJECTS) await importProject(pass, deps, project);
    if (options.newsDir) await importNews(pass, deps, options.newsDir);
  }
  note(pass, "media", "(tổng)", pass.media.create > 0 ? "create" : "exists", `${pass.media.create} ảnh/tệp sẽ tải lên, ${pass.media.exists} đã có theo alt`);
  return { lines: pass.lines, problems: countImportProblems(pass.lines), applied: false };
}

/** Dry-run, hoặc (`apply` + `IMPORT_CONFIRM` khớp) dry-run rồi ghi thật. Ném lỗi khi thiếu confirm — TRƯỚC khi đụng DB. */
export async function runContentImport(payload: Payload, options: ImportOptions): Promise<ImportReport> {
  const refusal = importConfirmProblem(options.dataset ?? CONTENT_DATASET, options.apply, options.env ?? process.env);
  if (refusal) throw new Error(refusal);
  const plan = await runPass(payload, options, true);
  if (!options.apply || plan.problems > 0) return plan;
  return { ...(await runPass(payload, options, false)), applied: true };
}
