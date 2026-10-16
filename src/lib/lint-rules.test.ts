import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// Chứng minh luật chặn lucide-react hoạt động (shadcn CLI mặc định sinh import lucide-react).
async function lint(code: string) {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath: "src/components/ui/sample.tsx" });
  return result!.messages.filter((m) => m.ruleId === "no-restricted-imports");
}

// Timeout riêng: ESLint programmatic nạp config lần đầu khá chậm khi chạy song song với project khác.
describe("ESLint: chặn lucide-react", { timeout: 30_000 }, () => {
  it("báo lỗi khi import lucide-react", async () => {
    const messages = await lint('import { X } from "lucide-react";\nexport const a = X;\n');
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain("Phosphor");
  });

  it("báo lỗi khi import subpath lucide-react/dynamic", async () => {
    const messages = await lint('import { DynamicIcon } from "lucide-react/dynamic";\nexport const a = DynamicIcon;\n');
    expect(messages).toHaveLength(1);
  });

  it("cho phép import icon qua @/components/icons", async () => {
    const messages = await lint('import { X } from "@/components/icons";\nexport const a = X;\n');
    expect(messages).toHaveLength(0);
  });
});
