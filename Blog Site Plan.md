# blog.makeshift.pro — Astro Blog Site

Build the engineering blog for Makeshift Engineering at `blog.makeshift.pro` using Astro with MDX and interactive islands, maintaining full design consistency with the existing `makeshift.pro` site. Content is managed through Keystatic CMS so that publishing a post requires no manual git operations, while code changes remain gated behind pull request review.

**Runtime/Package Manager**: Bun · **Language**: TypeScript throughout

## Context

- **Goal**: A standalone blog site at `blog.makeshift.pro` — separate repo (`makeshift-blog`), separate Netlify project, CNAME'd to the subdomain.
- **Framework**: Astro (latest, Content Layer API) with MDX for content, React for interactive islands.
- **Inspiration**: samwho.dev (interactive visual essays), devops-daily.com (content hub structure), tracewayapp.com/blog (clean engineering blog).
- **Design**: Must match `makeshift.pro` exactly — same colors, typography, spacing, component patterns. Designed so the shared tokens can later be extracted into `@makeshift/ui`.
- **Publishing model**: Content (text, images, video) is edited and published entirely through the Keystatic editor UI — zero manual git commands for routine posts. New interactive components are code, and are added via the normal PR flow. Only Keystatic's own commits bypass branch protection on `main`; all human pushes, including yours, go through a PR.

---

## User Review Required

All resolved — see decisions below.

| Decision                      | Resolution                                                                                                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Categories**                | `engineering`, `devlogs`, `announcements`, `deep-dives` — keep navigation simple                                                                                                                |
| **Authors**                   | Name displayed on post, clicks through to their GitHub profile (no author pages)                                                                                                                |
| **Newsletter**                | RSS feed only, no email subscribe                                                                                                                                                               |
| **Deployment**                | Netlify (static + 2 SSR routes for Keystatic), Hostinger for DNS (CNAME `blog` → Netlify)                                                                                                       |
| **Interactive**               | Full MDX + React island support, one example LSM-tree component for v1                                                                                                                          |
| **Cross-linking**             | Blog navbar links back to `makeshift.pro` (Projects, About)                                                                                                                                     |
| **Content structure**         | Per-post colocated folders — each post's MDX, images, video, and post-specific interactive components live together in one directory                                                            |
| **CMS / editing**             | Keystatic — local mode for dev, GitHub mode in production via an installed GitHub App                                                                                                           |
| **Publishing access control** | GitHub repository ruleset on `main`: PR required for all human pushes (0 required approvals — self-mergeable, still leaves an audit trail); bypass list scoped to the Keystatic GitHub App only |

---

## Design System (Ported from makeshift.pro)

These are the exact tokens extracted from the live site, which will be placed in a `src/styles/design-tokens.css` file for easy future extraction into `@makeshift/ui`:

### Colors

| Token             | Value       | Usage                  |
| ----------------- | ----------- | ---------------------- |
| `--bg-0`          | `#1a1a1f`   | Page background        |
| `--bg-1`          | `#222228`   | Surface level 1        |
| `--bg-2`          | `#2a2a30`   | Surface level 2        |
| `--bg-3`          | `#35353c`   | Surface level 3        |
| `--bg-card`       | `#242429`   | Card background        |
| `--bg-card-hover` | `#2c2c3280` | Card hover             |
| `--fg-0`          | `#eef0f2`   | Primary text           |
| `--fg-1`          | `#b0b4bc`   | Secondary text         |
| `--fg-2`          | `#7a7e88`   | Muted text             |
| `--fg-3`          | `#52555e`   | Disabled/subtle        |
| `--accent`        | `#92E3A9`   | Primary accent (green) |
| `--accent-hover`  | `#a8ebbe`   | Accent hover           |
| `--accent-glow`   | `#92E3A933` | Accent shadow/glow     |
| `--accent-subtle` | `#92E3A912` | Subtle accent bg       |
| `--accent-fg`     | `#0f1a14`   | Text on accent         |
| `--teal`          | `#5ec4b6`   | Secondary accent       |
| `--teal-subtle`   | `#5ec4b615` | Teal subtle bg         |
| `--border`        | `#ffffff0e` | Border level 1         |
| `--border-2`      | `#ffffff16` | Border level 2         |
| `--border-3`      | `#ffffff22` | Border level 3         |

### Typography

| Token         | Value                                                              |
| ------------- | ------------------------------------------------------------------ |
| `--font-body` | `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif` |
| `--font-mono` | `JetBrains Mono, monospace`                                        |

### Component Patterns

- **Navbar**: Sticky, 64px, frosted glass (`backdrop-filter: blur(16px)`), logo in mono font with accent `.`
- **Section dividers**: `// SECTION_NAME` monospace label, flanked by border lines
- **Cards**: `--bg-card` background, `--border-2` border, hover to `--bg-card-hover` + `--border-3`
- **Buttons**: Primary (accent bg), Outline (transparent + border), Ghost (transparent)

---

## Proposed Changes

### 1. Project Scaffolding

#### [NEW] Project root (`d:\Programming\Projects\makeshift-blog`)

Scaffold via `bun create astro@latest` with:

- **Template**: Empty (full control)
- **TypeScript**: Strict
- **Install deps**: Yes (with Bun)

Then add integrations:

```bash
bunx astro add mdx react sitemap netlify
bun add @astrojs/rss @keystatic/core @keystatic/astro
```

The Netlify adapter is required because Keystatic's admin UI (`/keystatic` and `/api/keystatic/*`) needs server-rendered routes. Everything else — every blog post, category page, RSS feed — stays static/prerendered. Only those two routes opt out.

Final `astro.config.ts`:

```ts
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import netlify from "@astrojs/netlify";
import keystatic from "@keystatic/astro";

export default defineConfig({
  site: "https://blog.makeshift.pro",
  integrations: [mdx(), react(), sitemap(), keystatic()],
  output: "static", // default: everything prerendered
  adapter: netlify(), // only /keystatic + /api/keystatic opt out via `export const prerender = false`
});
```

---

### 2. Design System & Global Styles

#### [NEW] `src/styles/design-tokens.css`

All CSS custom properties from the table above — isolated so it can become `@makeshift/ui/tokens.css` later.

#### [NEW] `src/styles/global.css`

- Import `design-tokens.css`
- Reset/normalize
- Base typography (body, headings, links, code blocks)
- Prose styles for blog content (max-width, line-height, spacing)
- Utility classes matching makeshift.pro patterns
- Syntax highlighting theme (matching the dark palette)
- Responsive breakpoints

---

### 3. Layout & Navigation

#### [NEW] `src/layouts/BaseLayout.astro`

- HTML shell with SEO `<head>` (title, description, OG tags, canonical URL)
- Import global styles + fonts (Inter, JetBrains Mono from Google Fonts)
- Slot for page content

#### [NEW] `src/components/Navbar.astro`

- Sticky frosted-glass header matching makeshift.pro exactly
- Logo: `makeshift.` in mono font → links to `https://makeshift.pro`
- Nav links: Blog (home), Projects (→ makeshift.pro#projects), About (→ makeshift.pro#about), RSS
- "blog" label/badge next to logo to distinguish from main site
- Mobile hamburger menu

#### [NEW] `src/components/Footer.astro`

- Matching makeshift.pro footer style
- Links: makeshift.pro, GitHub, RSS feed
- `// built with obsession · Astro` tagline

---

### 4. Content Collections & Colocated Post Structure

Each post is a self-contained directory. Its MDX, its images, its video, and any interactive component _specific to that post_ all live together — nothing about publishing or editing one post touches any other part of the site.

```
src/content/blog/
├── building-an-lsm-tree/
│   ├── index.mdx
│   ├── LSMTreeVisualization.tsx    ← used only by this post
│   ├── memtable-diagram.png
│   └── compaction-demo.mp4
├── wal-recovery/
│   ├── index.mdx
│   └── wal-diagram.png
└── why-makeshift/
    └── index.mdx
```

#### [NEW] `src/content.config.ts`

(Astro 5 Content Layer convention — lives at `src/`, not `src/content/`.)

```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/index.mdx", base: "./src/content/blog" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      publishDate: z.date(),
      updatedDate: z.date().optional(),
      author: z.string().default("Makeshift Engineering"),
      category: z.enum([
        "engineering",
        "devlogs",
        "announcements",
        "deep-dives",
      ]),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(), // relative path, e.g. ./memtable-diagram.png — auto-optimized
      draft: z.boolean().default(false),
      interactive: z.boolean().default(false), // flag for posts with interactive islands
    }),
});

export const collections = { blog };
```

Notes:

- Matching `**/index.mdx` means the parent folder name becomes the post slug automatically (`building-an-lsm-tree/index.mdx` → slug `building-an-lsm-tree`) — no manual slug field needed.
- Inline images referenced directly in MDX body content (`![diagram](./memtable-diagram.png)`) are resolved and optimized automatically — no extra config beyond the `image()` schema helper for frontmatter fields.
- Video is not auto-optimized, but colocated video files are still importable as assets: `import demoVideo from './compaction-demo.mp4'` → used as `<video src={demoVideo} />`.
- Any file in a post's folder that doesn't match the `**/index.mdx` pattern (a `.tsx`, an image, a video) is invisible to the content collection loader — it's just a file on disk that the post's own MDX imports directly.

#### [NEW] `src/content/blog/` — 3 seed posts

1. `building-an-lsm-tree/index.mdx` — Engineering deep-dive (matches the post already linked from makeshift.pro), with the LSM-tree island embedded
2. `wal-recovery/index.mdx` — Technical post about WAL
3. `why-makeshift/index.mdx` — Announcement/story post

---

### 5. Content Management: Keystatic CMS

#### [NEW] `keystatic.config.ts`

```ts
import { config, collection, fields } from "@keystatic/core";

export default config({
  storage: {
    kind: "github",
    repo: "makeshift-engineering/makeshift-blog",
  },
  collections: {
    blog: collection({
      label: "Blog Posts",
      path: "src/content/blog/*/", // trailing slash → one directory per entry
      slugField: "title",
      entryLayout: "content", // gives the MDX body prominence in the editor UI
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        description: fields.text({ label: "Description" }),
        publishDate: fields.date({ label: "Publish Date" }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Engineering", value: "engineering" },
            { label: "Devlogs", value: "devlogs" },
            { label: "Announcements", value: "announcements" },
            { label: "Deep Dives", value: "deep-dives" },
          ],
          defaultValue: "engineering",
        }),
        tags: fields.array(fields.text({ label: "Tag" }), {
          label: "Tags",
          itemLabel: (props) => props.value,
        }),
        heroImage: fields.image({
          label: "Hero Image",
          directory: "src/content/blog", // colocates alongside the post's index.mdx
          publicPath: "../",
        }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        content: fields.mdx({
          label: "Content",
          options: {
            image: { directory: "src/content/blog", publicPath: "../" },
          },
        }),
      },
    }),
  },
});
```

(Exact `directory`/`publicPath` wildcard resolution to be confirmed against Keystatic's current path-wildcard docs during implementation — placeholder values above, not final.)

#### Setup steps

1. **Local mode first** — run Keystatic against the local dev server (`bun run dev`, visit `/keystatic`) to confirm the schema and folder output look right before wiring up GitHub mode.
2. **Create the GitHub App** — follow Keystatic's GitHub mode setup flow from the local admin UI; it walks through creating the App and gives you the client ID/secret.
3. **Install the App** on the `makeshift-engineering/makeshift-blog` repo only.
4. **Set environment variables** in Netlify: `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`.
5. Switch `storage.kind` to `'github'` (as shown above) for the deployed instance.

#### Publish flow, end to end

Write in the editor at `blog.makeshift.pro/keystatic` (or locally in VS Code, your choice) → toggle `draft: false` → hit Publish → Keystatic's GitHub App commits directly to `main` → Netlify's webhook rebuilds → the post appears, including on the homepage's latest-posts list, automatically. No terminal, no PR, no manual step.

A **new interactive component** (a new `.tsx` file, not just editing existing content) is still a code change — write it, PR it, merge it, same as any other code in the repo. Once it exists, referencing it from a post is content work again.

---

### 6. Repository Access Control: GitHub Ruleset

Replaces classic branch protection. Configured on `makeshift-blog` → Settings → Rules → Rulesets → New branch ruleset targeting `main`:

- **Require a pull request before merging** — `required_approving_review_count: 0` (keeps a PR/audit trail without waiting on a second reviewer for a two-person team)
- **Require status checks to pass** — the CI build check (see `.github/workflows/ci.yml`)
- **Bypass list** — the installed **Keystatic GitHub App only**. Not your personal account, not an admin role.

Effect: every human push to `main` — including your own manual `git push` from VS Code — goes through a PR. Only commits made through Keystatic's authenticated publish flow land directly on `main`. This is a deliberate choice to keep the same rule for everyone except the one automated, narrowly-scoped path; adjust the bypass list to also include your own account later if the friction of self-merging PRs for manual code changes turns out not to be worth it.

---

### 7. Pages

#### [NEW] `src/pages/index.astro` — Blog Home

- Hero section: "From the Blog" title with description, matching the section style from makeshift.pro
- Featured/latest post card (large, with hero image area)
- Grid of recent posts as cards (matching `--bg-card` styling)
- Category filter pills
- "Load more" or pagination
- Latest-posts list is a live query against the collection, not a hand-maintained list:
  ```astro
  ---
  import { getCollection } from "astro:content";
  const posts = (await getCollection("blog", ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf()
  );
  const latest = posts.slice(0, 3);
  ---
  ```
  Every new published post shows up on the next build with zero code changes.

#### [NEW] `src/pages/blog/[...slug].astro` — Post Page

- Full post layout with proper prose styling
- Post header: title, date, author, category badge, read time
- MDX content rendered with `<Content />` — supports interactive React islands imported directly from the post's own folder
- Table of contents sidebar (auto-generated from headings)
- Previous/Next post navigation
- Back to blog link

#### [NEW] `src/pages/categories/[category].astro` — Category Page

- Filtered post list by category
- Category header with description

#### [NEW] `src/pages/categories/index.astro` — All Categories

- Grid of category cards with post counts

#### [NEW] `src/pages/rss.xml.ts` — RSS Feed

- Auto-generated from blog collection using `@astrojs/rss`

---

### 8. Interactive Islands (samwho.dev pattern)

Split by scope: infrastructure that every interactive post reuses stays global; a visualization built for one specific post lives inside that post's own folder.

#### [NEW] `src/components/interactive/InteractiveWrapper.tsx` — global, shared

A React wrapper component reused by every interactive island:

- Intersection observer for `client:visible` lazy loading
- Consistent styling frame (bordered container matching card style)
- Caption/description below the visualization

#### [NEW] `src/content/blog/building-an-lsm-tree/LSMTreeVisualization.tsx` — post-scoped

Example interactive component demonstrating the islands pattern, living alongside the post that uses it rather than in the global components tree:

- Animated visualization of LSM-tree write path (memtable → SSTable → compaction)
- User can click "Write" to add entries, see flush/compaction
- Uses Canvas or SVG with the makeshift color palette
- Imported directly in `building-an-lsm-tree/index.mdx`:
  ```mdx
  import LSMTreeVisualization from './LSMTreeVisualization.tsx';<LSMTreeVisualization client:visible />
  ```

This establishes the pattern for all future interactive content: the component travels with the post, not the codebase.

---

### 9. Blog Components

#### [NEW] `src/components/PostCard.astro`

- Card component for post listings (matches `--bg-card` style)
- Category badge, title, description, date, read time
- Hover animation (border + background shift)

#### [NEW] `src/components/CategoryBadge.astro`

- Pill/badge for categories with color coding

#### [NEW] `src/components/TableOfContents.astro`

- Auto-generated from post headings
- Sticky sidebar on desktop, collapsible on mobile

#### [NEW] `src/components/CodeBlock.astro`

- Custom code block with syntax highlighting theme matching the dark palette
- Copy button, language label
- Optional line highlighting

#### [NEW] `src/components/SectionDivider.astro`

- The `// SECTION_NAME` divider pattern from makeshift.pro

#### [NEW] `src/components/SEOHead.astro`

- Reusable `<head>` component with OG tags, Twitter cards, canonical URLs, JSON-LD

---

### 10. Static Assets

#### [NEW] `public/robots.txt`

#### [NEW] `public/favicon.ico` (copy from makeshift.pro)

---

## Project Structure Summary

```
makeshift-blog/
├── astro.config.ts
├── keystatic.config.ts
├── tsconfig.json
├── package.json
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── content.config.ts
│   ├── content/
│   │   └── blog/
│   │       ├── building-an-lsm-tree/
│   │       │   ├── index.mdx
│   │       │   ├── LSMTreeVisualization.tsx
│   │       │   ├── memtable-diagram.png
│   │       │   └── compaction-demo.mp4
│   │       ├── wal-recovery/
│   │       │   ├── index.mdx
│   │       │   └── wal-diagram.png
│   │       └── why-makeshift/
│   │           └── index.mdx
│   ├── components/
│   │   ├── Navbar.astro
│   │   ├── Footer.astro
│   │   ├── PostCard.astro
│   │   ├── CategoryBadge.astro
│   │   ├── TableOfContents.astro
│   │   ├── CodeBlock.astro
│   │   ├── SectionDivider.astro
│   │   ├── SEOHead.astro
│   │   └── interactive/
│   │       └── InteractiveWrapper.tsx
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   └── PostLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── rss.xml.ts
│   │   ├── blog/
│   │   │   └── [...slug].astro
│   │   └── categories/
│   │       ├── index.astro
│   │       └── [category].astro
│   └── styles/
│       ├── design-tokens.css
│       └── global.css
└── .github/
    └── workflows/
        └── ci.yml
```

---

## `@makeshift/ui` Extraction Path

The design system is structured for easy future extraction:

1. **`design-tokens.css`** → becomes `@makeshift/ui/tokens.css` — all CSS variables
2. **Component patterns** (Navbar, Footer, Cards, Badges, SectionDivider) → become shared Astro/React components
3. **`global.css`** base reset & typography → becomes `@makeshift/ui/base.css`

For now, these live directly in the blog repo. When you create the package, it's a straightforward lift-and-shift.

---

## Deployment

### Netlify

1. Push `makeshift-blog` to `github.com/makeshift-engineering/makeshift-blog`
2. Create a new Netlify site → connect to that repo
3. Build command: `bun run build` | Publish directory: `dist`
4. Set the Keystatic environment variables (see Section 5) in Netlify's site settings
5. In Hostinger DNS: add CNAME record `blog` → `<netlify-site>.netlify.app`
6. In Netlify: add custom domain `blog.makeshift.pro` → auto-provisions SSL
7. Configure the `main` branch ruleset (see Section 6) before the first real post is published

This is fully decoupled from the main `makeshift.pro` deployment — separate repo, separate project, no proxy/middleware needed.

---

## Verification Plan

### Automated

- `bun run build` succeeds with zero errors
- All 3 seed posts render correctly, including the colocated hero image and the LSM-tree island
- RSS feed at `/rss.xml` is valid XML
- Sitemap at `/sitemap-index.xml` generates correctly
- Lighthouse audit: 95+ on all categories (Performance, Accessibility, Best Practices, SEO)

### Manual / Browser

- Visual comparison with makeshift.pro — colors, fonts, spacing, card styles match
- Interactive LSM-tree component loads and responds to interaction
- Navigation works: home → post → category → back
- Mobile responsive at 375px, 768px, 1024px, 1440px
- Dark theme consistency throughout
- Links between blog and main site work correctly

### Content Workflow

- Local Keystatic mode: create a test post, confirm the folder structure it generates matches `src/content/blog/<slug>/index.mdx` with colocated assets
- GitHub mode: confirm login is gated to accounts with repo write access, and that saving a post produces a commit on `main` without opening a PR
- Confirm a plain `git push` to `main` from a normal collaborator account is rejected and redirected into a PR
- Publish a new draft-false post via Keystatic and confirm the homepage's latest-posts section picks it up on the next deploy with no code change
- Add a new post-specific interactive component and confirm it renders only on its own post, with no changes needed anywhere else in the codebase
