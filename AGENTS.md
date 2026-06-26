# AGENTS.md

## Project Context

This is a local LongStay application repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup and how to run the frontend.

## Local App Notes

This project now uses a built-in local mock client instead of Base44 backend services.

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: local mock client for auth and data.
- `vite.config.js`: Vite config for the local frontend.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- Use `npm install` and `npm run dev` to run the app locally.
- There is no Base44 backend required for local development.
- The local client stores state in browser localStorage.
- Run the relevant checks from `package.json` before finishing code changes.
