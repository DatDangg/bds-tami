import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithIntl } from "@/components/media/test-utils";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("lọc không khớp: có nút xoá bộ lọc (link thật) và link nhận tư vấn", () => {
    renderWithIntl(<EmptyState variant="filtered" clearFiltersHref="/cho-thue" adviceHref="/lien-he" />);
    expect(screen.getByRole("heading", { name: "Không tìm thấy tin phù hợp" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xoá bộ lọc" })).toHaveAttribute("href", "/cho-thue");
    expect(screen.getByRole("link", { name: "Nhận tư vấn" })).toHaveAttribute("href", "/lien-he");
  });

  it("trống thật: link về danh sách cha, không có nút xoá bộ lọc", () => {
    renderWithIntl(<EmptyState variant="empty" backHref="/tin-tuc" />, "en");
    expect(screen.getByRole("heading", { name: "There are no articles in this section yet." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the list" })).toHaveAttribute("href", "/tin-tuc");
    expect(screen.queryByRole("link", { name: /Clear filters/ })).toBeNull();
  });

  it("cho phép ghi đè tiêu đề", () => {
    renderWithIntl(<EmptyState variant="filtered" title="Chưa có dự án phù hợp." clearFiltersHref="/du-an" />);
    expect(screen.getByRole("heading", { name: "Chưa có dự án phù hợp." })).toBeInTheDocument();
  });
});
