// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.fn();
vi.mock("@payloadcms/ui", () => ({ toast: { error: (...args: unknown[]) => toastError(...args) } }));

import { UploadSizeGuard } from "./UploadSizeGuard";

const MB = 1024 * 1024;

function makeFile(name: string, type: string, bytes: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: bytes });
  return file;
}

/** jsdom không có DataTransfer: bản giả đủ dùng (items.add + files). */
class FakeDataTransfer {
  files: File[] = [];
  items = { add: (file: File) => void this.files.push(file) };
}

function mountInput(initial: File[]) {
  document.body.innerHTML = '<div id="zone"><input type="file" id="f" multiple /></div>';
  const input = document.getElementById("f") as HTMLInputElement;
  let current: File[] = initial;
  Object.defineProperty(input, "files", {
    configurable: true,
    get: () => current,
    set: (value: File[]) => {
      current = value;
    },
  });
  Object.defineProperty(input, "value", {
    configurable: true,
    get: () => (current.length ? "fakepath" : ""),
    set: (value: string) => {
      if (value === "") current = [];
    },
  });
  return input;
}

describe("UploadSizeGuard", () => {
  beforeEach(() => {
    toastError.mockClear();
    vi.stubGlobal("DataTransfer", FakeDataTransfer);
    render(<UploadSizeGuard>x</UploadSizeGuard>);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("ảnh 11 MB: chặn trước listener bubble, xoá input, 1 toast tiếng Việt nêu tên + dung lượng + giới hạn", () => {
    const input = mountInput([makeFile("big.jpg", "image/jpeg", 11 * MB)]);
    const bubble = vi.fn();
    document.getElementById("zone")!.addEventListener("change", bubble);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bubble).not.toHaveBeenCalled();
    expect(input.value).toBe("");
    expect(toastError).toHaveBeenCalledTimes(1);
    const message = String(toastError.mock.calls[0]![0]);
    expect(message).toContain("big.jpg");
    expect(message).toContain("11,0 MB");
    expect(message).toContain("10 MB");
  });

  it("tệp hợp lệ đi qua nguyên vẹn, không toast", () => {
    const small = makeFile("ok.jpg", "image/jpeg", 2 * MB);
    const input = mountInput([small]);
    const bubble = vi.fn();
    document.getElementById("zone")!.addEventListener("change", bubble);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bubble).toHaveBeenCalledTimes(1);
    expect(input.files).toEqual([small]);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("lẫn lộn: chỉ giữ tệp hợp lệ, 1 toast cho tệp quá cỡ, event vẫn tới listener", () => {
    const ok = makeFile("ok.png", "image/png", 3 * MB);
    const input = mountInput([makeFile("v.mp4", "video/mp4", 16 * MB), ok, makeFile("c.pdf", "application/pdf", 21 * MB)]);
    const bubble = vi.fn();
    document.getElementById("zone")!.addEventListener("change", bubble);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bubble).toHaveBeenCalledTimes(1);
    expect(input.files).toEqual([ok]);
    expect(toastError).toHaveBeenCalledTimes(1);
    const message = String(toastError.mock.calls[0]![0]);
    expect(message).toContain("v.mp4");
    expect(message).toContain("15 MB");
    expect(message).toContain("c.pdf");
    expect(message).toContain("20 MB");
  });

  it("MIME lạ dùng trần 20 MB", () => {
    const input = mountInput([makeFile("a.bin", "application/octet-stream", 19 * MB)]);
    const bubble = vi.fn();
    document.getElementById("zone")!.addEventListener("change", bubble);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(bubble).toHaveBeenCalledTimes(1);
    const bigInput = mountInput([makeFile("b.bin", "", 21 * MB)]);
    bigInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(String(toastError.mock.calls[0]![0])).toContain("20 MB");
  });

  function dropEvent(files: File[]): Event {
    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", { value: { files } });
    return event;
  }

  it("drop chỉ có tệp quá cỡ: chặn lượt gốc, phát lại drop RỖNG để Dropzone gỡ trạng thái dragging, 1 toast", () => {
    document.body.innerHTML = '<div id="zone"></div>';
    const zone = document.getElementById("zone")!;
    let dragging = false;
    const uploads: File[][] = [];
    zone.addEventListener("dragenter", () => {
      dragging = true;
    });
    zone.addEventListener("drop", (e) => {
      dragging = false;
      const files = [...(e as unknown as { dataTransfer: { files: File[] } }).dataTransfer.files];
      if (files.length) uploads.push(files);
    });
    zone.dispatchEvent(new Event("dragenter", { bubbles: true }));
    expect(dragging).toBe(true);
    const event = dropEvent([makeFile("big.png", "image/png", 12 * MB)]);
    zone.dispatchEvent(event);
    expect(dragging).toBe(false);
    expect(uploads).toEqual([]);
    expect(event.defaultPrevented).toBe(true);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("drop phát lại giữ toạ độ + phím bổ trợ của lượt gốc", () => {
    document.body.innerHTML = '<div id="zone"></div>';
    const zone = document.getElementById("zone")!;
    const seen: Array<Record<string, unknown>> = [];
    zone.addEventListener("drop", (e) => seen.push(e as unknown as Record<string, unknown>));
    const event = dropEvent([makeFile("big.png", "image/png", 12 * MB)]);
    Object.assign(event, { clientX: 11, clientY: 22, screenX: 33, screenY: 44, ctrlKey: true, shiftKey: false });
    zone.dispatchEvent(event);
    expect(seen).toHaveLength(1);
    expect(seen[0]).toMatchObject({ clientX: 11, clientY: 22, screenX: 33, screenY: 44, ctrlKey: true, shiftKey: false });
  });

  it("10 MB + 1 byte không hiện đúng bằng giới hạn", () => {
    const input = mountInput([makeFile("edge.jpg", "image/jpeg", 10 * MB + 1)]);
    input.dispatchEvent(new Event("change", { bubbles: true }));
    const message = String(toastError.mock.calls[0]![0]);
    expect(message).toContain("10,1 MB");
    expect(message).not.toContain("(10,0 MB)");
  });

  function pasteEvent(files: File[]): Event {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { files } });
    return event;
  }

  it("paste tệp quá cỡ: chặn + 1 toast; paste hợp lệ đi qua", () => {
    document.body.innerHTML = '<div id="zone"></div>';
    const zone = document.getElementById("zone")!;
    const bubble = vi.fn();
    zone.addEventListener("paste", bubble);
    const big = pasteEvent([makeFile("shot.png", "image/png", 12 * MB)]);
    zone.dispatchEvent(big);
    expect(bubble).not.toHaveBeenCalled();
    expect(big.defaultPrevented).toBe(true);
    expect(toastError).toHaveBeenCalledTimes(1);
    zone.dispatchEvent(pasteEvent([makeFile("ok.png", "image/png", MB)]));
    expect(bubble).toHaveBeenCalledTimes(1);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("drop lẫn lộn: phát lại drop chỉ với tệp hợp lệ", () => {
    document.body.innerHTML = '<div id="zone"></div>';
    const zone = document.getElementById("zone")!;
    const seen: File[][] = [];
    zone.addEventListener("drop", (e) => seen.push([...((e as unknown as { dataTransfer: { files: File[] } }).dataTransfer.files)]));
    const ok = makeFile("ok.jpg", "image/jpeg", MB);
    zone.dispatchEvent(dropEvent([makeFile("big.jpg", "image/jpeg", 12 * MB), ok]));
    expect(seen).toEqual([[ok]]);
    expect(toastError).toHaveBeenCalledTimes(1);
  });

  it("drop hợp lệ đi qua nguyên vẹn đúng 1 lần", () => {
    document.body.innerHTML = '<div id="zone"></div>';
    const zone = document.getElementById("zone")!;
    const bubble = vi.fn();
    zone.addEventListener("drop", bubble);
    zone.dispatchEvent(dropEvent([makeFile("ok.jpg", "image/jpeg", MB)]));
    expect(bubble).toHaveBeenCalledTimes(1);
    expect(toastError).not.toHaveBeenCalled();
  });
});
