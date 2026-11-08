# r2sakib.github.io

My portfolio. The site is generated from the JSON files in `content/`.

## Updating the site

1. Edit a file in `content/`. You can do this on github.com with the pencil icon.
2. Commit to `main`.
3. GitHub Actions rebuilds the site. It's live in about a minute.

You never need to touch the HTML.

| To change | Edit |
| --- | --- |
| Name, bio, status, links, stats, accent colour | `content/site.json` |
| Projects | `content/projects.json` |
| Stack | `content/skills.json` |
| Papers | `content/publications.json` |
| Awards and certificates | `content/honors.json` |
| Education and volunteering | `content/education.json` |
| Photo | Replace `public/img/photo.png` |

### JSON rules

- Text goes in double quotes.
- Put a comma between items, but not after the last one.
- To add something, copy an existing entry and change it.
- The order in the file is the order on the page.

If a file has a mistake, the build stops with a message naming the file and line, and the live site stays as it was. On GitHub, you'll find the message in the **Actions** tab.

### Adding a project

Add this to `content/projects.json`:

```json
{
  "title": "My Project",
  "kind": "web",
  "icon": "globe",
  "github": "https://github.com/r2sakib/my-project",
  "description": "What it does in a sentence or two.",
  "tech": [{ "label": "python", "icon": "python" }, "flask"]
}
```

- `github` is optional. When it's there, a GitHub logo button appears beside the title.
- Publications take an optional `link` instead, which turns the paper's title into a link.
- `"featured": true` gives the project the large card.
- In `tech`, a plain string like `"flask"` is a tag with no icon.
- Project numbers, the count beside each heading and the "projects built" stat all update by themselves.

### Other handy things

- **Stats** in `site.json` take `"value"` for a number you type, or `"count"` for one the site works out (`projects`, `publications`, `honors` or `skills`).
- **Links inside text:** write `[verify](https://example.com)`. This works in `bio` and in an honor's `detail`.
- **Hiding a section:** set its file to `[]` and the section and its nav link disappear.
- **Removing the photo:** delete the `photo` line from `site.json` to show your initials instead.

### Icons

An icon name matches a file in `public/icons/`, so `"python"` uses `public/icons/python.svg`. To add one, drop an SVG in that folder and use its filename. SVGs drawn with `currentColor` pick up the accent colour.

## Previewing on your computer

This needs [Node.js](https://nodejs.org) 22 or newer. There's nothing to install.

```bash
npm run dev
```

Open http://localhost:4321. The site rebuilds each time you save a file, so just refresh the page.

## How it works

`src/build.mjs` reads `content/`, checks it, and writes the finished site to `dist/` using `src/template.mjs` and `src/style.css`. `.github/workflows/deploy.yml` runs that on every push to `main` and publishes `dist/` to GitHub Pages. It has no dependencies, and `dist/` is not committed.
