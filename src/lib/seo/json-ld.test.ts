import { describe, expect, it } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  buildOrganizationJsonLd,
  buildRealEstateListingJsonLd,
  serializeJsonLd,
} from "./json-ld";

describe("json-ld", () => {
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
          location: "Hà Nội",
        }),
      ),
    ).toMatchInlineSnapshot(`
      {
        "@context": "https://schema.org",
        "@type": "JobPosting",
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
          },
        },
        "title": "Sales",
        "url": "https://x.test/tuyen-dung/sales",
        "validThrough": "2026-11-01",
      }
    `);
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
