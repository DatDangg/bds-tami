import { describe, expect, it } from "vitest";

import en from "../i18n/messages/en.json";
import vi from "../i18n/messages/vi.json";
import { PROJECT_FEATURE_ADMIN_LABELS, PROJECT_FEATURES, PROPERTY_TYPE_ADMIN_LABELS, PROPERTY_TYPES } from "./listing-options";

describe("listing-options: mọi giá trị có nhãn admin + nhãn công khai VI/EN", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("i18n %s có listingOptions.propertyType / projectFeature cho đúng mọi giá trị", (_locale, messages) => {
    const options = (messages as unknown as { listingOptions: { propertyType: Record<string, string>; projectFeature: Record<string, string> } }).listingOptions;
    expect(Object.keys(options.propertyType)).toEqual([...PROPERTY_TYPES]);
    expect(Object.keys(options.projectFeature)).toEqual([...PROJECT_FEATURES]);
  });

  it("nhãn admin tiếng Việt đủ cho mọi giá trị", () => {
    expect(Object.keys(PROPERTY_TYPE_ADMIN_LABELS)).toEqual([...PROPERTY_TYPES]);
    expect(Object.keys(PROJECT_FEATURE_ADMIN_LABELS)).toEqual([...PROJECT_FEATURES]);
  });
});
