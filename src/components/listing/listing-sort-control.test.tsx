import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chooseOption, renderWithIntl } from "@/components/media/test-utils";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { PostSortControl } from "@/components/posts/PostSortControl";
import { ProjectSortControl } from "@/components/projects/ProjectSortControl";
import { RentalSortControl } from "@/components/rentals/RentalSortControl";
import type { RawListingParams } from "./listing-params";
import { ListingNavigateContext, useListingFilterNav } from "./use-listing-filter-nav";

afterEach(() => push.mockReset());

/** Như `*ListBody`: một `useListingFilterNav`, ô lọc dùng `navigate`, ô sắp xếp (truyền từ ngoài) đọc `navigate` qua context. */
function Body({ path, current, sort }: { path: string; current: RawListingParams; sort: ReactNode }) {
  const { navigate } = useListingFilterNav(path, current);
  return (
    <ListingNavigateContext value={navigate}>
      <button type="button" onClick={() => navigate({ province: ["ha-noi"] })}>
        province
      </button>
      {sort}
    </ListingNavigateContext>
  );
}

const CASES: { name: string; path: string; sort: (value?: string) => ReactElement }[] = [
  { name: "ProjectSortControl", path: "/du-an", sort: (value) => <ProjectSortControl {...(value ? { value } : {})} /> },
  { name: "RentalSortControl", path: "/cho-thue", sort: (value) => <RentalSortControl value={(value ?? "newest") as "newest"} /> },
  { name: "PostSortControl", path: "/tin-bds", sort: (value) => <PostSortControl {...(value ? { value } : {})} /> },
];

describe.each(CASES)("$name", ({ path, sort }) => {
  it("đổi sắp xếp: giữ mọi tham số trên URL, bỏ page, không cuộn; 'Mới nhất' không lên URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Body path={path} current={{ category: "can-ho", q: "sông", page: "2" }} sort={sort()} />);
    const select = screen.getByLabelText("Sắp xếp theo");
    expect(select).toHaveTextContent("Mới nhất");
    await chooseOption(user, select, "Giá tăng dần");
    expect(push).toHaveBeenLastCalledWith(`${path}?category=can-ho&q=s%C3%B4ng&sort=price_asc`, { scroll: false });
  });

  it("đang giá giảm → chọn 'Mới nhất' bỏ sort khỏi URL", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Body path={path} current={{ sort: "price_desc" }} sort={sort("price_desc")} />);
    const select = screen.getByLabelText("Sắp xếp theo");
    expect(select).toHaveTextContent("Giá giảm dần");
    await chooseOption(user, select, "Mới nhất");
    expect(push).toHaveBeenLastCalledWith(path, { scroll: false });
  });

  it("đổi lọc rồi đổi sắp xếp ngay (URL chưa về) → sắp xếp giữ cả lọc đang chờ (P3-T03 review r1)", async () => {
    const user = userEvent.setup();
    renderWithIntl(<Body path={path} current={{ q: "vin" }} sort={sort()} />);
    await user.click(screen.getByRole("button", { name: "province" }));
    await chooseOption(user, screen.getByLabelText("Sắp xếp theo"), "Giá giảm dần");
    expect(push).toHaveBeenNthCalledWith(1, `${path}?q=vin&province=ha-noi`, { scroll: false });
    expect(push).toHaveBeenNthCalledWith(2, `${path}?q=vin&province=ha-noi&sort=price_desc`, { scroll: false });
  });
});

describe("useListingNavigate", () => {
  it("ô sắp xếp nằm ngoài thân trang danh sách → báo lỗi rõ thay vì điều hướng mất lọc", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderWithIntl(<ProjectSortControl />)).toThrow(/ListingNavigateContext/);
    silence.mockRestore();
  });
});
