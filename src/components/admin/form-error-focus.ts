// Chọn ô lỗi đầu tiên (theo thứ tự hiển thị) sau một lần Lưu thất bại, rồi mở tab/khối thu gọn chứa nó, cuộn và focus (BL-058).
// Selector lấy từ @payloadcms/ui 3.91: tab `.tabs-field__tab-button(--has-error|--active)`, khối thu gọn `.collapsible(--collapsed)`,
// lỗi theo ô `.field-error`. Tab chưa mở KHÔNG render nội dung nên phải bấm tab trước rồi lập kế hoạch lại.

export const TAB_ERROR_SELECTOR = ".tabs-field__tab-button--has-error";
export const FIELD_ERROR_SELECTOR = ".field-error";
// Toast "Các trường sau chưa hợp lệ (N): …" của Payload (FieldErrorsToast) — dấu hiệu duy nhất cho "Lưu lỗi theo ô".
export const FIELD_ERRORS_TOAST_SELECTOR = '[data-testid="field-errors"], [data-testid="field-error"]';

const FOCUSABLE_SELECTOR = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]';

export type FocusStep =
  | { kind: "click"; element: HTMLElement }
  | { kind: "focus"; field: HTMLElement; openers: HTMLElement[] }
  | { kind: "wait" };

function precedes(a: Element, b: Element) {
  return Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
}

// Nút mở các khối thu gọn bao quanh `field`, từ ngoài vào trong.
function collapsedOpeners(field: Element): HTMLElement[] {
  const openers: HTMLElement[] = [];
  for (let node = field.parentElement; node; node = node.parentElement) {
    if (!node.classList.contains("collapsible--collapsed")) continue;
    const toggle = node.querySelector<HTMLElement>(".collapsible__toggle");
    if (toggle) openers.unshift(toggle);
  }
  return openers;
}

// Tab có lỗi cần bấm: duyệt theo thứ tự hiển thị; tab đang mở mà nội dung đã có ô lỗi thì dừng (focus ô), tab đang mở chưa có ô lỗi
// (lỗi nằm ở tab con) thì xét tiếp tab kế.
function firstTabToOpen(root: ParentNode): HTMLElement | null {
  for (const tab of root.querySelectorAll<HTMLElement>(TAB_ERROR_SELECTOR)) {
    if (!tab.classList.contains("tabs-field__tab-button--active")) return tab;
    if (tab.closest(".tabs-field")?.querySelector(`.tabs-field__content-wrap ${FIELD_ERROR_SELECTOR}`)) return null;
  }
  return null;
}

/** Form đang nhập: ngăn kéo (drawer) trên cùng nếu có, không thì cả trang — tránh đụng form nền còn lỗi cũ. */
export function resolveFocusRoot(): ParentNode {
  const drawers = document.querySelectorAll(".drawer");
  return drawers.item(drawers.length - 1) ?? document;
}

/** Bước kế tiếp: bấm tab có lỗi chưa mở, hoặc focus ô lỗi đầu tiên, hoặc chờ lỗi hiện ra. */
export function planErrorFocus(root: ParentNode): FocusStep {
  const tabToOpen = firstTabToOpen(root);
  const firstError = root.querySelector<HTMLElement>(FIELD_ERROR_SELECTOR);
  if (tabToOpen && (!firstError || precedes(tabToOpen, firstError))) {
    return { kind: "click", element: tabToOpen };
  }
  if (!firstError) return { kind: "wait" };
  const field = firstError.closest<HTMLElement>(".field-type, .rich-text-lexical") ?? firstError.parentElement ?? firstError;
  return { kind: "focus", field, openers: collapsedOpeners(field) };
}

export function focusField(field: HTMLElement) {
  const target = field.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
  target?.focus({ preventScroll: true });
  (target ?? field).scrollIntoView({ block: "center" });
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const STEP_DELAY_MS = 120;
const COLLAPSE_ANIMATION_MS = 300;
const MAX_STEPS = 12;

// Toast "chưa hợp lệ" mà không ô nào hiện lỗi (vd. lỗi path "where" của sửa hàng loạt) phải vẫn thấy: gắn cờ để CSS không ẩn nó.
export const UNMATCHED_ATTRIBUTE = "data-field-errors-unmatched";
const NO_ERROR_GIVE_UP_WAITS = 5;

export function markUnmatchedToasts(doc: Document) {
  doc.querySelectorAll(FIELD_ERRORS_TOAST_SELECTOR).forEach((marker) => marker.closest("[data-sonner-toast]")?.setAttribute(UNMATCHED_ATTRIBUTE, ""));
}

/**
 * Chạy kế hoạch tới khi focus được ô lỗi (nhiều bước vì tab/khối chỉ render sau khi bấm). Trả true nếu đã có ô lỗi để focus.
 * `isCancelled` dừng khi có lần Lưu mới/unmount. Không thấy tab/ô lỗi nào sau ~0,7s → trả false (toast không gắn ô).
 */
export async function focusFirstFieldError(root: ParentNode, isCancelled: () => boolean): Promise<boolean> {
  await delay(STEP_DELAY_MS); // đợi nhãn tab cập nhật số lỗi
  let idleWaits = 0;
  for (let step = 0; step < MAX_STEPS && !isCancelled(); step++) {
    const plan = planErrorFocus(root);
    if (plan.kind === "focus") {
      plan.openers.forEach((toggle) => toggle.click());
      if (plan.openers.length > 0) await delay(COLLAPSE_ANIMATION_MS);
      if (!isCancelled()) focusField(plan.field);
      return true;
    }
    if (plan.kind === "click") plan.element.click();
    else if (!root.querySelector(TAB_ERROR_SELECTOR) && ++idleWaits >= NO_ERROR_GIVE_UP_WAITS) return false;
    await delay(STEP_DELAY_MS);
  }
  return false;
}
