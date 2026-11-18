# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.2.x | yes |
| < 0.2 | no |

## Reporting a vulnerability

Open a **private GitHub security advisory** on the repository. Do not open a
public issue for a vulnerability. Include:

- the affected version or commit;
- a minimal reproduction;
- the impact you believe it has;
- any suggested mitigation.

Expect an acknowledgement within three working days. Please do not include real
AWS credentials, account exports, or customer data in a report; use synthetic
fixtures.

## Scope

Apsis is a read-only analyser. It has no AWS SDK and never calls a mutating API.
The one shell call is the optional AWS CLI import (`apsis import --from-aws`),
which performs a read-only `GetAccountAuthorizationDetails` request. The site is
static: no server, no analytics, no cookies, and no runtime data fetching.

Properties that matter to this project:

- **No writes.** The engine parses policy JSON and prints reports. It does not
  call a mutating AWS API.
- **Offline by default.** Scanning, severing, diffing and exporting are local.
  Only the optional import invokes the AWS CLI, and the site never makes a
  request.
- **Escaped output.** The console renders engine strings through React, never
  through `dangerouslySetInnerHTML`.
- **No secrets in the repository.** The fixtures and bundles are synthetic. Local
  authorization dumps and generated reports are excluded by `.gitignore`.
- **Content Security Policy.** The production build injects a CSP that restricts
  scripts, styles, images, fonts, and connections to the origin.
- **Least privilege in CI.** Workflows default to `contents: read`; Pages and
  CodeQL request only their required scopes.
- **Dependency hygiene.** Dependabot watches npm, pip, and Actions; the console
  build runs `npm audit --omit=dev`.

## Deployment hardening

- Serve the site over HTTPS. GitHub Pages enforces HTTPS.
- GitHub Pages cannot set arbitrary response headers; the CSP is a `<meta>` element.
  Put a proxy/CDN in front of the site if you need HSTS or `frame-ancestors`.
- Review generated SARIF before uploading it anywhere public; it names principals
  and ARNs.
- Treat a real authorization export as sensitive. It describes the shape of an
  account and is useful to an attacker. Keep it out of git.

## Out of scope

Findings that require an attacker to already have write access to the repository,
the CI configuration, or the operator's machine are not vulnerabilities in this
project.

## Disclosure

Please allow time for a fix and a coordinated release before publishing details.
Credit will be given in the release notes unless you ask to remain anonymous.
