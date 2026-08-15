import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify";
import keystatic from "@keystatic/astro";

export default defineConfig({
  site: "https://blog.makeshift.pro",
  integrations: [mdx(), react(), sitemap(), keystatic()],
  output: "static",
  adapter: netlify(),
});
