import type { Payload } from "payload";

import type { Homepage } from "../../src/payload-types";
import { paragraphsToLexical } from "../lexical";

const options = { overrideAccess: true, depth: 0 } as const;

const SAMPLE_SLIDE_COUNT = 3;
const SAMPLE_PROJECT_COUNT = 6;

interface SlideText {
  title: string;
  subtitle: string;
  ctaLabel: string;
}

const SLIDES: Record<"vi" | "en", readonly SlideText[]> = {
  vi: [
    { title: "Bất động sản chọn lọc", subtitle: "Phân phối, môi giới và khai thác căn hộ dịch vụ.", ctaLabel: "Xem dự án" },
    { title: "Căn hộ cho thuê sẵn sàng vào ở", subtitle: "Tin cho thuê cập nhật mỗi ngày.", ctaLabel: "Tìm căn hộ" },
    { title: "Tư vấn tận tâm", subtitle: "Đội ngũ TAMI HOMES đồng hành cùng bạn.", ctaLabel: "Liên hệ" },
  ],
  en: [
    { title: "Curated real estate", subtitle: "Distribution, brokerage and serviced apartment operation.", ctaLabel: "View projects" },
    { title: "Move-in ready apartments for rent", subtitle: "Rental listings updated daily.", ctaLabel: "Find an apartment" },
    { title: "Dedicated advice", subtitle: "The TAMI HOMES team is with you.", ctaLabel: "Contact us" },
  ],
};
const SLIDE_LINKS = ["projects", "rentals", "contact"] as const;

interface LocaleText {
  aboutTitle: string;
  about: string;
  stats: { value: string; label: string }[];
  projectsTitle: string;
  servicesTitle: string;
  offersTitle: string;
  rentalsTitle: string;
  newsTitle: string;
  newsIntro: string;
  partnersTitle: string;
  ctaTitle: string;
  ctaDescription: string;
  ctaLabel: string;
}

const TEXT: Record<"vi" | "en", LocaleText> = {
  vi: {
    aboutTitle: "Về TAMI HOMES",
    about: "TAMI HOMES là đơn vị phân phối, môi giới và khai thác căn hộ dịch vụ.",
    stats: [
      { value: "10+", label: "năm kinh nghiệm" },
      { value: "500+", label: "khách hàng" },
    ],
    projectsTitle: "Dự án nổi bật",
    servicesTitle: "Dịch vụ",
    offersTitle: "Ưu đãi nổi bật",
    rentalsTitle: "Thuê nhà ở & kinh doanh",
    newsTitle: "Tin tức & kiến thức thị trường",
    newsIntro: "Cập nhật thị trường bất động sản, kinh nghiệm thuê và đầu tư từ đội ngũ TAMI HOMES.",
    partnersTitle: "Đối tác chủ đầu tư",
    ctaTitle: "Cần tư vấn bất động sản?",
    ctaDescription: "Để lại thông tin, chúng tôi liên hệ trong thời gian sớm nhất.",
    ctaLabel: "Nhận tư vấn",
  },
  en: {
    aboutTitle: "About TAMI HOMES",
    about: "TAMI HOMES distributes, brokers and operates serviced apartments.",
    stats: [
      { value: "10+", label: "years of experience" },
      { value: "500+", label: "customers" },
    ],
    projectsTitle: "Featured projects",
    servicesTitle: "Services",
    offersTitle: "Featured offers",
    rentalsTitle: "Homes & commercial space for rent",
    newsTitle: "News & market insights",
    newsIntro: "Real estate market updates, renting and investing tips from the TAMI HOMES team.",
    partnersTitle: "Developer partners",
    ctaTitle: "Need real estate advice?",
    ctaDescription: "Leave your details and we will get back to you shortly.",
    ctaLabel: "Get advice",
  },
};

/** Khối chỉ hiện khi có trong `blockOrder`: mẫu liệt kê đủ 8 khối (gồm Cho thuê, Tin tức) theo thứ tự trang market. */
const SAMPLE_BLOCK_ORDER = ["about", "featuredProjects", "services", "featuredOffers", "rentals", "news", "partners", "ctaBanner"].map((block) => ({ block })) as Homepage["blockOrder"];

type Row = { id?: string | null };
const withIds = <T extends object>(rows: readonly T[], saved: Row[] | null | undefined) =>
  rows.map((row, index) => ({ ...row, id: saved?.[index]?.id }));

async function findIds(payload: Payload, collection: "projects" | "services", limit: number): Promise<string[]> {
  const found = await payload.find({ collection, where: { status: { equals: "published" }, deletedAt: { exists: false } }, limit, pagination: false, ...options });
  return found.docs.map((doc) => doc.id);
}

/**
 * Trang chủ mẫu cho dev/staging (FR-PUB-01): hero lấy ảnh có sẵn trong `media` (do bước dự án mẫu upload), nên phải chạy SAU bước đó.
 * Idempotent: trang chủ đã có slide thì bỏ qua, không ghi đè sửa của admin. Không chạy ở production (runner `--sample`).
 * Chạy bằng Local API nên hook làm mới cache không có tác dụng ở đây (server tự làm mới sau tối đa 60 giây).
 */
export async function seedSampleHomepage(payload: Payload): Promise<{ created: boolean }> {
  const current = await payload.findGlobal({ slug: "homepage", locale: "vi", fallbackLocale: false, ...options });
  if ((current.hero?.slides?.length ?? 0) > 0) return { created: false };

  const images = await payload.find({ collection: "media", where: { mimeType: { contains: "image/" } }, sort: "createdAt", limit: SAMPLE_SLIDE_COUNT, pagination: false, ...options });
  if (images.docs.length === 0) throw new Error("Thiếu ảnh trong media: chạy bước dự án mẫu (upload ảnh) trước khi seed trang chủ.");
  const imageAt = (index: number) => images.docs[index % images.docs.length]!.id;

  const [projects, items] = await Promise.all([findIds(payload, "projects", SAMPLE_PROJECT_COUNT), findIds(payload, "services", 50)]);
  const slidesFor = (locale: "vi" | "en") =>
    SLIDES[locale].map((slide, index) => ({ ...slide, image: imageAt(index), ctaLink: SLIDE_LINKS[index] }));
  const contentFor = (locale: "vi" | "en") => {
    const text = TEXT[locale];
    return {
      about: { enabled: true, title: text.aboutTitle, content: paragraphsToLexical([text.about]) as never, image: imageAt(0), stats: text.stats },
      featuredProjects: { enabled: true, title: text.projectsTitle, projects },
      services: { enabled: true, title: text.servicesTitle, items },
      featuredOffers: { enabled: true, title: text.offersTitle },
      // Không chọn tay: khối tự lấy các danh mục cho thuê đang có tin / 3 bài mới nhất.
      rentals: { enabled: true, title: text.rentalsTitle },
      news: { enabled: true, title: text.newsTitle, intro: text.newsIntro },
      partners: { enabled: true, title: text.partnersTitle },
      ctaBanner: { enabled: true, title: text.ctaTitle, description: text.ctaDescription, ctaLabel: text.ctaLabel, ctaLink: "contact" },
    };
  };

  const vi = contentFor("vi");
  const saved = await payload.updateGlobal({
    slug: "homepage",
    locale: "vi",
    data: { hero: { slides: slidesFor("vi") }, ...vi, blockOrder: SAMPLE_BLOCK_ORDER },
    ...options,
  });
  // Bản en: gắn `id` dòng mảng của bản vi để Payload cập nhật đúng dòng thay vì tạo dòng mới.
  const en = contentFor("en");
  await payload.updateGlobal({
    slug: "homepage",
    locale: "en",
    data: {
      hero: { slides: withIds(slidesFor("en"), saved.hero?.slides) },
      ...en,
      about: { ...en.about, stats: withIds(en.about.stats, saved.about?.stats) },
    },
    ...options,
  });
  return { created: true };
}
