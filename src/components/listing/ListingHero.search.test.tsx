import { act, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fakeMedia, renderWithIntl } from "@/components/media/test-utils";
import vi_ from "@/i18n/messages/vi.json";
import { ListingHero } from "./ListingHero";

const formProps = vi.hoisted(() => ({ last: undefined as Record<string, unknown> | undefined }));
vi.mock("next/form", () => ({
  default: (props: Record<string, unknown>) => {
    formProps.last = props;
    const { children, className, action, role, "aria-label": label } = props as { children: ReactNode; className?: string; action: string; role?: string; "aria-label"?: string };
    return (
      <form className={className} action={action} role={role} aria-label={label}>
        {children}
      </form>
    );
  },
}));

const base = { title: "Dự án", image: fakeMedia("hero") };
const searchProps = (value: string) => ({ action: "/du-an", value, placeholder: "Tên dự án…" });

describe("ListingHero ô tìm (BL-092)", () => {
  it("form không cuộn về đầu trang sau khi tìm (scroll=false)", () => {
    renderWithIntl(<ListingHero {...base} search={searchProps("")} />);
    expect(formProps.last?.scroll).toBe(false);
  });

  it("q trên URL đổi → ô nạp lại giá trị mới nhưng KHÔNG remount (focus giữ)", () => {
    const { rerender } = renderWithIntl(<ListingHero {...base} search={searchProps("vin")} />);
    const input = screen.getByRole("searchbox", { name: "Từ khoá" });
    act(() => input.focus());
    expect(input).toHaveValue("vin");
    rerender(
      <NextIntlClientProvider locale="vi" messages={vi_}>
        <ListingHero {...base} search={searchProps("ecopark")} />
      </NextIntlClientProvider>,
    );
    const after = screen.getByRole("searchbox", { name: "Từ khoá" });
    expect(after).toBe(input);
    expect(after).toHaveValue("ecopark");
    expect(after).toHaveFocus();
  });
});
