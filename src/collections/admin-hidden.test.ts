import { describe, expect, it } from "vitest";

import { LeadActivities } from "./LeadActivities";
import { PrivateFiles } from "./PrivateFiles";

describe("collection ẩn khỏi menu admin (BL-041)", () => {
  it("lead-activities và private-files có admin.hidden === true (không phụ thuộc user)", () => {
    expect(LeadActivities.admin?.hidden).toBe(true);
    expect(PrivateFiles.admin?.hidden).toBe(true);
  });
});
