"use client";

import { toast } from "@payloadcms/ui";
import { useEffect, type ReactNode } from "react";

import { MAX_UPLOAD_BYTES, MB, MEDIA_POLICY } from "../../lib/upload/media-limits";

/** Cờ đánh dấu `drop` do chính guard phát lại (đã lọc) để không lọc/toast lần nữa. */
const REDISPATCHED = Symbol("uploadSizeGuardRedispatched");

function limitFor(file: File): number {
  return MEDIA_POLICY[file.type]?.maxBytes ?? MAX_UPLOAD_BYTES;
}

function kindLabel(file: File): string {
  if (file.type.startsWith("image/")) return "Ảnh";
  if (file.type.startsWith("video/")) return "Video";
  if (file.type === "application/pdf") return "PDF";
  return "Tệp";
}

// Làm tròn LÊN để tệp vượt giới hạn không bao giờ hiện đúng bằng giới hạn (vd 10 MB + 1 byte → 10,1 MB).
const formatMegabytes = (bytes: number) => `${(Math.ceil((bytes / MB) * 10) / 10).toFixed(1).replace(".", ",")} MB`;

function describeRejected(file: File): string {
  return `${kindLabel(file)} “${file.name}” (${formatMegabytes(file.size)}) vượt giới hạn ${Math.floor(limitFor(file) / MB)} MB`;
}

/** Tách tệp hợp lệ / quá cỡ; nếu có tệp quá cỡ thì báo đúng 1 toast gom tất cả. */
function partition(files: File[]): { accepted: File[]; hasRejected: boolean } {
  const accepted = files.filter((file) => file.size <= limitFor(file));
  const rejected = files.filter((file) => file.size > limitFor(file));
  if (rejected.length > 0) {
    toast.error(`${rejected.map(describeRejected).join("; ")}. Hãy nén hoặc chọn tệp nhỏ hơn.`);
  }
  return { accepted, hasRejected: rejected.length > 0 };
}

function toDataTransfer(files: File[]): DataTransfer {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  return transfer;
}

function handleChange(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files?.length) return;
  const { accepted, hasRejected } = partition([...input.files]);
  if (!hasRejected) return;
  if (accepted.length === 0) {
    // Không còn tệp nào: chặn hẳn để Payload không gửi request; xoá input để chọn lại đúng tệp đó vẫn kích hoạt `change`.
    event.stopImmediatePropagation();
    input.value = "";
    return;
  }
  input.files = toDataTransfer(accepted).files;
}

/** Môi trường không có DragEvent (jsdom): Event thường + các trường toạ độ/phím gán tay. */
function legacyDropEvent(init: DragEventInit): Event {
  const { bubbles, cancelable, ...fields } = init;
  return Object.assign(new Event("drop", { bubbles, cancelable }), fields);
}

function redispatchDrop(original: DragEvent, files: File[]): void {
  const transfer = toDataTransfer(files);
  const { clientX, clientY, screenX, screenY, ctrlKey, shiftKey, altKey, metaKey } = original;
  const init = { bubbles: true, cancelable: true, dataTransfer: transfer, clientX, clientY, screenX, screenY, ctrlKey, shiftKey, altKey, metaKey };
  const replay = typeof DragEvent === "function" ? new DragEvent("drop", init) : legacyDropEvent(init);
  if (!("dataTransfer" in replay) || !replay.dataTransfer) Object.defineProperty(replay, "dataTransfer", { value: transfer });
  Object.defineProperty(replay, REDISPATCHED, { value: true });
  original.target?.dispatchEvent(replay);
}

function handleDrop(event: Event): void {
  if (Reflect.get(event, REDISPATCHED)) return;
  const original = event as DragEvent;
  const dropped = original.dataTransfer?.files;
  if (!dropped?.length) return;
  const { accepted, hasRejected } = partition([...dropped]);
  if (!hasRejected) return;
  // Chặn lượt thả gốc (còn tệp quá cỡ) rồi LUÔN phát lại lượt thả chỉ gồm tệp hợp lệ (có thể rỗng): Dropzone của Payload
  // chỉ gỡ trạng thái "dragging" (viền xanh, pointer-events: none) trong handler drop, trình duyệt không bắn dragleave sau khi thả.
  original.preventDefault();
  original.stopImmediatePropagation();
  redispatchDrop(original, accepted);
}

/** Dán ảnh từ clipboard vào Dropzone: không sửa được clipboardData nên có tệp quá cỡ thì chặn cả lượt dán. */
function handlePaste(event: Event): void {
  const files = (event as ClipboardEvent).clipboardData?.files;
  if (!files?.length) return;
  if (!partition([...files]).hasRejected) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

/**
 * Chặn sớm tệp quá dung lượng ở mọi ô chọn/kéo-thả tệp trong admin (BL-088): bulk upload của Payload không xử lý 413 gọn
 * (hiện "Successfully saved" kèm lỗi chung). Listener ở pha capture nên chạy trước React/dropzone; server vẫn là chốt chặn cuối.
 */
export function UploadSizeGuard({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.addEventListener("change", handleChange, true);
    document.addEventListener("drop", handleDrop, true);
    document.addEventListener("paste", handlePaste, true);
    return () => {
      document.removeEventListener("change", handleChange, true);
      document.removeEventListener("drop", handleDrop, true);
      document.removeEventListener("paste", handlePaste, true);
    };
  }, []);

  return children;
}
