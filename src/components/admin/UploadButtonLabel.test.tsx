// @vitest-environment jsdom
import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UploadButtonLabel } from "./UploadButtonLabel";

const buttonHtml = '<button class="btn upload__createNewToggler"><span class="btn__content"><span class="btn__label">Tạo mới</span></span></button>';

describe("UploadButtonLabel", () => {
  it("đổi chữ ở .btn__label (giữ .btn__content) + tên đọc nút upload, không đụng nút 'Tạo mới' khác", () => {
    document.body.innerHTML = `${buttonHtml}<a class="list-create">Tạo mới</a>`;
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    const toggler = document.querySelector<HTMLElement>(".upload__createNewToggler");
    expect(toggler?.querySelector(".btn__label")?.textContent).toBe("Tải lên");
    expect(toggler?.querySelector(".btn__content")).not.toBeNull();
    expect(toggler?.getAttribute("aria-label")).toBe("Tải lên");
    expect(document.querySelector(".list-create")?.textContent).toBe("Tạo mới");
  });

  it("nút không có .btn__label: ghi cả nút (fallback)", () => {
    document.body.innerHTML = '<button class="btn upload__createNewToggler">Tạo mới</button>';
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    expect(document.querySelector(".upload__createNewToggler")?.textContent).toBe("Tải lên");
  });

  it("áp cho nút upload xuất hiện sau (drawer/ô mới)", async () => {
    document.body.innerHTML = "";
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    document.body.insertAdjacentHTML("beforeend", buttonHtml);
    await waitFor(() => expect(document.querySelector(".upload__createNewToggler .btn__label")?.textContent).toBe("Tải lên"));
  });

  it("idempotent: nút đã đúng chữ thì không ghi lại DOM (không tự kích hoạt observer vô hạn)", async () => {
    document.body.innerHTML = buttonHtml.replace("Tạo mới", "Tải lên");
    const label = document.querySelector(".btn__label") as HTMLElement;
    const textNode = label.firstChild;
    render(<UploadButtonLabel>x</UploadButtonLabel>);
    document.body.insertAdjacentHTML("beforeend", "<p>khác</p>");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(label.firstChild).toBe(textNode);
  });

  it("unmount thì ngắt observer", () => {
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    document.body.innerHTML = "";
    const { unmount } = render(<UploadButtonLabel>x</UploadButtonLabel>);
    unmount();
    expect(disconnect).toHaveBeenCalled();
    disconnect.mockRestore();
  });
});
