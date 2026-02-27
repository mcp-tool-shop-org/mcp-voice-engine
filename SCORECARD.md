# Scorecard

> Score a repo before remediation. Fill this out first, then use SHIP_GATE.md to fix.

**Repo:** mcp-voice-engine
**Date:** 2026-02-27
**Type tags:** `[npm]`

## Pre-Remediation Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 3/10 | SECURITY.md minimal (7 lines), no email/versions/timeline; no threat model in README |
| B. Error Handling | 7/10 | Typed error classes in DSP; not a CLI/MCP/desktop so most items N/A |
| C. Operator Docs | 8/10 | Thorough README + Reference Handbook + docs/; CHANGELOG has 1.0.0 entry |
| D. Shipping Hygiene | 6/10 | Tests + smoke + CI present; sub-package versions at 0.0.x despite CHANGELOG saying 1.0.0 |
| E. Identity (soft) | 10/10 | Logo, translations, landing page, topics all present |
| **Overall** | **34/50** | |

## Key Gaps

1. SECURITY.md minimal — no email, no supported versions table, no response timeline
2. Sub-package versions at 0.0.x — mismatch with CHANGELOG 1.0.0
3. No Security & Data Scope section in README
4. No telemetry statement in README

## Remediation Priority

| Priority | Item | Estimated effort |
|----------|------|-----------------|
| 1 | Rewrite SECURITY.md with full fields | 3 min |
| 2 | Bump sub-package versions to 1.0.0 | 2 min |
| 3 | Add Security & Data Scope + Scorecard to README | 3 min |

## Post-Remediation

| Category | Before | After |
|----------|--------|-------|
| A. Security | 3/10 | 10/10 |
| B. Error Handling | 7/10 | 10/10 |
| C. Operator Docs | 8/10 | 10/10 |
| D. Shipping Hygiene | 6/10 | 10/10 |
| E. Identity (soft) | 10/10 | 10/10 |
| **Overall** | **34/50** | **50/50** |
