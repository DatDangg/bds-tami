import { describe, expect, it } from "vitest";

import en from "../i18n/messages/en.json";
import vi from "../i18n/messages/vi.json";
import {
  DIRECTION_ADMIN_LABELS,
  DIRECTIONS,
  HANDOVER_CONDITION_ADMIN_LABELS,
  HANDOVER_CONDITIONS,
  PROJECT_FEATURE_ADMIN_LABELS,
  PROJECT_FEATURES,
  PROPERTY_TYPE_ADMIN_LABELS,
  PROPERTY_TYPES,
} from "./listing-options";

interface ListingMessages {
  listingOptions: { propertyType: Record<string, string>; projectFeature: Record<string, string>; handoverCondition: Record<string, string> };
  page: { rentalDetail: { direction: Record<string, string> } };
}

describe("listing-options: mọi giá trị có nhãn admin + nhãn công khai VI/EN", () => {
  it.each([
    ["vi", vi],
    ["en", en],
  ])("i18n %s có listingOptions.propertyType / projectFeature / handoverCondition + page.rentalDetail.direction cho đúng mọi giá trị", (_locale, messages) => {
    const { listingOptions, page } = messages as unknown as ListingMessages;
    expect(Object.keys(listingOptions.propertyType)).toEqual([...PROPERTY_TYPES]);
    expect(Object.keys(listingOptions.projectFeature)).toEqual([...PROJECT_FEATURES]);
    expect(Object.keys(listingOptions.handoverCondition)).toEqual([...HANDOVER_CONDITIONS]);
    expect(Object.keys(page.rentalDetail.direction).sort()).toEqual([...DIRECTIONS].sort());
  });

  it("nhãn admin tiếng Việt đủ cho mọi giá trị", () => {
    expect(Object.keys(PROPERTY_TYPE_ADMIN_LABELS)).toEqual([...PROPERTY_TYPES]);
    expect(Object.keys(PROJECT_FEATURE_ADMIN_LABELS)).toEqual([...PROJECT_FEATURES]);
    expect(Object.keys(DIRECTION_ADMIN_LABELS)).toEqual([...DIRECTIONS]);
    expect(Object.keys(HANDOVER_CONDITION_ADMIN_LABELS)).toEqual([...HANDOVER_CONDITIONS]);
  });
});
