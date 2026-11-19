# Deployment

The site is a static Vite build in `console/dist`. It has no server, no runtime
API, no analytics, and no third-party scripts.

The build has one HTML entry: `dist/index.html`, the eight-view dashboard.

## GitHub Pages

The repository ships `.github/workflows/pages.yml`. It builds the console on
every push to `main` and deploys `console/dist` through GitHub Pages. The Apsis
site is live at `https://meruyert5.github.io/apsis/` with HTTPS enforced.

1. Push the repository to GitHub with the default branch named `main`.
2. Open **Settings → Pages** and set **Build and deployment → Source** to
   **GitHub Actions**.
3. Run the `pages` workflow, or push to `main`.
4. The site is published at:

   `https://<owner>.github.io/<repository>/`

All Vite assets are emitted with relative paths (`base: "./"`) and every texture
is resolved through `import.meta.env.BASE_URL`, so a project page under a
subpath works. There is no `<base>` tag and no absolute asset URL.

### Enabling Pages from the CLI

After `gh auth login`:

```bash
gh api --method POST repos/<owner>/<repository>/pages \
  -f build_type=workflow
```

Then push to `main` or run:

```bash
gh workflow run pages.yml
```

## Custom domain

If a custom domain is used, add it under **Settings → Pages → Custom domain**,
create the DNS records GitHub shows, and enable **Enforce HTTPS**. The relative
asset paths continue to work at the domain root.

## Security headers on Pages

GitHub Pages serves the repository's static files and does not allow arbitrary
response headers. The build injects a Content-Security-Policy `<meta>` element:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
base-uri 'none'; form-action 'none'
```

`frame-ancestors`, HSTS, and other response-only directives need a proxy or CDN
in front of Pages. The site itself has no forms, cookies, or network calls.

## Private design, public logic

A GitHub Pages site is public even when its repository is private. Publishing
from a private repository requires a paid plan (GitHub Pro or above), but the
published HTML, CSS, and JavaScript remain downloadable. There is no technical
way to hide served CSS/JS.

If the design must stay out of the public repository, split the project:

- **Public:** `apsis` engine, fixtures, tests, and engine docs.
- **Private:** the Apsis console source, deployed to Pages from the private
  repository (paid plan), or to another static host.

The alternative is a single public repository with **split licensing**: MIT for
functional code and a reserved design/brand notice. That is the option used in
this repository; see `NOTICE.md`.
