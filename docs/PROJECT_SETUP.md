# Project Setup Notes

## Initial goals

1. Build slot user flow (spin, result, balance updates, error states).
2. Keep provider engine calls behind a thin adapter.
3. Keep slot math utilities testable and framework-agnostic.

## Suggested first implementation order

1. Define shared domain types in `src/slot/types.ts`.
2. Implement provider adapter in `src/slot/engine/provider-client.ts`.
3. Build state management hook for spin lifecycle.
4. Integrate UI to render reels and outcomes.

## Runtime environments

- Local: mock responses or sandbox engine endpoint.
- Staging: provider sandbox credentials.
- Production: provider production credentials.
