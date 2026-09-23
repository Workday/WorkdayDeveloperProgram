# Gallery site

The optional gallery for the Workday Examples Hub, built with Astro and Tailwind and deployed to GitHub Pages by `.github/workflows/deploy-gallery.yml`.

```bash
npm install
npm run dev      # local preview
npm run build    # static output in dist/
```

## How it reads the examples

`src/lib/examples.js` globs every `catalog/*/example.json` and `examples/*/example.json` at build time. There is no manifest to regenerate; a folder shows up as soon as it exists.

## Per-example downloads

`scripts/build-zips.mjs` runs before `dev` and `build` (the `predev` and `prebuild` scripts) and zips every example folder into `public/downloads/<section>/<id>.zip`. Astro copies `public/` into `dist/`, so the same URLs work locally and on Pages.

- Each zip wraps the folder in `<id>/` with `appManifest.json` at its root, includes `README.md`, and leaves out `example.json` (hub metadata only).
- Each zip also gets a generated `SOURCE.md` with the repository, folder, commit, a sparse checkout command, and how to open a pull request. The text lives in `src/lib/gitTrace.js`, shared with the example page.
- `public/downloads/` is generated output and is gitignored. Do not commit it.
