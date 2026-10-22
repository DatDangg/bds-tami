import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FormErrorFocus } from "./FormErrorFocus";
import { focusFirstFieldError, planErrorFocus, resolveFocusRoot, UNMATCHED_ATTRIBUTE } from "./form-error-focus";

function mount(html: string) {
  document.body.innerHTML = html;
  return document.body;
}

const errorField = (name: string) =>
  `<div class="field-type text error"><label>${name}</label><div class="field-type__wrap"><aside class="tooltip field-error">Bắt buộc</aside><input name="${name}" /></div></div>`;

describe("planErrorFocus (chọn ô lỗi đầu tiên theo thứ tự hiển thị)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("chưa có lỗi nào hiện → chờ", () => {
    expect(planErrorFocus(mount("<div class='field-type'><input /></div>")).kind).toBe("wait");
  });

  it("ô lỗi ở tab đang mở → focus ô đầu tiên", () => {
    const plan = planErrorFocus(mount(`<button class="tabs-field__tab-button tabs-field__tab-button--active tabs-field__tab-button--has-error"></button>${errorField("title")}${errorField("slug")}`));
    expect(plan.kind).toBe("focus");
    if (plan.kind === "focus") expect(plan.field.querySelector("input")?.getAttribute("name")).toBe("title");
  });

  it("tab có lỗi chưa mở đứng trước ô lỗi → bấm tab đó", () => {
    const root = mount(
      `<button class="tabs-field__tab-button tabs-field__tab-button--active"></button>
       <button id="advanced" class="tabs-field__tab-button tabs-field__tab-button--has-error"></button>${errorField("title")}`,
    );
    const plan = planErrorFocus(root);
    expect(plan.kind).toBe("click");
    if (plan.kind === "click") expect(plan.element.id).toBe("advanced");
  });

  it("tab lỗi đầu tiên đang mở, tab sau chưa mở → không nhảy sang tab sau", () => {
    const plan = planErrorFocus(
      mount(
        `<div class="tabs-field"><button class="tabs-field__tab-button tabs-field__tab-button--active tabs-field__tab-button--has-error"></button>
         <button class="tabs-field__tab-button tabs-field__tab-button--has-error"></button><div class="tabs-field__content-wrap">${errorField("title")}</div></div>`,
      ),
    );
    expect(plan.kind).toBe("focus");
  });

  it("tab có lỗi đang mở nhưng chưa có ô lỗi (lỗi ở tab con) → xét tab có lỗi chưa mở kế tiếp", () => {
    const root = mount(
      `<div class="tabs-field"><button class="tabs-field__tab-button tabs-field__tab-button--active tabs-field__tab-button--has-error"></button>
         <button id="child" class="tabs-field__tab-button tabs-field__tab-button--has-error"></button><div class="tabs-field__content-wrap"></div></div>`,
    );
    const plan = planErrorFocus(root);
    expect(plan.kind === "click" && plan.element.id).toBe("child");
  });

  it("tab có lỗi nhưng ô chưa render (tab chưa mở) mà không còn nút để bấm → chờ", () => {
    const plan = planErrorFocus(mount(`<button class="tabs-field__tab-button tabs-field__tab-button--active tabs-field__tab-button--has-error"></button>`));
    expect(plan.kind).toBe("wait");
  });

  it("ô lỗi đứng trước thanh tab (ngoài tab) → focus ô, không bấm tab", () => {
    const plan = planErrorFocus(mount(`${errorField("title")}<button class="tabs-field__tab-button tabs-field__tab-button--has-error"></button>`));
    expect(plan.kind).toBe("focus");
  });

  it("ô lỗi trong khối thu gọn lồng nhau → trả nút mở từ ngoài vào trong", () => {
    const plan = planErrorFocus(
      mount(
        `<div class="collapsible collapsible--collapsed" id="outer"><button class="collapsible__toggle" id="outer-toggle"></button>
           <div class="collapsible collapsible--collapsed"><button class="collapsible__toggle" id="inner-toggle"></button>${errorField("slug")}</div>
         </div>`,
      ),
    );
    expect(plan.kind).toBe("focus");
    if (plan.kind === "focus") expect(plan.openers.map((toggle) => toggle.id)).toEqual(["outer-toggle", "inner-toggle"]);
  });

  it("khối thu gọn đã mở → không có nút cần bấm", () => {
    const plan = planErrorFocus(mount(`<div class="collapsible"><button class="collapsible__toggle"></button>${errorField("slug")}</div>`));
    expect(plan.kind === "focus" && plan.openers).toEqual([]);
  });
});

describe("resolveFocusRoot (drawer trên cùng)", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });
  it("không có drawer → document; có nhiều drawer → cái cuối", () => {
    expect(resolveFocusRoot()).toBe(document);
    mount(`<div class="drawer" id="a"></div><div class="drawer" id="b"></div>`);
    expect((resolveFocusRoot() as HTMLElement).id).toBe("b");
  });
});

describe("focusFirstFieldError (chạy nhiều bước)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("bấm tab chưa mở, đợi ô render, rồi focus + cuộn tới ô lỗi", async () => {
    mount(`<button class="tabs-field__tab-button tabs-field__tab-button--active"></button><button id="t2" class="tabs-field__tab-button tabs-field__tab-button--has-error"></button><div id="panel"></div>`);
    document.getElementById("t2")?.addEventListener("click", () => {
      document.getElementById("t2")?.classList.add("tabs-field__tab-button--active");
      document.getElementById("panel")!.innerHTML = errorField("slug");
    });
    const done = focusFirstFieldError(document, () => false);
    await vi.runAllTimersAsync();
    await done;
    expect(document.activeElement?.getAttribute("name")).toBe("slug");
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ block: "center" });
  });

  it("không có tab/ô lỗi nào → trả false sau vài lần chờ", async () => {
    mount("<div class=\"field-type\"><input /></div>");
    const done = focusFirstFieldError(document, () => false);
    await vi.runAllTimersAsync();
    expect(await done).toBe(false);
  });

  it("dừng khi bị huỷ (có lần Lưu mới)", async () => {
    mount(errorField("title"));
    const done = focusFirstFieldError(document, () => true);
    await vi.runAllTimersAsync();
    await done;
    expect(document.activeElement?.getAttribute("name")).not.toBe("title");
  });
});

describe("FormErrorFocus (tín hiệu: toast lỗi theo ô xuất hiện)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  async function addToast(html: string) {
    await act(async () => {
      const toast = document.createElement("div");
      toast.innerHTML = html;
      document.body.appendChild(toast);
      await vi.runAllTimersAsync();
    });
  }

  it("toast gom danh sách lỗi hiện ra → focus ô lỗi đầu tiên", async () => {
    render(<FormErrorFocus>{null}</FormErrorFocus>);
    document.body.insertAdjacentHTML("beforeend", errorField("title"));
    await addToast('<ul data-testid="field-errors"><li>Tiêu đề</li></ul>');
    expect(document.activeElement?.getAttribute("name")).toBe("title");
  });

  async function addToastItem(html: string) {
    await act(async () => {
      const item = document.createElement("li");
      item.setAttribute("data-sonner-toast", "");
      item.innerHTML = html;
      document.body.appendChild(item);
      await vi.runAllTimersAsync();
    });
    return document.querySelector("[data-sonner-toast]")!;
  }

  it("toast có marker nhưng KHÔNG ô nào hiện lỗi (vd. path where) → gắn cờ unmatched để vẫn hiện", async () => {
    render(<FormErrorFocus>{null}</FormErrorFocus>);
    const toast = await addToastItem('<ul data-testid="field-errors"><li>where</li></ul>');
    expect(toast.hasAttribute(UNMATCHED_ATTRIBUTE)).toBe(true);
  });

  it("toast có marker và có ô lỗi → không gắn cờ (toast tiếp tục bị ẩn)", async () => {
    render(<FormErrorFocus>{null}</FormErrorFocus>);
    document.body.insertAdjacentHTML("beforeend", errorField("title"));
    const toast = await addToastItem('<ul data-testid="field-errors"><li>Tiêu đề</li></ul>');
    expect(toast.hasAttribute(UNMATCHED_ATTRIBUTE)).toBe(false);
  });

  it("toast lỗi không gắn ô (quyền/mạng) → không cuộn/focus", async () => {
    render(<FormErrorFocus>{null}</FormErrorFocus>);
    document.body.insertAdjacentHTML("beforeend", errorField("title"));
    await addToast("<div>Bạn không có quyền</div>");
    expect(document.activeElement?.getAttribute("name")).not.toBe("title");
  });
});
