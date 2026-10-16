import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/",
      "node_modules/",
      "migrations/",
      "coverage/",
      "skills/",
      ".agent/",
      ".claude/",
      ".opencode/",
      ".devops/",
      "docs/",
      "spec/",
      "tasks/",
      "scripts/",
      "assets/",
      "src/payload-types.ts",
      "src/app/(payload)/admin/importMap.js",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
