# Blog Posts

Blog posts are stored as MDX files in the `content/blog/` folder. Each post is automatically discovered and listed on the blog page.

## Adding a New Post

1. **Create a new `.mdx` file** in `content/blog/` with a descriptive filename (e.g., `my-new-post.mdx`)
   - The filename becomes the URL slug (e.g., `/blog/my-new-post`)

2. **Add frontmatter** at the top of the file with metadata:

```mdx
---
title: Your Post Title
excerpt: A one-sentence summary of the post.
author: Your Name or Editorial Desk
date: 2026-06-15
readMinutes: 5
tag: Category Name
---

## Your Content Here

Write your post in Markdown below the frontmatter.
```

3. **Frontmatter fields:**
   - `title` (required): Post title
   - `excerpt` (required): One-line summary, shown in blog list
   - `author`: Author name or desk
   - `date`: ISO date format (YYYY-MM-DD)
   - `readMinutes`: Estimated read time in minutes
   - `tag`: Category or topic tag

4. **Save the file** — the blog page will automatically pick it up and sort posts by date (newest first)

## Markdown Features

Posts support full Markdown syntax:
- Headings: `## Heading 2`, `### Heading 3`, etc.
- Bold/italic: `**bold**`, `*italic*`
- Lists: `- item`, numbered lists with `1.`
- Code blocks: `` ` `` inline `` ` `` or ` ``` ` fenced
- Blockquotes: `> quote`
- Links: `[text](url)`

## Example Post

See `how-we-rank-the-wire.mdx` for a complete example.
