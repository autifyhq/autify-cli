import js from "@eslint/js";
import oclif from "eslint-config-oclif";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist",
      "bin",
      "tmp",
      "integration-test/dist",
      "integration-test/bin",
      "**/*.cjs",
    ],
  },
  js.configs.recommended,
  ...oclif,
  prettier,
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "arrow-body-style": "off",
      "n/no-process-exit": "off",
      "no-useless-constructor": "off",
      "object-shorthand": "off",
      "perfectionist/sort-classes": "off",
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-interfaces": "off",
      "perfectionist/sort-intersection-types": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-object-types": "off",
      "perfectionist/sort-objects": "off",
      "perfectionist/sort-union-types": "off",
      "prefer-destructuring": "off",
      "unicorn/prefer-event-target": "off",
      "unicorn/prefer-string-replace-all": "off",
      "unicorn/prefer-top-level-await": "off",
    },
  },
];
