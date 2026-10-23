import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/",
      "public/vendor/", // bản chép của thư viện bên thứ ba (scripts/copy-maplibre-worker.mjs)
      "node_modules/",
      "migrations/",
      "seed/scraped/", // dữ liệu/script dev cục bộ, gitignore
      ".import-tmp/", // script/ảnh nhập nội dung một lần, gitignore (bản chính thức: scripts/import-content.ts, BL-072)
      ".local-seed/", // script seed cục bộ, git exclude
      "coverage/",
      "skills/",
      ".agent/",
      ".claude/",
      ".opencode/",
      ".devops/",
      "docs/",
      "spec/",
      "tasks/",
      "tools/vibe-studio/", // dashboard agent (template), có package/tsconfig riêng
      "scripts/",
      "assets/",
      "src/payload-types.ts",
      "src/app/(payload)/admin/importMap.js",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    // Icon chỉ từ Phosphor (qua src/components/icons.ts); shadcn CLI mặc định sinh lucide-react nên phải chặn.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["lucide-react", "lucide-react/*"],
              message: "Dùng Phosphor Icons qua @/components/icons, không dùng lucide-react.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
