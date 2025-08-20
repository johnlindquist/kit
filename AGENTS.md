# Repository Guidelines

## Project Structure & Modules
- Source: `src/` (ESM TypeScript). Key areas: `api/` (SDK surface), `core/` (internals), `cli/`, `platform/`, `setup/`, `target/`.
- Build scripts: `build/` (tsx/ts scripts used by npm scripts).
- Tests: `src/**/*.test.*`, `test/`, and integration in `test-sdk/`.
- Artifacts: local builds write to `~/.kit` (CI uses `./.kit`).

## Build, Test, and Dev
- Install: `pnpm install` (requires pnpm; Node 22.17.1 via Volta; see `package.json`).
- Build: `pnpm build` or `pnpm build-kit` — compiles and prepares the SDK to `~/.kit`.
- Verify types: `pnpm verify` — TypeScript no‑emit check (also runs on pre‑commit).
- Tests (AVA):
  - All: `pnpm test`
  - Core/API subsets: `pnpm test:core`, `pnpm test:api`, `pnpm test:sdk`
  - Watch/debug: `pnpm ava:watch`, `pnpm ava:debug`
- Coverage: `pnpm coverage` (c8 reports text + HTML).

## Coding Style & Naming
- Language: TypeScript + ESM; prefer `import`/`export`.
- Formatting: `.prettierrc.json` (no semicolons, printWidth 60, arrowParens avoid). Use your editor’s Prettier.
- Filenames: camelCase, kebab-case, or PascalCase (see `biome.json`).
- Indentation: 2 spaces preferred; avoid mixed tabs/spaces.
- Public API lives in `src/api/`; avoid leaking internals from `core/`.

## Testing Guidelines
- Framework: AVA (`test/ava.config.mjs`). Place unit tests alongside code as `*.test.ts` or in `test/`/`test-sdk/` for broader flows.
- Run locally with `pnpm test`; generate coverage with `pnpm coverage`.
- Tests should be deterministic; mock filesystem/network where feasible.

## Commits & Pull Requests
- Conventional Commits via Commitizen: run `pnpm commit`. Example: `feat(api): add kitRun options`.
- Pre-commit runs `pnpm verify`; ensure it passes locally.
- PRs: include a clear description, linked issues, test updates, and any relevant `README.md` or `API.md` notes. CI runs AVA on Windows/macOS/Linux.
- Releases use semantic‑release on branches `main`, `next`, `beta`, `alpha`.

## Security & Configuration
- Env: `.env` supported via `dotenv`/`dotenv-flow`; avoid committing secrets.
- Local linking to Kit App: see `README.md` workspace instructions. Ensure `pnpm` is enabled (`corepack enable pnpm` or Volta).
