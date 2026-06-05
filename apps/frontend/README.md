# OneTogether Frontend

React + TypeScript + Vite frontend for the OneTogether prototype.

## Role Areas

The app is organized by user-facing interface:

```txt
src/interfaces/public
src/interfaces/responder
src/interfaces/government
```

These are frontend interface areas only. The backend should stay domain-based and use roles/guards for access control.

## Commands

From the repository root:

```bash
npm run dev:web
npm run build
npm run lint
```

From `apps/frontend`:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Local API Proxy

During local development, Vite proxies frontend requests starting with `/api` to:

```txt
http://localhost:3001
```

The backend exposes routes under:

```txt
http://localhost:3001/api
```

## Useful Files

| File | What it does |
|---|---|
| `src/App.tsx` | Main route configuration |
| `src/interfaces/public` | Citizen/public-facing pages |
| `src/interfaces/responder` | Responder/organisation console pages |
| `src/interfaces/government` | Government console pages |
| `src/components/layout` | Shared console layout components |
| `src/components/chakra-ui` | Local Chakra wrapper/re-export components |

## Team Notes

- Keep role-specific page code under `src/interfaces`.
- Reusable UI should go under `src/components`.
- Shared frontend types should live near the feature until they are genuinely reused.
- API calls should target `/api/...` so the dev proxy and production routing can both work.
