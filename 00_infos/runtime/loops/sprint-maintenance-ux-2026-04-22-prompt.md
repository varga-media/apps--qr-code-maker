# Sprint-Prompt: sprint-maintenance-ux-2026-04-22
Derived from: Mega-Loop Blueprint v4.2.0 (2026-04-22)

## Ziel
Maintenance und minor UX-Verbesserungen fuer apps--qr-code-maker ohne Feature-Expansion. Dep-Updates (nur Patch/Minor), Error-Handling fuer alle fetch-Calls (try/catch), Mobile-Viewport-Fix und Download-Dateiname mit Timestamp. Tests von 2 auf 10 ausbauen.

## Plan
Epic 1: Maintenance — Patch/Minor Dep-Updates (npm outdated pruefen, nur sichere Updates), fetch-Calls mit try/catch wrappen (alle relevanten fetch-Aufrufe in Frontend-JS), Mobile-Viewport-CSS-Fix
Epic 2: UX + Tests — Download-Dateiname mit ISO-Timestamp (qrcode-YYYYMMDD-HHMMSS.png), Tests von 2 auf 10 ausbauen (neue Playwright-Tests fuer Error-Handling, Mobile-Viewport, Download-Filename-Format)

## Reihenfolge
1. Pre-flight: git status sauber, Branch feat/maintenance-ux von pre anlegen
2. Truth-Pass: package.json, Hauptseite JS, bestehende Playwright-Tests lesen
3. Epic 1: Dep-Audit → sichere Updates → Error-Handling-Wrapping → Mobile-Viewport-Fix → commit
4. Epic 2: Download-Filename-Timestamp → 8 neue Tests schreiben → gruen → commit
5. Alle Tests laufen (Playwright): npx playwright test oder pytest 87_tests/
6. audit.primary
7. Docs update (llm-context.md Version bump) + commit
8. Branch pushen

## Invarianten
- Keine Major-Version-Updates ohne [ASK]
- Keine neuen Features (nur Maintenance + Minor UX)
- Tests vor jedem Commit gruen
- forbidden_paths: 00_infos/policies/model-aliases.yaml, 00_infos/policies/mega-loop-blueprint.md

## Exit-Criteria
- deps-patch-minor-updated
- fetch-error-handling-all-calls
- mobile-viewport-fixed
- download-filename-timestamp
- tests-from-2-to-10
- tests-green
- audit-primary-pass
