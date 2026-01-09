import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Ensure no emojis in code
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/[\\u{1F300}-\\u{1F9FF}]/u]",
          message: "Emojis are not allowed. Use Unicode symbols or SVG instead.",
        },
      ],
      // Security: no dangerouslySetInnerHTML with user input
      "react/no-danger": "warn",
    },
  },
];

export default eslintConfig;

