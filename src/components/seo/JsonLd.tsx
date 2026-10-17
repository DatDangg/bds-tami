import { serializeJsonLd } from "@/lib/seo/json-ld";

/** Nhúng một hoặc nhiều đối tượng JSON-LD; chuỗi qua `serializeJsonLd` nên `</script>` trong nội dung không đóng thẻ sớm. */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, index) => (
        <script key={index} type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }} />
      ))}
    </>
  );
}
