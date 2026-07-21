# Contributing to Luna

Thank you for your interest in contributing. This document covers everything you need to get started.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| Yarn | ≥ 1.22 (classic) |
| TypeScript | ≥ 5 (installed via devDependencies) |

## Repository layout

```
luna/
├── packages/
│   ├── core/             # DI container, module system, lifecycle hooks
│   ├── common/           # LunaFactory, decorators, middleware pipeline
│   ├── platform-express/ # HTTP adapter (Express)
│   ├── platform-ws/      # WebSocket adapter (ws)
│   └── testing/          # Testing utilities
├── examples/
│   └── http-and-ws/      # Working example — HTTP + WebSocket
└── tests/                # Scratch / manual test files
```

This is a **Yarn workspaces** monorepo. All packages live under `packages/` and share a single `node_modules` at the root.

## Setup

```bash
git clone https://github.com/ariusxi/luna.git
cd luna
yarn install
yarn build
```

Build order matters: `core → common → platform-express → platform-ws → testing`. The root `yarn build` script handles this automatically.

## Running tests

```bash
# all packages
yarn test

# single package
yarn workspace @lunafw/core test
yarn workspace @lunafw/common test
yarn workspace @lunafw/platform-express test
yarn workspace @lunafw/platform-ws test
yarn workspace @lunafw/testing test

# with coverage
yarn test:coverage
```

## Running the example

```bash
cd examples/http-and-ws
yarn install
yarn start
```

> The example uses `ts-node`, not `tsx`. `tsx` is built on esbuild which does not emit `emitDecoratorMetadata`, breaking reflect-metadata-based DI. Always use `ts-node` (or compile with `tsc`) when running Luna applications locally.

## Making changes

1. **Edit source files** under `packages/<pkg>/src/`.
2. **Rebuild** the affected package (and any that depend on it) before running tests:
   ```bash
   yarn workspace @lunafw/common build
   ```
3. **Add or update tests** — every new feature or bug fix must be covered.
4. **Run the full test suite** before opening a PR.

### Adding a new package

1. Create `packages/<name>/` with the same structure as an existing package (`src/`, `tests/`, `package.json`, `tsconfig.json`, `rollup.config.mjs`, `jest.config.js`).
2. Add a `.releaserc.json` (copy from an existing package).
3. Add the package to the root `yarn build` script in the correct dependency order.
4. Add a release step in `.github/workflows/release.yml`.

## Commit conventions

Luna follows [Conventional Commits](https://www.conventionalcommits.org/). Releases are automated via `semantic-release` so commit messages directly drive version bumps and changelogs.

| Prefix | Effect |
|--------|--------|
| `feat:` | Minor version bump |
| `fix:` | Patch version bump |
| `docs:` | No version bump |
| `chore:` | No version bump |
| `BREAKING CHANGE:` (footer) | Major version bump |

Examples:

```
feat: add @SetMetadata decorator and Reflector class
fix: skip non-HTTP events in ExpressAdapter.listen()
docs: add CONTRIBUTING guide
```

## Pull requests

- Open PRs against `main`.
- Keep changes focused — one feature or fix per PR.
- Include tests. PRs without tests for new behaviour will not be merged.
- Update the relevant `README.md` if the public API changes.

## License

By contributing you agree that your changes will be released under the [MIT License](./LICENSE).
