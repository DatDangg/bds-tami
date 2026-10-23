// `pnpm report:legacy-units` = `payload run scripts/report-legacy-floor-distance.ts` (BL-065, READ-ONLY).
// Liệt kê bản ghi còn giá trị cũ ("Tầng (giá trị cũ)", "Khoảng cách (giá trị cũ)") nhưng chưa có trường chuẩn hoá,
// tức là migration không parse được → admin cần chọn Mức tầng / Số tầng, hoặc Khoảng cách + Đơn vị bằng tay. Không ghi gì vào DB.
import { getPayload, type Payload } from "payload";

import config from "../src/payload.config";

const PAGE_SIZE = 200;

interface RentalRow {
  id: string | number;
  title?: string | null;
  floor?: string | null;
  floorLevel?: string | null;
  floorNumber?: number | null;
}

interface ProjectRow {
  id: string | number;
  title?: string | null;
  nearbyAmenities?: { id?: string | null; name?: string | null; distance?: string | null; distanceValue?: number | null }[] | null;
}

async function* allDocs<T>(payload: Payload, collection: "rentals" | "projects"): AsyncGenerator<T> {
  for (let page = 1; ; page += 1) {
    const result = await payload.find({ collection, page, limit: PAGE_SIZE, depth: 0, locale: "vi", overrideAccess: true, pagination: true });
    for (const doc of result.docs) yield doc as unknown as T;
    if (!result.hasNextPage) return;
  }
}

const hasText = (value: string | null | undefined) => typeof value === "string" && value.trim() !== "";

const payload = await getPayload({ config });
try {
  const lines: string[] = [];
  for await (const rental of allDocs<RentalRow>(payload, "rentals")) {
    if (hasText(rental.floor) && !rental.floorLevel && typeof rental.floorNumber !== "number") {
      lines.push(`rentals\tid=${rental.id}\t${JSON.stringify(rental.title ?? "")}\tfloor=${JSON.stringify(rental.floor)}`);
    }
  }
  for await (const project of allDocs<ProjectRow>(payload, "projects")) {
    for (const [index, item] of (project.nearbyAmenities ?? []).entries()) {
      if (hasText(item.distance) && typeof item.distanceValue !== "number") {
        lines.push(`projects\tid=${project.id}\t${JSON.stringify(project.title ?? "")}\tnearbyAmenities[${index}] ${JSON.stringify(item.name ?? "")}\tdistance=${JSON.stringify(item.distance)}`);
      }
    }
  }
  console.info(lines.length === 0 ? "Không còn giá trị cũ chưa chuyển." : `Còn ${lines.length} giá trị cũ chưa chuyển (collection, id, tiêu đề, trường, giá trị):\n${lines.join("\n")}`);
} finally {
  await payload.destroy();
}
