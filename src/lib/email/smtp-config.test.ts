import { describe, expect, it } from "vitest";

import { findSmtpConfigProblems } from "./smtp-config";

describe("findSmtpConfigProblems", () => {
  it.each(["smtp.invalid", "", "   ", "smtp.example", "mail.test", "example.com", "SMTP.PLACEHOLDER.vn"])(
    "host giữ chỗ %j -> có cảnh báo",
    (host) => {
      expect(findSmtpConfigProblems({ host, user: "real" })).toHaveLength(1);
    },
  );

  it("host thật + user thật -> không cảnh báo", () => {
    expect(findSmtpConfigProblems({ host: "smtp-relay.brevo.com", user: "abc@smtp-brevo.com" })).toEqual([]);
  });

  it("user=placeholder -> cảnh báo, không in giá trị user/pass", () => {
    const problems = findSmtpConfigProblems({ host: "smtp-relay.brevo.com", user: "placeholder" });
    expect(problems).toHaveLength(1);
    expect(problems[0]).not.toMatch(/placeholder"/);
  });
});
