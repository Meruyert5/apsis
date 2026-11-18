# Release checklist

Status: **ready for approval**. Nothing is pushed until the owner signs off.

## Artifacts

| Artifact | Path |
| --- | --- |
| Dashboard | `console/dist/index.html` |
| Alert contract | `schema/alert.schema.json` |
| Evidence contract | `schema/evidence.schema.json` |
| Case alert | `cases/01-observed-path/alert.json` |
| Case evidence | `cases/01-observed-path/evidence.json` |
| Penumbra handoff | `detection-lab/integrations/apsis/` |

## Preflight

From the repository root:

```bash
npm --prefix console ci
npm --prefix console run build
npm --prefix console run test:logic
python -m unittest discover -s tests -v
python -c "import jsonschema, json; jsonschema.validate(json.load(open('cases/01-observed-path/alert.json')), json.load(open('schema/alert.schema.json'))); jsonschema.validate(json.load(open('cases/01-observed-path/evidence.json')), json.load(open('schema/evidence.schema.json'))); print('contracts valid')"
```

Then run the local audit against the built dashboard:

```powershell
cd console
npm run preview -- --port 4180 --strictPort
$env:BASE_URL='http://localhost:4180/'; npm run audit
```

Expected: build pass, 5/5 logic tests, 89/89 Python tests, contracts valid, no
contrast, heading, control-name, target-size or overflow findings across all
eight views at 1440 and 390.

## GitHub

The intended repository is <https://github.com/Meruyert5/apsis>. `origin` points
there. The default branch is `main`.

The repository does **not exist yet**: `git ls-remote origin` returns
`Repository not found`. Create the empty repository (public, no README) on
GitHub before the first push, or update `origin` to the final URL.

1. Create the repository under the owner account.
2. Push `main` (after approval).
3. Open **Settings -> Pages** and set **Build and deployment -> Source** to
   **GitHub Actions**.
4. Run the `pages` workflow, or let the push trigger it.
5. The site publishes at `https://meruyert5.github.io/apsis/`.

The workflow builds `console` and uploads `console/dist`. It does not need a
token, a backend, or a custom domain.

## What is not committed

- `console/node_modules/`, `console/dist/`
- `.cdp-*` browser profiles and `docs/img` captures
- `.env`, keys, authorization exports, SARIF and report files

## Post-deploy checks

- `/` shows the eight-view dashboard.
- No 404 on `assets/`, fonts, `favicon.svg`, `icon-512.png`, `apple-touch-icon.png` or `og.png`.
- `#/survey`, `#/path`, `#/atlas`, `#/drift`, `#/commands`, `#/extensions`, `#/blueprint`
  all load directly.
- Command palette (`Cmd/Ctrl+K`), motion toggle and fullscreen work.
- Reduced motion stops CSS animation and the 3D clock.
- The Penumbra handoff is present at `detection-lab/integrations/apsis/`.

## Approval gate

- [ ] Owner approves the dashboard direction.
- [ ] Owner approves the public repository and Pages URL.
- [ ] `git push origin main` (or the Pages workflow dispatch) is run by the
  owner or with explicit permission.

