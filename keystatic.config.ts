import { config, collection, fields } from "@keystatic/core";

const isProd = process.env.NODE_ENV === "production";

/**
 * Read a cookie value by name from document.cookie.
 * Returns undefined when running server-side or when the cookie is absent.
 */
function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${name}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default config({
  storage: isProd
    ? {
        kind: "github",
        repo: "makeshift-engineering/makeshift-blog",
      }
    : {
        kind: "local",
      },
  collections: {
    blog: collection({
      label: "Blog Posts",
      path: "src/content/blog/*/",
      slugField: "title",
      entryLayout: "content",
      format: { contentField: "content" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        description: fields.text({
          label: "Description",
          validation: { isRequired: true },
        }),
        // Use datetime with { kind: 'now' } so new posts auto-fill to the
        // current timestamp. The Astro schema coerces these to Date objects.
        publishDate: fields.datetime({
          label: "Publish Date",
          defaultValue: { kind: "now" },
          validation: { isRequired: true },
        }),
        updatedDate: fields.datetime({
          label: "Updated Date",
          description:
            "Leave empty for new posts. Set when making significant edits.",
        }),
        // Author fields default to the authenticated GitHub user's info.
        // The middleware stores ks-gh-name and ks-gh-login cookies after
        // verifying org membership.
        author: fields.text({
          label: "Author",
          description: "Your display name (e.g. Rahul Chakraborty)",
          defaultValue: getCookie("ks-gh-name") ?? "",
          validation: { isRequired: true },
        }),
        authorGithub: fields.text({
          label: "Author GitHub Username",
          description:
            "Your GitHub username (e.g. rahulc0dy). Used for your avatar.",
          defaultValue: getCookie("ks-gh-login") ?? "",
          validation: { isRequired: true },
        }),
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
          directory: "src/content/blog",
          publicPath: "../",
        }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        interactive: fields.checkbox({
          label: "Interactive Post",
          description:
            "Enable if this post contains interactive React components",
          defaultValue: false,
        }),
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
