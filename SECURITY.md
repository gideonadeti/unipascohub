# Security Policy

## Supported versions

Uni Pasco Hub is actively developed and only the latest version on `main` receives security fixes.

| Version  | Supported |
| -------- | --------- |
| latest `main` | ✅ |
| older releases/tags | ❌ |

## Reporting a vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Preferred options, in order:

1. **GitHub private vulnerability reporting** — use the **"Report a vulnerability"** button in the repository's **Security** tab. This keeps the report confidential and visible only to the maintainer.
2. **Email** — send details to [admin@weamp.org](mailto:admin@weamp.org) with "Uni Pasco Hub security" in the subject line.

## What to include

To help reproduce and fix the issue, please include:

- A clear description of the vulnerability and its impact
- Step-by-step instructions or a proof of concept to reproduce it
- The affected URL(s), endpoint(s), or file(s)
- Any relevant logs, screenshots, or example requests
- Your assessment of severity (optional)

## Scope and safe testing

- Test only against your own local instance — do not test against the production deployment.
- Do not perform attacks that could degrade service for real users (e.g. DoS, spam, or resource-exhaustion attempts).
- Do not access, modify, or exfiltrate data that is not yours.

## Response expectations

This is a small open-source project maintained in spare time. Reports are reviewed as soon as possible, but there is no guaranteed response time. You will be credited in the fix or changelog if you would like to be.
