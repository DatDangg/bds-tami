import { render, screen } from "@testing-library/react";
import type { DefaultCellComponentProps } from "payload";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const form = vi.hoisted(() => ({ value: null as string | null, initialValue: null as string | null, status: "published", savedStatus: "published" }));

vi.mock("@payloadcms/ui", () => ({
  DefaultCell: () => <span>mặc-định</span>,
  useField: () => ({ value: form.value, initialValue: form.initialValue }),
  useFormFields: (select: (state: [Record<string, { value?: unknown; initialValue?: unknown }>]) => unknown) =>
    select([{ status: { value: form.status, initialValue: form.savedStatus } }]),
}));

import { ScheduledPublishCell, ScheduledPublishNotice } from "./ScheduledPublishDisplay";

const cell = (props: object) => props as DefaultCellComponentProps;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-28T03:00:00.000Z"));
});
afterEach(() => vi.useRealTimers());

describe("ScheduledPublishCell", () => {
  it("tin published hẹn giờ tương lai → nhãn 'Đã hẹn giờ · dd/MM/yyyy HH:mm'", () => {
    render(<ScheduledPublishCell {...cell({ cellData: "2026-10-29T02:30:00.000Z", rowData: { status: "published" } })} />);
    expect(screen.getByText("Đã hẹn giờ · 29/10/2026 09:30")).toBeInTheDocument();
    expect(screen.queryByText("mặc-định")).toBeNull();
  });
  it("quá khứ / bản nháp / không có ngày → ô ngày mặc định", () => {
    for (const props of [
      { cellData: "2026-10-20T00:00:00.000Z", rowData: { status: "published" } },
      { cellData: "2026-10-29T02:30:00.000Z", rowData: { status: "draft" } },
      { cellData: null, rowData: { status: "published" } },
    ]) {
      const { unmount } = render(<ScheduledPublishCell {...cell(props)} />);
      expect(screen.getByText("mặc-định")).toBeInTheDocument();
      unmount();
    }
  });
});

describe("ScheduledPublishNotice", () => {
  it("luôn có ghi chú giờ Việt Nam", () => {
    form.value = null;
    form.initialValue = null;
    render(<ScheduledPublishNotice path="publishedAt" />);
    expect(screen.getByText("Giờ Việt Nam (GMT+7).")).toBeInTheDocument();
  });
  it("tin đang lên web đổi sang tương lai → cảnh báo bị ẩn", () => {
    form.initialValue = "2026-10-20T00:00:00.000Z";
    form.value = "2026-10-29T02:30:00.000Z";
    render(<ScheduledPublishNotice path="publishedAt" />);
    expect(screen.getByText(/sẽ bị ẩn tới 29\/10\/2026 09:30/)).toBeInTheDocument();
  });
  it("máy không ở GMT+7 → cảnh báo múi giờ", () => {
    form.initialValue = null;
    form.value = "2026-10-29T02:30:00.000Z";
    const spy = vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(300);
    render(<ScheduledPublishNotice path="publishedAt" />);
    spy.mockRestore();
    expect(screen.getByText(/không ở múi giờ GMT[+]7/)).toBeInTheDocument();
  });
});
