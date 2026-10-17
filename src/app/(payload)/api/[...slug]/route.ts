import config from "@payload-config";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

import { withDefaultNoStore } from "@/lib/http/cache-policy";
import { withRequestMetrics } from "@/lib/monitoring/metrics";

// Không có Cache-Control thì no-store (ngoại lệ: ảnh media tự đặt immutable, G1).
// Nhãn route cố định ("payload_rest"), không dùng URL thật để metrics không bùng nổ số series.
export const GET = withDefaultNoStore(withRequestMetrics("payload_rest", REST_GET(config)));
export const POST = withDefaultNoStore(withRequestMetrics("payload_rest", REST_POST(config)));
export const DELETE = withDefaultNoStore(withRequestMetrics("payload_rest", REST_DELETE(config)));
export const PATCH = withDefaultNoStore(withRequestMetrics("payload_rest", REST_PATCH(config)));
export const PUT = withDefaultNoStore(withRequestMetrics("payload_rest", REST_PUT(config)));
export const OPTIONS = withDefaultNoStore(withRequestMetrics("payload_rest", REST_OPTIONS(config)));
