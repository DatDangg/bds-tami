import { describe, expect, it } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  buildOrganizationJsonLd,
  buildRealEstateListingJsonLd,
  buildServiceJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd,
} from "./json-ld";

describe("json-ld", () => {
  it("WebSite: tên, URL gốc theo ngôn ngữ, inLanguage", () => {
    expect(buildWebSiteJsonLd({ locale: "en", name: "TAMI", siteUrl: "https://x.test/en" })).toEqual({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "TAMI",
      url: "https://x.test/en",
      inLanguage: "en",
    });
  });

  it("BreadcrumbList: position từ 1, URL tuyệt đối", () => {
    const data = buildBreadcrumbJsonLd(
      [
        { label: "A", href: "/a" },
        { label: "B", href: "/a/b" },
      ],
      "https://x.test",
    );
    expect(data.itemListElement.map((entry) => [entry.position, entry.item])).toEqual([
      [1, "https://x.test/a"],
      [2, "https://x.test/a/b"],
    ]);
  });

  it("Service: provider là Organization, có inLanguage, bỏ trường trống", () => {
    const data = buildServiceJsonLd({
      locale: "en",
      name: "Brokerage",
      url: "https://x.test/en/services/brokerage",
      description: "",
      provider: { name: "TAMI", siteUrl: "https://x.test" },
    });
    expect(data).toMatchObject({ "@type": "Service", name: "Brokerage", inLanguage: "en", provider: { "@type": "Organization", name: "TAMI" } });
    const parsed = JSON.parse(serializeJsonLd(data)) as Record<string, unknown>;
    expect(parsed).not.toHaveProperty("description");
    expect(parsed).not.toHaveProperty("image");
  });

  it("serialize thay < để không đóng thẻ script sớm", () => {
    const text = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(text).not.toContain("<");
    expect(JSON.parse(text)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

/** Qua JSON như khi nhúng vào trang: trường undefined biến mất. */
const asEmitted = (data: unknown) => JSON.parse(serializeJsonLd(data));

describe("json-ld builders (schema.org)", () => {
  it("Organization", () => {
    expect(
      asEmitted(
        buildOrganizationJsonLd({
          name: "TAMI",
          siteUrl: "https://x.test",
          logoUrl: "https://x.test/logo.png",
          sameAs: ["https://facebook.com/tami"],
          telephone: "0900000000",
          email: "a@x.test",
          address: "Hà Nội",
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Hà Nội",
        },
        "email": "a@x.test",
        "logo": "https://x.test/logo.png",
        "name": "TAMI",
        "sameAs": [
          "https://facebook.com/tami",
        ],
        "telephone": "0900000000",
        "url": "https://x.test",
      }
    `);
  });

  it("Organization bỏ trường trống", () => {
    expect(asEmitted(buildOrganizationJsonLd({ name: "TAMI", siteUrl: "https://x.test", sameAs: [], email: "" }))).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "TAMI",
      url: "https://x.test",
    });
  });

  it("RealEstateListing: publisher là Organization (G26); không truyền thì không khai", () => {
    const base = { locale: "vi", name: "A", url: "https://x.test/cho-thue/a" } as const;
    const withPublisher = asEmitted(buildRealEstateListingJsonLd({ ...base, publisher: { name: "TAMI", siteUrl: "https://x.test", logoUrl: "https://x.test/logo.png" } }));
    expect(withPublisher.publisher).toEqual({ "@type": "Organization", name: "TAMI", url: "https://x.test", logo: "https://x.test/logo.png" });
    expect(asEmitted(buildRealEstateListingJsonLd(base))).not.toHaveProperty("publisher");
  });

  it("RealEstateListing có inLanguage và Offer", () => {
    expect(
      asEmitted(
        buildRealEstateListingJsonLd({
          locale: "en",
          name: "Shophouse",
          url: "https://x.test/en/for-rent/a",
          description: "d",
          imageUrls: ["https://x.test/a.jpg"],
          datePosted: "2026-10-01T00:00:00.000Z",
          address: "Hà Nội",
          price: { amount: 1000, currency: "USD" },
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        "contentLocation": {
          "@type": "Place",
          "address": "Hà Nội",
        },
        "datePosted": "2026-10-01T00:00:00.000Z",
        "description": "d",
        "image": [
          "https://x.test/a.jpg",
        ],
        "inLanguage": "en",
        "name": "Shophouse",
        "offers": {
          "@type": "Offer",
          "price": 1000,
          "priceCurrency": "USD",
          "priceSpecification": {
            "@type": "UnitPriceSpecification",
            "price": 1000,
            "priceCurrency": "USD",
            "unitText": "MONTH",
          },
        },
        "url": "https://x.test/en/for-rent/a",
      }
    `);
  });

  it("Article: dateModified rơi về datePublished, publisher có logo", () => {
    expect(
      asEmitted(
        buildArticleJsonLd({
          locale: "vi",
          headline: "Tin",
          url: "https://x.test/tin-tuc/a",
          datePublished: "2026-10-01T00:00:00.000Z",
          authorName: "An",
          publisher: { name: "TAMI", logoUrl: "https://x.test/logo.png" },
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "author": {
          "@type": "Person",
          "name": "An",
        },
        "dateModified": "2026-10-01T00:00:00.000Z",
        "datePublished": "2026-10-01T00:00:00.000Z",
        "headline": "Tin",
        "inLanguage": "vi",
        "mainEntityOfPage": {
          "@id": "https://x.test/tin-tuc/a",
          "@type": "WebPage",
        },
        "publisher": {
          "@type": "Organization",
          "logo": {
            "@type": "ImageObject",
            "url": "https://x.test/logo.png",
          },
          "name": "TAMI",
        },
      }
    `);
  });

  it("JobPosting", () => {
    expect(
      asEmitted(
        buildJobPostingJsonLd({
          locale: "vi",
          title: "Sales",
          url: "https://x.test/tuyen-dung/sales",
          description: "<p>Mô tả</p>",
          datePosted: "2026-10-01",
          validThrough: "2026-11-01",
          employmentType: "FULL_TIME",
          hiringOrganization: { name: "TAMI", siteUrl: "https://x.test" },
          location: { province: "Hà Nội", streetAddress: "1 Phố A" },
          baseSalary: { currency: "VND", minValue: 15_000_000, maxValue: 30_000_000 },
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "VND",
          "value": {
            "@type": "QuantitativeValue",
            "maxValue": 30000000,
            "minValue": 15000000,
            "unitText": "MONTH",
          },
        },
        "datePosted": "2026-10-01",
        "description": "<p>Mô tả</p>",
        "employmentType": "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": "TAMI",
          "sameAs": "https://x.test",
        },
        "inLanguage": "vi",
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "VN",
            "addressLocality": "Hà Nội",
            "addressRegion": "Hà Nội",
            "streetAddress": "1 Phố A",
          },
        },
        "title": "Sales",
        "url": "https://x.test/tuyen-dung/sales",
        "validThrough": "2026-11-01",
      }
    `);
  });

  it("JobPosting: thiếu nơi làm và lương → jobLocation chỉ có quốc gia, không có baseSalary; chỉ một đầu lương vẫn khai", () => {
    const base = {
      locale: "en" as const,
      title: "Intern",
      url: "https://x.test/en/careers/intern",
      description: "<p>x</p>",
      datePosted: "2026-10-01",
      hiringOrganization: { name: "TAMI", siteUrl: "https://x.test" },
    };
    const bare = asEmitted(buildJobPostingJsonLd(base)) as Record<string, unknown>;
    expect(bare.baseSalary).toBeUndefined();
    expect(bare.jobLocation).toEqual({ "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "VN" } });
    expect(bare.inLanguage).toBe("en");
    const onlyMin = asEmitted(buildJobPostingJsonLd({ ...base, baseSalary: { currency: "VND", minValue: 10_000_000 } })) as { baseSalary: { value: Record<string, unknown> } };
    expect(onlyMin.baseSalary.value).toEqual({ "@type": "QuantitativeValue", minValue: 10_000_000, unitText: "MONTH" });
    expect((asEmitted(buildJobPostingJsonLd({ ...base, baseSalary: { currency: "VND" } })) as Record<string, unknown>).baseSalary).toBeUndefined();
  });

  it("escape </script> trong mọi builder", () => {
    const evil = "</script><script>alert(1)</script>";
    const site = "https://x.test";
    const outputs = [
      buildOrganizationJsonLd({ name: evil, siteUrl: site }),
      buildRealEstateListingJsonLd({ locale: "vi", name: evil, url: site }),
      buildArticleJsonLd({ locale: "vi", headline: evil, url: site, publisher: { name: "T" } }),
      buildJobPostingJsonLd({
        locale: "vi",
        title: evil,
        url: site,
        description: evil,
        datePosted: "2026-10-01",
        hiringOrganization: { name: "T", siteUrl: site },
      }),
    ].map(serializeJsonLd);
    for (const text of outputs) expect(text).not.toContain("<");
  });
});
