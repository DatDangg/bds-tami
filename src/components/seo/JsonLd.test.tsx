import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonLd } from "./JsonLd";

describe("JsonLd", () => {
  it("render một script cho mỗi đối tượng và escape </script>", () => {
    const { container } = render(<JsonLd data={[{ name: "</script><b>x" }, { n: 2 }]} />);
    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(2);
    expect(scripts[0]?.innerHTML).not.toContain("</script");
    expect(JSON.parse(scripts[0]?.textContent ?? "")).toEqual({ name: "</script><b>x" });
  });
});
