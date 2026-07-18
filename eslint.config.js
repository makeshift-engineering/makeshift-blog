import eslintPluginAstro from "eslint-plugin-astro";
import ts from "typescript-eslint";

export default ts.config(
  // Use recommended config from typescript-eslint
  ...ts.configs.recommended,

  // Use recommended config from eslint-plugin-astro
  ...eslintPluginAstro.configs.recommended,

  {
    ignores: ["dist/", ".astro/", "node_modules/", ".netlify/", "bun.lock"],
  }
);
