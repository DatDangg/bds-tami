import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { chooseOption, renderWithIntl } from "../media/test-utils";
import { FormField } from "./FormField";
import { LeadFormSlot } from "./LeadFormSlot";
import { Checkbox } from "../ui/checkbox";

describe("FormField", () => {
  it("label thật gắn với ô, dấu * có chữ ẩn, không cần placeholder", () => {
    renderWithIntl(<FormField name="fullName" label="Họ tên" required requiredLabel="bắt buộc" />);
    const input = screen.getByLabelText(/Họ tên/);
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).not.toHaveAttribute("placeholder");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(screen.getByText(/\(bắt buộc\)/)).toHaveClass("sr-only");
  });

  it("helper và lỗi cùng nằm trong aria-describedby, có lỗi thì aria-invalid", () => {
    renderWithIntl(<FormField name="phone" label="Số điện thoại" helper="Ví dụ 0901234567" error="Số điện thoại chưa hợp lệ." />);
    const input = screen.getByLabelText("Số điện thoại");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(describedBy).toHaveLength(2);
    expect(document.getElementById(describedBy[0] ?? "")).toHaveTextContent("Ví dụ 0901234567");
    expect(document.getElementById(describedBy[1] ?? "")).toHaveTextContent("Số điện thoại chưa hợp lệ.");
  });

  it("hỗ trợ textarea, select và file với cùng cơ chế label/lỗi", () => {
    renderWithIntl(
      <>
        <FormField as="textarea" name="message" label="Lời nhắn" error="Quá dài." />
        <FormField as="select" name="source" label="Nguồn" options={[{ value: "a", label: "Mục A" }]} />
        <FormField as="file" name="cv" label="CV" accept=".pdf,.doc,.docx" error="Tệp quá lớn." />
      </>,
    );
    expect(screen.getByLabelText("Lời nhắn").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Lời nhắn")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("Nguồn")).toHaveAttribute("role", "combobox");
    const file = screen.getByLabelText("CV");
    expect(file).toHaveAttribute("type", "file");
    expect(file).toHaveAttribute("accept", ".pdf,.doc,.docx");
    expect(file).toHaveAttribute("aria-invalid", "true");
  });

  describe("select (Select TAMI)", () => {
    const sourceOptions = [
      { value: "", label: "Chọn nguồn" },
      { value: "fb", label: "Facebook" },
      { value: "friend", label: "Bạn bè" },
    ];

    it("giữ id/label, aria-invalid, aria-describedby, aria-required và disabled trên trigger", () => {
      renderWithIntl(
        <FormField as="select" name="source" label="Nguồn" required requiredLabel="bắt buộc" helper="Gợi ý" error="Chưa chọn." options={sourceOptions} />,
      );
      const trigger = screen.getByLabelText(/Nguồn/);
      expect(trigger).toHaveAttribute("aria-invalid", "true");
      expect(trigger).toHaveAttribute("aria-required", "true");
      expect(trigger.getAttribute("aria-describedby")?.split(" ")).toHaveLength(2);
      expect(trigger).toHaveTextContent("Chọn nguồn");
    });

    it("submit qua input ẩn có name: rỗng khi chưa chọn, giá trị thật sau khi chọn (không lộ sentinel)", async () => {
      const user = userEvent.setup();
      const { container } = renderWithIntl(
        <form>
          <FormField as="select" name="source" label="Nguồn" options={sourceOptions} />
        </form>,
      );
      const form = container.querySelector("form") as HTMLFormElement;
      expect(new FormData(form).get("source")).toBe("");
      await chooseOption(user, screen.getByLabelText("Nguồn"), "Bạn bè");
      expect(new FormData(form).get("source")).toBe("friend");
      expect(screen.getByLabelText("Nguồn")).toHaveTextContent("Bạn bè");
    });

    it("không có mục rỗng: hiện placeholder (data-placeholder) và FormData là chuỗi rỗng", () => {
      const { container } = renderWithIntl(
        <form>
          <FormField as="select" name="source" label="Nguồn" placeholder="Chọn nguồn…" options={sourceOptions.slice(1)} />
        </form>,
      );
      const trigger = screen.getByLabelText("Nguồn");
      expect(trigger).toHaveTextContent("Chọn nguồn…");
      expect(trigger).toHaveAttribute("data-placeholder");
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("source")).toBe("");
    });

    it("giá trị không khớp mục nào coi như rỗng (hiện placeholder, không gửi giá trị lạ)", () => {
      const { container } = renderWithIntl(
        <form>
          <FormField as="select" name="source" label="Nguồn" placeholder="Chọn nguồn…" defaultValue="zzz" options={sourceOptions.slice(1)} />
        </form>,
      );
      expect(screen.getByLabelText("Nguồn")).toHaveTextContent("Chọn nguồn…");
      expect(new FormData(container.querySelector("form") as HTMLFormElement).get("source")).toBe("");
    });

    it("disabled: trigger khoá", () => {
      renderWithIntl(<FormField as="select" name="source" label="Nguồn" disabled options={sourceOptions} />);
      expect(screen.getByLabelText("Nguồn")).toBeDisabled();
    });
  });

  describe("bo góc đồng bộ (BL-030)", () => {
    it("input, textarea, select, file bo --radius-md, không còn rounded-sm", () => {
      renderWithIntl(
        <>
          <FormField name="a" label="Ô A" />
          <FormField as="textarea" name="b" label="Ô B" />
          <FormField as="select" name="c" label="Ô C" options={[{ value: "x", label: "X" }]} />
          <FormField as="file" name="d" label="Ô D" />
        </>,
      );
      for (const label of ["Ô A", "Ô B", "Ô C", "Ô D"]) {
        const el = screen.getByLabelText(label);
        expect(el).toHaveClass("rounded-md");
        expect(el).not.toHaveClass("rounded-sm");
      }
      expect(screen.getByLabelText("Ô D")).toHaveClass("file:rounded-pill");
    });

    it("checkbox bo 6px dẫn xuất từ token md", () => {
      renderWithIntl(<Checkbox aria-label="Đồng ý" />);
      const box = screen.getByRole("checkbox", { name: "Đồng ý" });
      expect(box).toHaveClass("rounded-[calc(var(--radius-md)/2)]");
      expect(box).not.toHaveClass("rounded-sm");
    });

    it("LeadFormSlot mặc định rounded-lg, className của nơi gọi vẫn thắng", () => {
      const { rerender } = renderWithIntl(<LeadFormSlot title="Tư vấn">nội dung</LeadFormSlot>);
      const section = () => document.querySelector("section") as HTMLElement;
      expect(section()).toHaveClass("rounded-lg");
      rerender(<LeadFormSlot title="Tư vấn" className="rounded-xl">nội dung</LeadFormSlot>);
      expect(section()).toHaveClass("rounded-xl");
      expect(section()).not.toHaveClass("rounded-lg");
    });
  });
});
