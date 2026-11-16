# Contributing

Thanks for taking the time to improve Apsis or Apsis.

## Ground rules

- The engine and the console are one repository, but two surfaces. Keep the
  boundary explicit: **Apsis** is the engine; **Apsis** is the console.
- New behaviour is test-first where practical. The engine uses only the Python
  standard library.
- Never commit real account exports, credentials, ARNs, or customer data. The
  fixtures are synthetic by design.
- Preserve the accessibility floor: contrast ≥ 4.5:1, text ≥ 14px, targets ≥ 24px,
  keyboard reachability, visible focus, and reduced-motion parity.
- Keep the design intentional. Read `docs/DESIGN.md` before changing the visual
  system; do not introduce a generic card kit, glow-only hierarchy, or a second
  motion language.

## Engine

```bash
python -m unittest discover -s tests
python -m apsis scan --scenario startup
python -m apsis check --scenario ci-cd
```

Add a scenario fixture when you add an escalation primitive. Cover the new edge,
the route it creates, and the minimum cut in the same pull request.

## Console

```bash
cd console
npm ci
npm run dev
npm run build
npm run verify
npm run audit
```

`verify` exercises the real flows at 1440 and 390; `audit` measures contrast,
heading order, accessible names, and target size. Both use Chrome over the
DevTools protocol; set `CHROME_PATH` if needed.

Regenerate data after an engine change:

```bash
python -m apsis export --all -o console/src/data
python scripts/export_commands.py console/src/data/commands.json
cd console && npm run build
```

## Commit style

Use Conventional Commits, for example:

```text
feat(engine): add a Glue passrole edge
fix(console): keep the atlas table inside its panel
perf(console): pause the survey renderer when it leaves the viewport
docs: clarify the synthetic fixture scope
```

Keep the subject imperative and under 72 characters. Explain the reason in the
body when the change is not obvious.

## Pull requests

- Describe the problem, the change, and the verification you ran.
- Include a screenshot for visual changes.
- Keep unrelated refactors out of the same pull request.
- By contributing, you agree that your code contribution is licensed under the
  repository's MIT licence. The Apsis visual identity remains reserved; see
  `NOTICE.md`.
