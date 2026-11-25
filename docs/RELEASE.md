# Release checklist

Status: **released** (19 November 2026). The repository is public at
`https://github.com/Meruyert5/apsis` and the console is live at
`https://meruyert5.github.io/apsis/`.

## Artifacts

| Artifact | Path |
| --- | --- |
| Dashboard | `console/dist/index.html` |
| Alert contract | `schema/alert.schema.json` |
| Evidence contract | `schema/evidence.schema.json` |
| Case alert | `cases/01-observed-path/alert.json` |
| Case evidence | `cases/01-observed-path/evidence.json` |
| Penumbra handoff | external: `detection-lab/integrations/apsis/` (Penumbra repo) |

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

Expected: build pass, 5/5 logic tests, 89/89 Python tests, contracts valid, the
ship budget within its JS/CSS/font limits, and no contrast, heading,
control-name, target-size or overflow findings across all eight views at 1440
and 390.

## Repository metadata

Use these exact values so the repository, the package and the site agree.

| Field | Value |
| --- | --- |
| Owner / name | `Meruyert5/apsis` |
| Description | `Route-based AWS IAM escalation analysis with an eight-view read-only console` |
| Homepage | `https://meruyert5.github.io/apsis/` |
| Topics | `aws`, `iam`, `security`, `privilege-escalation`, `graph`, `minimum-cut`, `cloudtrail`, `react`, `threejs` |
| Default branch | `main` |
| License | MIT (code) / brand reserved (`NOTICE.md`) |

## Upload

Completed on 19 November 2026. For reference, the repository was created and
`main` pushed with:

```bash
gh repo create Meruyert5/apsis \
  --public \
  --description "Route-based AWS IAM escalation analysis with an eight-view read-only console" \
  --homepage "https://meruyert5.github.io/apsis/"

git push -u origin main

gh repo edit Meruyert5/apsis \
  --add-topic aws --add-topic iam --add-topic security \
  --add-topic privilege-escalation --add-topic graph \
  --add-topic minimum-cut --add-topic cloudtrail \
  --add-topic react --add-topic threejs
```

Pages is set to **Build and deployment -> Source: GitHub Actions**
(`build_type=workflow`), with HTTPS enforced. The `pages` workflow builds
`console` and uploads `console/dist`; no token, backend or custom domain is
needed. `ci`, `pages` and CodeQL runs for `main` are green, and the site serves
`/`, the fonts, `favicon.svg`, the icon PNGs and `og-dashboard.png` over HTTPS.

## What is not committed

- `console/node_modules/`, `console/dist/`
- `.cdp-*` browser profiles, `.lighthouseci/`, `*.tsbuildinfo`, `*.log`
- `.env`, keys, authorization exports, SARIF and report files

The six screenshots in `docs/img/` are committed because the README uses them.

## Post-deploy checks

Verified on 19 November 2026:

- `https://meruyert5.github.io/apsis/` returns 200 and serves the dashboard shell.
- `og-dashboard.png`, `favicon.svg`, `icon-512.png` and `apple-touch-icon.png` return 200
  with the correct content types.
- The accessibility audit exercised every view at 1440 and 390 before the upload
  (16/16); the live build is the same bundle.
- `#/survey`, `#/path`, `#/atlas`, `#/drift`, `#/commands`, `#/extensions` and
  `#/blueprint` are hash routes on `/`, so they inherit the verified shell.
- Command palette, motion toggle, fullscreen, `Planets` / `Wire`, the Path black
  hole and the Blueprint event horizon were checked locally at release time.
- Reduced motion stops CSS animation and the 3D clock.
- The Penumbra handoff is present at `detection-lab/integrations/apsis/` in the
  Penumbra repository.

## Readiness gate

Pre-upload, all true:

- [x] Legacy console, design-lab mocks and dead images removed; `/` is the only entry.
- [x] CloudTrail overlay, live IAM import, condition and resource-policy evaluation.
- [x] Drift view, CSV ledger, CI accessibility and Lighthouse gates.
- [x] Typography, sharp corners, icon set, motion and Blueprint layout final.
- [x] Build, 5 logic tests, 89 Python tests, contracts, audit gate and Lighthouse pass.
- [x] README, NOTICE, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT and CITATION reviewed.
- [x] Screenshots and repository metadata prepared.

After the upload (19 November 2026):

- [x] Created `Meruyert5/apsis` with the metadata above.
- [x] Pushed `main`; the `ci` run is green (engines, logic, accessibility, Lighthouse).
- [x] Enabled Pages (`build_type=workflow`, HTTPS enforced); the `pages` run is green.
- [x] Opened the live URL and ran the post-deploy checks.
- [x] Marked this file **released**.
- [x] Updated the README **Live demo** section to present tense.
- [x] Changed the Blueprint release copy to live and replaced the pre-publish
      open items with the published repository, Pages and live-import notes.
- [x] Tagged `v0.2.0` and pushed the tag.

## Approval gate

- [x] Owner approved the dashboard direction.
- [x] Owner approved the public repository and Pages URL.
- [x] `git push origin main` was run with explicit permission.
