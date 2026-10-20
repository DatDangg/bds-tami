import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const field = vi.hoisted(() => ({ value: undefined as unknown }));

vi.mock("@payloadcms/ui", () => ({ useField: () => ({ value: field.value }) }));

import { SearchReindexPendingWarning } from "./SearchReindexPendingWarning";

describe("SearchReindexPendingWarning", () => {
  it("đang có job reindex chờ/chạy -> thông báo tìm kiếm theo tên mới sẽ đầy đủ sau ít phút", () => {
    field.value = true;
    render(<SearchReindexPendingWarning path="searchReindexPending" />);
    expect(screen.getByRole("status").textContent).toContain("dữ liệu tìm kiếm");
    expect(screen.getByRole("status").textContent).toContain("sau ít phút");
  });

  it.each([false, null, undefined])("giá trị %s -> không hiện gì", (value) => {
    field.value = value;
    const { container } = render(<SearchReindexPendingWarning path="searchReindexPending" />);
    expect(container.textContent).toBe("");
  });
});
