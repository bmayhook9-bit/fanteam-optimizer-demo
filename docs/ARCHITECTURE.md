# Architecture

## Overview
The project is split into a client-side React application and a server-side Express API. Source is written in TypeScript and bundled with Vite, producing a `dist/` directory that the server exposes.

## Client
The client is a React UI built with Vite. During development the code lives in `public/` and is bundled into static assets served by Express. Utilities and shared helpers live in `src/`.

## Server
The Node.js server in `server/` uses Express, JWT-based auth and rate limiting. It serves the API endpoints and hosts the compiled client from `dist/`.

## Build pipeline
`npm run build` compiles TypeScript via `tsc` and bundles the front-end with Vite. The resulting output is written to `dist/`, which the server serves in production.

## Directory structure
- `src/` – Shared utility modules and client-side scripts.
- `server/` – Express server source, routes and models.
- `public/` – Static assets and entry HTML used by the client during development.

## Planned Next.js migration
Future work aims to migrate the project to Next.js for unified routing, server-side rendering and an integrated build system.

## Related documents
- [Transparency](TRANSPARENCY.md)
- [Roadmap](ROADMAP.md)
