import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapPin } from "@/components/icons";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import { LearnMoreFaq } from "./LearnMoreFaq";
import { ListingCategoryTabs } from "./ListingCategoryTabs";
import { ListingHero } from "./ListingHero";
import { ResultsBar } from "./ResultsBar";

describe("ListingHero", () => {
  const base = { title: "Dự án bất động sản", titleAccent: "đang phân phối", eyebrow: "TAMI HOMES", description: "Mô tả ngắn", image: fakeMedia("hero") };

  it("một h1 hai dòng (dòng 2 màu nhấn), eyebrow, mô tả; chiều cao tối thiểu cố định (hero cỡ list)", () => {
    const { container } = renderWithIntl(<ListingHero {...base} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Dự án bất động sảnđang phân phối");
    expect(within(heading).getByText("đang phân phối")).toHaveClass("text-primary");
    expect(screen.getByText("TAMI HOMES")).toBeInTheDocument();
    expect(container.querySelector("[data-hero-size='list']")).not.toBeNull();
    expect(screen.queryByRole("search")).toBeNull();
  });

  it("form GET `q` (≤ 100 ký tự) tới đúng trang + giữ tham số khác bằng input ẩn (bỏ rỗng và `q`)", () => {
    const { container } = renderWithIntl(
      <ListingHero {...base} search={{ action: "/du-an", value: "vin", placeholder: "Tên dự án…", preservedParams: { category: "can-ho", sort: "", q: "x" } }} />,
    );
    const form = screen.getByRole("search", { name: "Tìm kiếm trong danh sách" });
    expect(form).toHaveAttribute("action", "/du-an");
    const keyword = within(form).getByRole("searchbox", { name: "Từ khoá" });
    expect(keyword).toHaveAttribute("name", "q");
    expect(keyword).toHaveAttribute("maxlength", "100");
    expect(keyword).toHaveValue("vin");
    expect(keyword).toHaveAttribute("placeholder", "Tên dự án…");
    expect(within(form).getByRole("button", { name: "Tìm kiếm" })).toHaveAttribute("type", "submit");
    const hidden = [...container.querySelectorAll<HTMLInputElement>("input[type=hidden]")].map((input) => `${input.name}=${input.value}`);
    expect(hidden).toEqual(["category=can-ho"]);
  });

  it("hàng 'Tìm nhanh': mỗi chip là link `?q=` (mã hoá), bỏ từ khoá rỗng; danh sách rỗng → ẩn cả hàng", () => {
    const { unmount } = renderWithIntl(<ListingHero {...base} search={{ action: "/en/du-an", placeholder: "…" }} quickSearch={["Đông Anh", " ", "Bắc Ninh"]} />);
    const list = screen.getByRole("list", { name: "Tìm nhanh:" });
    const links = within(list).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(["/en/du-an?q=%C4%90%C3%B4ng+Anh", "/en/du-an?q=B%E1%BA%AFc+Ninh"]);
    unmount();
    renderWithIntl(<ListingHero {...base} search={{ action: "/du-an", placeholder: "…" }} quickSearch={[]} />);
    expect(screen.queryByText("Tìm nhanh:")).toBeNull();
  });
});

describe("ListingCategoryTabs", () => {
  const tabs = [
    { key: "all", href: "/du-an", label: "Tất cả", countLabel: "28 dự án", current: true },
    { key: "can-ho", href: "/du-an/danh-muc/can-ho", label: "Căn hộ chung cư", countLabel: "18 dự án", icon: MapPin },
    { key: "nghi-duong", href: "/du-an/danh-muc/nghi-duong", label: "Nghỉ dưỡng" },
  ];

  it("nav có nhãn; tab là link thật; tab hiện tại aria-current=page; dòng số khi có", () => {
    renderWithIntl(<ListingCategoryTabs label="Loại dự án" tabs={tabs} />);
    const nav = screen.getByRole("navigation", { name: "Loại dự án" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute("aria-current", "page");
    expect(links[0]).toHaveTextContent("Tất cả28 dự án");
    expect(links[1]).not.toHaveAttribute("aria-current");
    expect(links[1]).toHaveAttribute("href", "/du-an/danh-muc/can-ho");
    expect(links[2]).toHaveTextContent(/^Nghỉ dưỡng$/);
    // Icon trang trí (fallback khi thiếu) không lọt vào tên link.
    for (const link of links) expect(link.querySelector("svg")).not.toBeNull();
  });

  it("vùng chạm ≥ 44px (min-h-11), cuộn ngang khi tràn", () => {
    renderWithIntl(<ListingCategoryTabs label="Loại dự án" tabs={tabs} />);
    expect(screen.getAllByRole("link")[0]).toHaveClass("min-h-11");
    expect(screen.getByRole("list").parentElement).toHaveClass("overflow-x-auto");
  });

  it("không có tab → không render", () => {
    const { container } = renderWithIntl(<ListingCategoryTabs label="Loại dự án" tabs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ResultsBar", () => {
  it("'N … phù hợp' (số in đậm, aria-live) + slot sắp xếp", () => {
    renderWithIntl(<ResultsBar countLabel="12 dự án" sort={<label>Sắp xếp theo</label>} />);
    const status = screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "12 dự án phù hợp");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(within(status).getByText("12 dự án").tagName).toBe("STRONG");
    expect(screen.getByText("Sắp xếp theo")).toBeInTheDocument();
  });

  it("tiếng Anh", () => {
    renderWithIntl(<ResultsBar countLabel="3 projects" />, "en");
    expect(screen.getByText((_, element) => element?.tagName === "P" && element.textContent === "3 projects found")).toBeInTheDocument();
  });
});

describe("LearnMoreFaq", () => {
  const learnMore = {
    eyebrow: "Tìm hiểu thêm",
    title: "Chọn dự án phù hợp",
    titleAccent: "cùng TAMI HOMES",
    description: "Mô tả",
    image: fakeMedia("learn"),
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    cta: { label: "Khám phá ngay", href: "/gioi-thieu" },
  };
  const faqs = [
    { question: "Câu 1?", answer: "Trả lời 1" },
    { question: "Câu 2?", answer: "Trả lời 2" },
  ];
  const jsonLdScripts = (container: HTMLElement) => container.querySelectorAll('script[type="application/ld+json"]');

  it("đủ hai phần: tiêu đề 2 màu, nút phát video có nhãn, nút CTA; FAQ dạng details/summary", () => {
    const { container } = renderWithIntl(<LearnMoreFaq learnMore={learnMore} faqs={faqs} />);
    expect(screen.getByRole("heading", { level: 2, name: "Chọn dự án phù hợpcùng TAMI HOMES" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Phát video: Chọn dự án phù hợp" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Khám phá ngay" })).toHaveAttribute("href", "/gioi-thieu");
    expect(screen.getByRole("heading", { level: 2, name: "Câu hỏi thường gặp" })).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(screen.getByText("Câu 1?").closest("summary")).not.toBeNull();
    // Không cờ → không JSON-LD.
    expect(jsonLdScripts(container)).toHaveLength(0);
  });

  it("emitJsonLd → một FAQPage đúng ngôn ngữ, cùng tập câu", () => {
    const { container } = renderWithIntl(<LearnMoreFaq faqs={faqs} emitJsonLd />, "en");
    const scripts = jsonLdScripts(container);
    expect(scripts).toHaveLength(1);
    const data = JSON.parse(scripts[0]?.textContent ?? "{}");
    expect(data["@type"]).toBe("FAQPage");
    expect(data.inLanguage).toBe("en");
    expect(data.mainEntity).toHaveLength(2);
  });

  it("video không hợp lệ → không nút phát; CTA https là thẻ a ngoài; thiếu ảnh lẫn video → không cột ảnh", () => {
    renderWithIntl(<LearnMoreFaq learnMore={{ ...learnMore, image: null, videoUrl: "https://evil.example/x", cta: { label: "Xem", href: "https://tami.vn/x" } }} />);
    expect(screen.queryByRole("button", { name: /Phát video/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Xem" })).toHaveAttribute("rel", "noopener");
    expect(screen.queryByRole("heading", { name: "Câu hỏi thường gặp" })).toBeNull();
  });

  it("hai khối trên cùng trang → id tiêu đề không trùng (useId)", () => {
    const { container } = renderWithIntl(
      <>
        <LearnMoreFaq learnMore={learnMore} faqs={faqs} />
        <LearnMoreFaq learnMore={learnMore} faqs={faqs} />
      </>,
    );
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
    expect(screen.getAllByRole("region")).toHaveLength(4);
  });

  it("thiếu tiêu đề + không FAQ → không render; chỉ FAQ → chỉ phần FAQ", () => {
    const empty = renderWithIntl(<LearnMoreFaq learnMore={{ ...learnMore, title: " " }} faqs={[]} emitJsonLd />);
    expect(empty.container).toBeEmptyDOMElement();
    empty.unmount();
    renderWithIntl(<LearnMoreFaq learnMore={null} faqs={faqs} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByRole("heading", { name: "Câu hỏi thường gặp" })).toBeInTheDocument();
  });
});
