import { describe, expect, it } from "vitest";

import { EMAIL_TEMPLATE_NAMES, renderEmailTemplate } from "./index";
import { escapeHtml, toSingleLine } from "./layout";

const leadData = {
  leadName: "Nguyễn Văn A",
  phone: "0901234567",
  email: "a@example.com",
  need: "Mua căn 2PN",
  language: "en",
  leadUrl: "https://tami.vn/admin/collections/leads/1",
};

describe("render template email nội bộ", () => {
  it("new-lead: tiếng Việt, đủ biến, hiện ngôn ngữ khách đã dùng", () => {
    const mail = renderEmailTemplate("new-lead", leadData);
    expect(mail.subject).toBe("[TAMI] Khách hàng mới: Nguyễn Văn A");
    for (const piece of ["Nguyễn Văn A", "0901234567", "a@example.com", "Mua căn 2PN", "Tiếng Anh", leadData.leadUrl]) {
      expect(mail.html).toContain(piece);
      expect(mail.text).toContain(piece);
    }
  });

  it("lead-assigned và job-application render đủ biến", () => {
    const assigned = renderEmailTemplate("lead-assigned", {
      leadName: "Khách B",
      phone: "0911222333",
      assignedToName: "Sale C",
      language: "vi",
      leadUrl: "https://tami.vn/admin/leads/2",
    });
    expect(assigned.html).toContain("Sale C");
    expect(assigned.text).toContain("0911222333");

    const application = renderEmailTemplate("job-application", {
      applicantName: "Ứng viên D",
      jobTitle: "Chuyên viên tư vấn",
      language: "vi",
      applicationUrl: "https://tami.vn/admin/applications/3",
    });
    expect(application.subject).toContain("Chuyên viên tư vấn");
    expect(application.html).toContain("Ứng viên D");
  });

  it("escape HTML mọi giá trị khách nhập; subject không xuống dòng", () => {
    const mail = renderEmailTemplate("new-lead", {
      ...leadData,
      leadName: "<script>alert(1)</script>\r\nBcc: x@evil.test",
      need: `"><img src=x onerror=alert(1)>`,
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).not.toContain("<img");
    expect(mail.html).toContain("&lt;script&gt;");
    expect(mail.subject).not.toMatch(/[\r\n]/);
  });

  it("thiếu biến bắt buộc hoặc leadUrl không phải http(s) -> lỗi", () => {
    expect(() => renderEmailTemplate("new-lead", { ...leadData, phone: undefined })).toThrow();
    expect(() => renderEmailTemplate("new-lead", { ...leadData, leadUrl: "javascript:alert(1)" })).toThrow();
  });

  it("danh sách tên template khớp bộ render", () => {
    expect(EMAIL_TEMPLATE_NAMES).toEqual(["new-lead", "lead-assigned", "job-application"]);
  });
});

describe("helper layout", () => {
  it("escapeHtml xử lý & < > dấu nháy kép và đơn", () => {
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("toSingleLine gộp khoảng trắng và xuống dòng", () => {
    expect(toSingleLine("a\r\n b\t c ")).toBe("a b c");
  });
});
