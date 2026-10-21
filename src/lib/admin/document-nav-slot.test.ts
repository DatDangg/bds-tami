// @vitest-environment node
import { describe, expect, it } from "vitest";

import { ADMIN_COLLECTIONS, ADMIN_GLOBALS } from "../../collections/admin-collections";
import { withDocumentNavSlot } from "./document-nav-slot";

const SLOT = "/components/admin/DocumentNavSlot#DocumentNavSlot";

describe("withDocumentNavSlot (BL-051 A7)", () => {
  it("mọi collection admin có slot, đúng một lần; global không có", () => {
    for (const collection of ADMIN_COLLECTIONS) {
      const slots = collection.admin?.components?.edit?.beforeDocumentControls ?? [];
      expect(slots.filter((slot) => slot === SLOT), collection.slug).toHaveLength(1);
    }
    for (const global of ADMIN_GLOBALS) expect(JSON.stringify(global.admin?.components ?? {}), global.slug).not.toContain("DocumentNavSlot");
  });

  it("giữ slot và component sẵn có của collection", () => {
    const wrapped = withDocumentNavSlot({
      slug: "x",
      fields: [],
      admin: { components: { beforeList: ["/a#A"], edit: { beforeDocumentControls: ["/b#B"], editMenuItems: ["/c#C"] } } },
    });
    expect(wrapped.admin?.components?.beforeList).toEqual(["/a#A"]);
    expect(wrapped.admin?.components?.edit?.editMenuItems).toEqual(["/c#C"]);
    expect(wrapped.admin?.components?.edit?.beforeDocumentControls).toEqual(["/b#B", SLOT]);
  });
});
