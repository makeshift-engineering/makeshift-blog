import { config, collection, fields } from "@keystatic/core";

export default config({
  storage: {
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
          directory: "src/content/blog",
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
