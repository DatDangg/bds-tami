import { parseTags } from "./import-plan";

/** Dữ liệu ghi của dự án/tin (BL-072), tách khỏi `import.ts` cho gọn: hàm thuần, không đụng DB. */
type ProjectData = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
interface DataPass {
  status: "published" | "draft";
  toLexical: (markdown: string) => never;
}
interface DataDeps {
  authorId: string;
  provinceId: string;
  wardId?: string;
  developerIds: Record<string, string>;
}

export function projectData(pass: DataPass, deps: DataDeps, p: ProjectData, media: { categoryId: string; gallery: Array<string | null>; floorPlans: object[]; documents: Array<string | null>; locationImage: string | null; amenitiesImage: string | null }): object {
  return {
    title: p.title,
    slug: p.slug,
    category: media.categoryId,
    summary: p.summary,
    overview: pass.toLexical(p.overview),
    ...(p.legalInfo ? { legalInfo: pass.toLexical(p.legalInfo) } : {}),
    salesPolicy: pass.toLexical(p.salesPolicy),
    developer: deps.developerIds[p.developer],
    salesStatus: p.salesStatus,
    province: deps.provinceId,
    ...(deps.wardId ? { ward: deps.wardId } : {}),
    address: p.address,
    ...(media.locationImage ? { locationMedia: { title: "Kết nối hạ tầng", image: media.locationImage } } : {}),
    ...(p.priceFromVnd ? { priceFromVnd: p.priceFromVnd, priceToVnd: p.priceToVnd } : {}),
    areaFromM2: p.areaFromM2,
    areaToM2: p.areaToM2,
    productTypes: p.productTypes,
    featuredAmenities: p.featuredAmenities,
    scale: p.scale,
    products: p.products,
    amenities: p.amenities.map(([name, description]: [string, string | null]) => ({ name, ...(description ? { description } : {}) })),
    ...(media.amenitiesImage ? { amenitiesImage: media.amenitiesImage } : {}),
    highlights: p.highlights.map(([title, description]: [string, string]) => ({ title, description })),
    nearbyAmenities: p.nearby.map(([category, name, distanceValue, distanceUnit]: [string, string, number?, string?]) => ({ category, name, ...(distanceValue != null ? { distanceValue, distanceUnit } : {}) })),
    priceTable: p.priceTable,
    ...(p.priceUpdatedAt ? { priceUpdatedAt: p.priceUpdatedAt } : {}),
    faqs: p.faqs.map(([question, answer]: [string, string]) => ({ question, answer })),
    gallery: media.gallery,
    floorPlans: media.floorPlans,
    ...(media.documents.length ? { documents: media.documents } : {}),
    author: deps.authorId,
    status: pass.status,
    ...(pass.status === "published" ? { publishedAt: new Date().toISOString() } : {}),
  };
}

export function newsData(pass: DataPass, deps: DataDeps, news: { meta: Record<string, string>; content: never | null; categoryId: string; coverId: string | null }): object {
  const { meta } = news;
  return {
    title: meta.title,
    slug: meta.slug,
    excerpt: meta.excerpt,
    content: news.content,
    tags: parseTags(meta.tags),
    category: news.categoryId,
    author: deps.authorId,
    ...(news.coverId ? { cover: news.coverId } : {}),
    status: pass.status,
    ...(pass.status === "published" ? { publishedAt: new Date().toISOString() } : {}),
  };
}
