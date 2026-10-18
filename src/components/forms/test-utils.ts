import { act } from "@testing-library/react";
import { vi } from "vitest";

type ProgressListener = (event: { lengthComputable: boolean; loaded: number; total: number }) => void;
type Reply = { status: number; body: unknown; headers?: Record<string, string> };

/**
 * Thay `XMLHttpRequest` trong test của form có tiến trình upload (jsdom không chạy upload thật).
 * `sent` ghi lại (url, body) mỗi lần gửi; `autoReply` trả lời ngay sau `send()`; không có thì test tự gọi `progress()/respond()/fail()`.
 */
export class FakeUploadXhr {
  static instances: FakeUploadXhr[] = [];
  static sent = vi.fn<(url: string, body: FormData) => void>();
  static autoReply: Reply | null = null;

  status = 0;
  responseText = "";
  upload: { onprogress: ProgressListener | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  onabort: (() => void) | null = null;
  requestHeaders: Record<string, string> = {};
  private url = "";
  private responseHeaders: Record<string, string> = {};

  constructor() {
    FakeUploadXhr.instances.push(this);
  }

  open(_method: string, url: string) {
    this.url = url;
  }

  setRequestHeader(name: string, value: string) {
    this.requestHeaders[name] = value;
  }

  getResponseHeader(name: string): string | null {
    return this.responseHeaders[name] ?? null;
  }

  send(body: FormData) {
    FakeUploadXhr.sent(this.url, body);
    const reply = FakeUploadXhr.autoReply;
    if (reply) setTimeout(() => this.respond(reply.status, reply.body, reply.headers), 0);
  }

  progress(loaded: number, total: number) {
    act(() => this.upload.onprogress?.({ lengthComputable: true, loaded, total }));
  }

  respond(status: number, body: unknown, headers: Record<string, string> = {}) {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.responseHeaders = headers;
    act(() => this.onload?.());
  }

  fail() {
    act(() => this.onerror?.());
  }

  static get last(): FakeUploadXhr {
    const xhr = FakeUploadXhr.instances.at(-1);
    if (!xhr) throw new Error("Chưa có XMLHttpRequest nào được tạo");
    return xhr;
  }

  /** Gắn vào global (nhớ `vi.unstubAllGlobals()` ở afterEach) và xoá dấu vết lần test trước. */
  static install(autoReply: Reply | null = null) {
    FakeUploadXhr.instances = [];
    FakeUploadXhr.sent = vi.fn();
    FakeUploadXhr.autoReply = autoReply;
    vi.stubGlobal("XMLHttpRequest", FakeUploadXhr);
    return FakeUploadXhr;
  }
}
