import { describe, expect, it } from "vitest";

import { APPLICATION_STATUSES } from "../../collections/JobApplications";
import { SALES_STATUSES } from "../../collections/Projects";
import { CONTENT_STATUSES, RENTAL_STATUSES } from "../../fields/status";
import { TRANSLATION_STATUSES } from "../../fields/translation";
import { LEAD_STATUSES } from "../../lib/leads/lead-values";
import { BADGE_TONE_NAMES } from "./admin-tokens";
import { STATUS_TONES, toneForStatus } from "./status-tones";

const SOURCES = {
  content: CONTENT_STATUSES,
  rental: RENTAL_STATUSES,
  lead: LEAD_STATUSES,
  application: APPLICATION_STATUSES,
  sales: SALES_STATUSES,
  translation: TRANSLATION_STATUSES,
} as const;

describe("status-tones", () => {
  for (const [name, values] of Object.entries(SOURCES)) {
    it(`mọi giá trị trạng thái ${name} đều có tone hợp lệ`, () => {
      for (const value of values) {
        expect(STATUS_TONES[value], `thiếu tone cho "${value}"`).toBeDefined();
        expect(BADGE_TONE_NAMES).toContain(STATUS_TONES[value]);
      }
    });
  }

  it("không khai giá trị thừa không thuộc nguồn nào", () => {
    const known = new Set<string>(Object.values(SOURCES).flat());
    expect(Object.keys(STATUS_TONES).filter((value) => !known.has(value))).toEqual([]);
  });

  it("khớp thiết kế §1.3 và giá trị lạ rơi về neutral", () => {
    expect(toneForStatus("published")).toBe("success");
    expect(toneForStatus("lost")).toBe("danger");
    expect(toneForStatus("contacted")).toBe("info");
    expect(toneForStatus("new")).toBe("warning");
    expect(toneForStatus("draft")).toBe("neutral");
    expect(toneForStatus("khong-co")).toBe("neutral");
  });
});
