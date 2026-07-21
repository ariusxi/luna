<p align="center">
  <img src="https://raw.githubusercontent.com/ariusxi/luna/main/.github/assets/logo.png" width="160" alt="Luna Logo" />
</p>

<h1 align="center">Luna Framework</h1>

<p align="center">
  A modular, protocol-agnostic backend framework for Node.js.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@lunafw/core" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/core?label=%40lunafw%2Fcore&color=7c3aed" alt="@lunafw/core" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/common" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/common?label=%40lunafw%2Fcommon&color=7c3aed" alt="@lunafw/common" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-express" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-express?label=%40lunafw%2Fplatform-express&color=7c3aed" alt="@lunafw/platform-express" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-ws" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-ws?label=%40lunafw%2Fplatform-ws&color=7c3aed" alt="@lunafw/platform-ws" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/platform-grpc" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/platform-grpc?label=%40lunafw%2Fplatform-grpc&color=7c3aed" alt="@lunafw/platform-grpc" /></a>
  <a href="https://www.npmjs.com/package/@lunafw/testing" target="_blank"><img src="https://img.shields.io/npm/v/@lunafw/testing?label=%40lunafw%2Ftesting&color=7c3aed" alt="@lunafw/testing" /></a>
  <a href="https://github.com/ariusxi/luna/actions" target="_blank"><img src="https://img.shields.io/github/actions/workflow/status/ariusxi/luna/ci.yml?branch=main&label=CI" alt="CI" /></a>
  <a href="https://github.com/ariusxi/luna/blob/main/LICENSE" target="_blank"><img src="https://img.shields.io/npm/l/@lunafw/core" alt="License" /></a>
</p>

---

## Description

Luna is a **protocol-first** backend framework for Node.js built with TypeScript. While most frameworks are designed around HTTP, Luna abstracts the transport layer entirely — every incoming message, whether from HTTP, WebSocket, gRPC, GraphQL, or CQRS, is normalized into a `LunaMessage` and handled the same way.

This means you can build monoliths, microservices, API gateways, and serverless functions with the same codebase, and swap or combine protocols without touching your business logic.

## Philosophy

Most backend frameworks tell you how to structure your application. Luna doesn't. It gives you the infrastructure — dependency injection, a module system, and a protocol abstraction — and stays out of the way.

The core idea is simple: a **handler** receives a **message** and returns a response. An **adapter** decides how to translate any protocol into that contract. Your code never imports from an adapter package. The adapter imports from you.

## Getting Started

Choose the packages you need:

| Package                                                    | Install                                            | Description                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [`@lunafw/core`](./packages/core)                         | `npm install @lunafw/core`                       | Required. DI container, module system, and lifecycle hooks                                     |
| [`@lunafw/common`](./packages/common)                     | `npm install @lunafw/common`                     | Required. `LunaFactory`, `LunaMessage`, decorators, and the full middleware pipeline           |
| [`@lunafw/platform-express`](./packages/platform-express) | `npm install @lunafw/platform-express`           | HTTP adapter built on Express                                                                  |
| [`@lunafw/platform-ws`](./packages/platform-ws)           | `npm install @lunafw/platform-ws`                | WebSocket adapter built on the `ws` library                                                    |
| [`@lunafw/platform-grpc`](./packages/platform-grpc)       | `npm install @lunafw/platform-grpc`              | gRPC adapter (proto-first, unary RPCs) built on `@grpc/grpc-js`                               |
| [`@lunafw/testing`](./packages/testing)                   | `npm install --save-dev @lunafw/testing`         | Testing utilities — DI resolution and in-memory handler dispatch without starting a server     |

## Issues

Please read the [issue reporting guidelines](https://github.com/ariusxi/luna/blob/main/CONTRIBUTING.md) before opening an issue. The issue tracker is exclusively for bug reports and feature requests.

## Support

Luna is an MIT-licensed open source project. If you'd like to support its development, contributions via pull requests are always welcome.

## License

[MIT](./LICENSE)
