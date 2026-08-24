import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      // Coerce handles both ISO date strings (YYYY-MM-DD) from older posts
      // and ISO datetime strings from Keystatic's fields.datetime.
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string(),
      authorGithub: z.string(),
      category: z.enum([
        "engineering",
        "devlogs",
        "announcements",
        "deep-dives",
      ]),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
      interactive: z.boolean().default(false),
    }),
});

export const collections = { blog };
