import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./LeadExportButton", () => ({ LeadExportButton: () => <button type="button">Xuất Excel</button> }));

import { Leads } from "../../collections/Leads";
import { LeadExportSlot } from "./LeadExportSlot";

describe("LeadExportSlot (server slot beforeListTable của leads)", () => {
  it("danh sách thường: render nút", () => {
    const { getByRole } = render(<LeadExportSlot params={{ segments: ["collections", "leads"] }} />);
    expect(getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();
  });

  it("thùng rác (/collections/leads/trash): không render — endpoint chỉ xuất lead chưa xoá", () => {
    const { container } = render(<LeadExportSlot params={{ segments: ["collections", "leads", "trash"] }} />);
    expect(container.innerHTML).toBe("");
  });

  it("không có params (vd list drawer chỉ truyền segments 2 phần, hoặc thiếu): vẫn render, client tự ẩn trong drawer", () => {
    const { getByRole } = render(<LeadExportSlot />);
    expect(getByRole("button", { name: "Xuất Excel" })).toBeInTheDocument();
  });
});

describe("cấu hình slot của Leads (BL-021 T6)", () => {
  it("nút xuất nằm ở beforeListTable (trong lề trang, dưới hàng tìm kiếm), không ở beforeList", () => {
    expect(Leads.admin?.components?.beforeListTable).toContain("/components/admin/LeadExportSlot#LeadExportSlot");
    expect(Leads.admin?.components?.beforeList).toBeUndefined();
  });
});
