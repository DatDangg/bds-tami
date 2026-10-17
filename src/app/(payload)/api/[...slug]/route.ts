import config from "@payload-config";
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from "@payloadcms/next/routes";

import { withRequestMetrics } from "@/lib/monitoring/metrics";

// Nhãn route cố định ("payload_rest"), không dùng URL thật để metrics không bùng nổ số series.
export const GET = withRequestMetrics("payload_rest", REST_GET(config));
export const POST = withRequestMetrics("payload_rest", REST_POST(config));
export const DELETE = withRequestMetrics("payload_rest", REST_DELETE(config));
export const PATCH = withRequestMetrics("payload_rest", REST_PATCH(config));
export const PUT = withRequestMetrics("payload_rest", REST_PUT(config));
export const OPTIONS = withRequestMetrics("payload_rest", REST_OPTIONS(config));
