import { Writable } from "node:stream";
import { describe, expect, it } from "vitest";

import { createLogger, redactPaths } from "./logger";
import { SERVICE_NAME } from "./monitoring/service-name";

function capture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(chunk.toString());
      callback();
    },
  });
  const logger = createLogger(stream);
  logger.level = "trace";
  return { logger, output: () => lines.join("") };
}

describe("logger: redact PII", () => {
  it("che trường nhạy cảm ở cấp gốc", () => {
    const { logger, output } = capture();
    logger.info(
      {
        phone: "0901234567",
        email: "khach@example.com",
        fullName: "Nguyen Van A",
        message: "Toi muon xem nha",
        password: "Mat-khau-1",
        cookie: "payload-token=abc",
        authorization: "Bearer secret-token",
      },
      "lead",
    );
    const text = output();
    for (const secret of ["0901234567", "khach@example.com", "Nguyen Van A", "Toi muon xem nha", "Mat-khau-1", "payload-token=abc", "secret-token"]) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain("[REDACTED]");
  });

  it("che trường lồng nhau, kể cả header req.headers.cookie / authorization", () => {
    const { logger, output } = capture();
    logger.info(
      {
        req: { headers: { cookie: "payload-token=abc", authorization: "JWT tok-xyz", "set-cookie": "sess=1", "user-agent": "curl" } },
        body: { lead: { email: "a@b.vn", phone: "0912345678", fullName: "Tran B" } },
        user: { email: "staff@tami.vn" },
      },
      "request",
    );
    const text = output();
    for (const secret of ["payload-token=abc", "tok-xyz", "sess=1", "a@b.vn", "0912345678", "Tran B", "staff@tami.vn"]) {
      expect(text).not.toContain(secret);
    }
    expect(text).toContain("curl");
  });

  it("giữ nguyên trường không nhạy cảm và gắn service/env", () => {
    const { logger, output } = capture();
    logger.info({ endpoint: "leads", status: 429 }, "rate limited");
    const entry = JSON.parse(output()) as Record<string, unknown>;
    expect(entry).toMatchObject({ level: "info", service: SERVICE_NAME, endpoint: "leads", status: 429, msg: "rate limited" });
    expect(entry.env).toBe(process.env.APP_ENV ?? "development");
    expect(typeof entry.time).toBe("string");
  });

  it("lỗi: giữ tên + nội dung để debug nhưng lọc email/SĐT trong thông điệp và stack", () => {
    const { logger, output } = capture();
    logger.error({ err: new Error("insert lead khach@example.com 0901234567 failed") }, "lỗi");
    const text = output();
    expect(text).toContain("insert lead");
    expect(text).toContain('"type":"Error"');
    expect(text).not.toContain("khach@example.com");
    expect(text).not.toContain("0901234567");
  });

  it("logger.error(new Error(...)) không msg: msg vẫn hữu ích nhưng không chứa email/SĐT thô", () => {
    const { logger, output } = capture();
    logger.error(new Error("JSON parse lỗi gần khach@example.com 0901234567"));
    const entry = JSON.parse(output()) as { msg: string };
    expect(entry.msg).toContain("JSON parse lỗi");
    expect(output()).not.toContain("khach@example.com");
    expect(output()).not.toContain("0901234567");
  });

  it("logger.error({ err }) không msg: msg lấy từ err.message đã lọc", () => {
    const { logger, output } = capture();
    logger.error({ err: new Error("query lỗi params a@b.com 0912345678") });
    const entry = JSON.parse(output()) as { msg: string };
    expect(entry.msg).toContain("query lỗi");
    expect(output()).not.toContain("a@b.com");
    expect(output()).not.toContain("0912345678");
  });

  it("logger.info chuỗi thô và tham số nội suy chứa PII đều bị lọc", () => {
    const { logger, output } = capture();
    logger.info("gửi cho khach@example.com số 0901234567");
    logger.info("lead %s", "0988777666");
    expect(output()).not.toContain("khach@example.com");
    expect(output()).not.toContain("0901234567");
    expect(output()).not.toContain("0988777666");
    expect(output()).toContain("gửi cho");
  });

  it("msg tường minh vẫn được giữ cùng err đã lọc", () => {
    const { logger, output } = capture();
    logger.error({ err: new Error("x") }, "thất bại");
    expect((JSON.parse(output()) as { msg: string }).msg).toBe("thất bại");
  });

  it("msg nằm trong object đầu ({ msg } và { err, msg }) cũng bị lọc", () => {
    const { logger, output } = capture();
    logger.info({ msg: "lead khach@example.com 0901234567", endpoint: "leads" });
    logger.error({ err: new Error("x"), msg: "lỗi cho 0912345678 a@b.com" });
    expect(output()).not.toContain("khach@example.com");
    expect(output()).not.toContain("0901234567");
    expect(output()).not.toContain("0912345678");
    expect(output()).not.toContain("a@b.com");
    expect(output()).toContain("endpoint");
    expect(output()).toContain("lead ");
  });

  it("tham số object của %o/%O/%j bị stringify rồi lọc", () => {
    const { logger, output } = capture();
    logger.info("lead %o", { note: "gọi 0901234567" });
    logger.info("lead %O", { note: "mail khach@example.com" });
    logger.info("lead %j", { note: "2026-10-17 0988777666" });
    expect(output()).not.toContain("0901234567");
    expect(output()).not.toContain("khach@example.com");
    expect(output()).not.toContain("0988777666");
    expect(output()).toContain("2026-10-17");
  });

  it("%s với Error và %d với số không để message/SĐT thô lọt vào msg", () => {
    const { logger, output } = capture();
    logger.error("lỗi %s", new Error("gửi khach@example.com 0901234567 thất bại"));
    logger.info("gọi %d lúc %d", 901234567, 42);
    logger.info({ endpoint: "leads" }, "lỗi %s", new Error("a@b.vn 0912345678"));
    const text = output();
    for (const secret of ["khach@example.com", "0901234567", "901234567", "a@b.vn", "0912345678"]) {
      expect(text).not.toContain(secret);
    }
    const lines = text.trim().split("\n").map((line) => JSON.parse(line) as { msg: string });
    expect(lines[0]?.msg).toContain("lỗi Error: gửi");
    expect(lines[1]?.msg).toBe("gọi [phone] lúc 42");
  });

  it("giữ nguyên số bình thường và ID dài khi nội suy", () => {
    const { logger, output } = capture();
    logger.info("mất %d ms, ts %d", 250, 1760000000000);
    expect((JSON.parse(output()) as { msg: string }).msg).toBe("mất 250 ms, ts 1760000000000");
  });

  it("logger.child() kế thừa hook và vẫn lọc", () => {
    const { logger, output } = capture();
    const child = logger.child({ component: "leads" });
    child.error(new Error("fail khach@example.com 0901234567"));
    child.info({ msg: "đt 0912345678" });
    child.info("lead %o", { phone2: "0988777666 hoặc a@b.com" });
    for (const secret of ["khach@example.com", "0901234567", "0912345678", "0988777666", "a@b.com"]) {
      expect(output()).not.toContain(secret);
    }
    expect(output()).toContain('"component":"leads"');
  });

  it("redactPaths phủ cả khoá có dấu gạch (set-cookie) ở mọi cấp", () => {
    const paths = redactPaths();
    expect(paths).toContain("email");
    expect(paths).toContain("*.email");
    expect(paths).toContain("*.*.*.email");
    expect(paths).toContain('["set-cookie"]');
  });
});
