import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", ".tsbuild/**", "src/d.ts", "src/lz-string.ts"],
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "no-var": "error",
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
];
