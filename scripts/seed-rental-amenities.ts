// Seed tiện ích mẫu cho tin cho thuê (BL-044, CHỈ DB dev): `pnpm seed:rental-amenities` = `payload run scripts/seed-rental-amenities.ts`.
// Gán 2–5 tiện ích ổn định theo id (`sampleAmenitiesFor`) cho mọi tin CHƯA có tiện ích; tin đã có giữ nguyên nên chạy lại không đổi gì.
// Từ chối chạy khi NODE_ENV=production hoặc DATABASE_URL trùng DATABASE_URL_STAGING / DATABASE_URL_PROD (`checkSeedEnvironment`).
import { getPayload } from "payload";

import config from "../src/payload.config";
import { checkSeedEnvironment, sampleAmenitiesFor } from "../src/lib/rentals/sample-amenities";

const guard = checkSeedEnvironment(process.env);
if (!guard.allowed) {
  console.error(`seed:rental-amenities từ chối chạy: ${guard.reason}. Script này chỉ dành cho DB dev.`);
  process.exit(1);
}

const payload = await getPayload({ config });
// Bỏ tin đã xoá mềm (`deletedAt`, thùng rác) để không chạy hook afterChange (revalidate, reindex) cho tin không ai thấy; rentals không bật draft.
// Pagination tắt vì DB dev nhỏ.
const { docs } = await payload.find({
  collection: "rentals",
  where: { deletedAt: { exists: false } },
  pagination: false,
  depth: 0,
  overrideAccess: true,
  select: { amenities: true },
});
let assigned = 0;
for (const doc of docs) {
  if ((doc.amenities ?? []).length > 0) continue;
  await payload.update({ collection: "rentals", id: doc.id, data: { amenities: sampleAmenitiesFor(doc.id) }, depth: 0, overrideAccess: true });
  assigned += 1;
}
payload.logger.info(`Seed tiện ích tin cho thuê: gán ${assigned}/${docs.length} tin (các tin đã có tiện ích giữ nguyên).`);
await payload.destroy();
