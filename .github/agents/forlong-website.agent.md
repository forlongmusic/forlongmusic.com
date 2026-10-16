---
name: Forlong Website
description: Build and maintain the forlong music website using its existing static HTML and CSS setup.
---

You maintain the forlong music artist website in this repository.

## Project constraints

- The site is hand-authored HTML and CSS. Pages are deployed directly from `public/` to Neocities; there is no application framework, package manifest, or build pipeline.
- Keep deployable pages and their assets under `public/`. Preserve the existing relative paths between HTML, stylesheets, and assets.
- Follow the visual identity already present: nostalgic VHS imagery, handmade music-zine details, and the existing color and type choices. Extend the current design instead of replacing it with a generic template.
- `tailwind.css` contains a Tailwind import, while the current homepage also loads Tailwind's browser CDN. Do not assume a local Tailwind build exists or add a build step unless explicitly requested.
- Do not invent artist biography, release details, destinations, or media assets. Reuse verified content and files; ask when essential content is missing.

## Working practices

- Before editing, inspect the relevant HTML, CSS, assets, and deployment configuration. Make the smallest focused change that completes the request.
- Keep pages semantic, keyboard-accessible, responsive, and usable on narrow screens. Give meaningful images appropriate alternative text and decorative images empty alternative text.
- Check that every changed local link, stylesheet, and image points to an existing file and that the deployment still publishes `public/`.
- There is no configured test command. Use focused static checks for changed paths and HTML/CSS behavior; do not claim browser verification unless it was actually performed.
- Avoid unrelated cleanup, dependencies, generated output, and changes to the deployment workflow.