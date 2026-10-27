import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ value: "s2" as string | null, authorName: "Sale Hai" as string | null | undefined, user: { id: "s1", fullName: "Sale Một", email: "a@x.test" } }));

vi.mock("@payloadcms/ui", () => ({
  RelationshipField: () => <div>ô-chọn-mặc-định</div>,
  useField: () => ({ value: state.value }),
  useFormFields: (select: (entry: [Record<string, { value: unknown }>]) => unknown) => select([{ authorName: { value: state.authorName } }]),
  useAuth: () => ({ user: state.user }),
}));

import { AuthorField } from "./AuthorField";

const render_ = (readOnly: boolean) => {
  const props = { path: "author", field: { label: "Người tạo" }, readOnly } as unknown as Parameters<typeof AuthorField>[0];
  return render(<AuthorField {...props} />);
};

describe("AuthorField", () => {
  beforeEach(() => {
    state.value = "s2";
    state.authorName = "Sale Hai";
  });

  it("admin (ghi được) → ô chọn quan hệ mặc định", () => {
    render_(false);
    expect(screen.getByText("ô-chọn-mặc-định")).toBeInTheDocument();
  });

  it("chỉ đọc → hiện tên từ authorName, không link", () => {
    render_(true);
    expect(screen.getByText("Người tạo")).toBeInTheDocument();
    expect(screen.getByText("Sale Hai")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByText("ô-chọn-mặc-định")).toBeNull();
  });

  it("form tạo mới (chưa có authorName, giá trị là chính mình) → tên người đang đăng nhập", () => {
    state.value = "s1";
    state.authorName = undefined;
    render_(true);
    expect(screen.getByText("Sale Một")).toBeInTheDocument();
  });

  it("không có tên và không phải mình → —", () => {
    state.authorName = null;
    render_(true);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
