# Release checklist

Status: **ready for upload**. Nothing is pushed until the owner signs off.

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

`origin` already points at `https://github.com/Meruyert5/apsis.git`; the
repository does **not exist yet** (`git ls-remote origin` returns
`Repository not found`). With `gh` authenticated as the owner:

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

Then:

1. Open **Settings -> Pages** and set **Build and deployment -> Source** to
   **GitHub Actions**.
2. Run the `pages` workflow, or let the push trigger it.
3. Confirm `ci` is green (engine tests, logic tests, accessibility gate,
   Lighthouse).
4. The site publishes at `https://meruyert5.github.io/apsis/`.

The workflow builds `console` and uploads `console/dist`. It needs no token, no
backend, and no custom domain.

## What is not committed

- `console/node_modules/`, `console/dist/`
- `.cdp-*` browser profiles, `.lighthouseci/`, `*.tsbuildinfo`, `*.log`
- `.env`, keys, authorization exports, SARIF and report files

The six screenshots in `docs/img/` are committed because the README uses them.

## Post-deploy checks

- `/` shows the eight-view dashboard.
- No 404 on `assets/`, fonts, `favicon.svg`, `icon-512.png`, `apple-touch-icon.png` or `og.png`.
- `#/survey`, `#/path`, `#/atlas`, `#/drift`, `#/commands`, `#/extensions`, `#/blueprint`
  all load directly.
- Command palette (`Cmd/Ctrl+K`), motion toggle and fullscreen work.
- `Planets` / `Wire` changes the instrument on every figure; **Apply cut** on
  Path map shows the black hole; Blueprint shows the black-hole event horizon.
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

After the upload:

- [ ] Create the repository with the metadata above.
- [ ] Push `main` and confirm the `ci` run is green.
- [ ] Enable Pages and confirm the `pages` run is green.
- [ ] Open the live URL and run the post-deploy checks.
- [ ] Mark this file **released** and tick the upload boxes.
- [ ] Update the README **Live demo** sentence to present tense.
- [ ] Change the Blueprint release copy from "ready for upload" to "live" with
      the Pages URL, and mark the upload item done.
- [ ] Tag the release (`git tag -a v0.2.0 -m "Apsis 0.2.0"` and push the tag).

## Approval gate

- [ ] Owner approves the dashboard direction.
- [ ] Owner approves the public repository and Pages URL.
- [ ] `git push origin main` (or the Pages workflow dispatch) is run by the
  owner or with explicit permission.
