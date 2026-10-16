import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.DATABASE_URL_TEST;

const leadData = {
  leadName: "Khách kiểm thử",
  phone: "0901234567",
  language: "vi",
  leadUrl: "https://tami.vn/admin/leads/1",
};

// Thiếu DATABASE_URL_TEST thì bỏ qua có chủ đích (giống các integration test khác).
describe.skipIf(!databaseUrl)("integration: Payload Jobs + send-notification-email (DB thật, SMTP giả)", () => {
  let payload: Payload;
  const sent: Parameters<Payload["sendEmail"]>[0][] = [];
  const queuedJobIds: string[] = [];
  const errorLogs: unknown[] = [];

  async function queueEmail(input: { template: string; to: string[]; data: unknown }) {
    // Cast: `payload.jobs.queue` kiểu theo payload-types sinh từ config; ở đây chỉ cần input hợp lệ.
    const job = await payload.jobs.queue({
      task: "send-notification-email",
      input: input as never,
      queue: "test-email",
    });
    queuedJobIds.push(String(job.id));
    return job;
  }

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    process.env.APP_ENV = "staging";
    process.env.EMAIL_ALLOWLIST = "noi-bo@tami.vn";
    const { getPayload } = await import("payload");
    const { default: config } = await import("../../src/payload.config");
    payload = await getPayload({ config });
    const originalError = payload.logger.error.bind(payload.logger);
    payload.logger.error = ((...args: unknown[]) => {
      errorLogs.push(args);
      return (originalError as (...a: unknown[]) => unknown)(...args);
    }) as typeof payload.logger.error;
    // Thay đường gửi thật bằng bộ nhớ: test không bao giờ chạm SMTP.
    payload.sendEmail = vi.fn(async (message) => {
      sent.push(message);
      return undefined;
    });
  });

  afterAll(async () => {
    for (const id of queuedJobIds) {
      await payload.db.deleteOne({ collection: "payload-jobs", where: { id: { equals: id } } });
    }
    await payload.destroy();
  });

  it("enqueue -> runner chạy -> transport nhận đúng 1 email tiếng Việt; job xong bị xoá", async () => {
    sent.length = 0;
    const job = await queueEmail({ template: "new-lead", to: ["noi-bo@tami.vn"], data: leadData });

    const stored = await payload.db.findOne({ collection: "payload-jobs", where: { id: { equals: job.id } } });
    expect(stored).not.toBeNull();

    await payload.jobs.run({ queue: "test-email", silent: { error: true } });

    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["noi-bo@tami.vn"]);
    expect(sent[0]?.subject).toBe("[TAMI] Khách hàng mới: Khách kiểm thử");
    expect(String(sent[0]?.html)).toContain("0901234567");
    const afterRun = await payload.db.findOne({ collection: "payload-jobs", where: { id: { equals: job.id } } });
    expect(afterRun).toBeNull();
  });

  it("staging: địa chỉ ngoài EMAIL_ALLOWLIST bị bỏ, chỉ gửi cho địa chỉ nội bộ", async () => {
    sent.length = 0;
    await queueEmail({ template: "new-lead", to: ["noi-bo@tami.vn", "khach@gmail.com"], data: leadData });
    await payload.jobs.run({ queue: "test-email", silent: { error: true } });
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toEqual(["noi-bo@tami.vn"]);
  });

  it("staging: toàn bộ người nhận ngoài danh sách -> không gửi, job vẫn hoàn tất (không retry)", async () => {
    sent.length = 0;
    const job = await queueEmail({ template: "new-lead", to: ["khach@gmail.com"], data: leadData });
    await payload.jobs.run({ queue: "test-email", silent: { error: true } });
    expect(sent).toHaveLength(0);
    const afterRun = await payload.db.findOne({ collection: "payload-jobs", where: { id: { equals: job.id } } });
    expect(afterRun).toBeNull();
  });

  it("gửi lỗi tạm thời -> job còn trong hàng đợi, đánh dấu lỗi và hẹn thử lại (backoff)", async () => {
    sent.length = 0;
    const failing = vi.fn(async () => {
      throw new Error("SMTP tạm thời không khả dụng");
    });
    const original = payload.sendEmail;
    payload.sendEmail = failing;
    try {
      const job = await queueEmail({ template: "new-lead", to: ["noi-bo@tami.vn"], data: leadData });
      await payload.jobs.run({ queue: "test-email", silent: { error: true } });
      expect(failing).toHaveBeenCalledTimes(1);
      const stored = (await payload.db.findOne({
        collection: "payload-jobs",
        where: { id: { equals: job.id } },
      })) as { hasError?: boolean; waitUntil?: string | null; totalTried?: number } | null;
      expect(stored).not.toBeNull();
      expect(stored?.totalTried).toBe(1);
      // Còn lượt thử lại thì chưa đánh dấu hỏng hẳn, nhưng phải có mốc chờ trong tương lai.
      expect(stored?.waitUntil && new Date(stored.waitUntil).getTime()).toBeGreaterThan(Date.now());

      // Chưa đến hạn thì lần chạy kế không gọi lại.
      await payload.jobs.run({ queue: "test-email", silent: { error: true } });
      expect(failing).toHaveBeenCalledTimes(1);
    } finally {
      payload.sendEmail = original;
    }
  });

  it("input không hợp lệ -> lỗi vĩnh viễn: huỷ job, không gửi, không hẹn thử lại, log không chứa dữ liệu khách", async () => {
    sent.length = 0;
    const job = await queueEmail({ template: "new-lead", to: ["noi-bo@tami.vn"], data: { ...leadData, phone: undefined } });
    await payload.jobs.run({ queue: "test-email", silent: { error: true } });
    expect(sent).toHaveLength(0);
    const stored = (await payload.db.findOne({
      collection: "payload-jobs",
      where: { id: { equals: job.id } },
    })) as { hasError?: boolean; waitUntil?: string | null; processing?: boolean; error?: { cancelled?: boolean } } | null;
    expect(stored?.hasError).toBe(true);
    expect(stored?.error?.cancelled).toBe(true);
    expect(stored?.waitUntil ?? null).toBeNull();
    expect(stored?.processing).toBe(false);
    const logged = JSON.stringify(errorLogs);
    expect(logged).not.toContain("0901234567");
    expect(logged).not.toContain("Khách kiểm thử");
  });
});
