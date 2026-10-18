import { llmsTxtResponse } from "@/lib/seo/llms-route";

// Đọc DB lúc chạy; Cache-Control do route tự đặt (CDN 60s; 503 no-store).
export const dynamic = "force-dynamic";

export const GET = llmsTxtResponse;
