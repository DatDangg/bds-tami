import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NewsArticleSidebar } from "./NewsArticleSidebar";

vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

describe("NewsArticleSidebar (BL-067: mục lục chiếm hết phần cao còn lại của cột dính)", () => {
  it("khối dính là cột flex có max-h theo viewport từ lg; thẻ tư vấn shrink-0", () => {
    const { container } = render(<NewsArticleSidebar headings={[{ id: "mot", text: "Phần một", level: 2 }]} tocLabel="Mục lục" contactHref="/lien-he" />);
    const sticky = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(sticky.className).toContain("flex-col");
    expect(sticky.className).toContain("lg:max-h-[max(26rem,calc(100dvh-var(--detail-aside-top)-1rem))]");
    expect(sticky.className).toContain("lg:sticky");
    expect(container.querySelector("section")?.className).toContain("shrink-0");
  });
});
