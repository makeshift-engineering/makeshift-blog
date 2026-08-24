import { config, collection, fields } from "@keystatic/core";

const isProd = process.env.NODE_ENV === "production";

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
        // Author fields have no default — the editor must fill them in.
        // In GitHub mode, these should match the logged-in user.
        author: fields.text({
          label: "Author",
          description: "Your display name (e.g. Rahul Chakraborty)",
          validation: { isRequired: true },
        }),
        authorGithub: fields.text({
          label: "Author GitHub Username",
          description:
            "Your GitHub username (e.g. rahulc0dy). Used for your avatar.",
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
