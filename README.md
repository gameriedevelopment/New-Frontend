# Gamerie Frontend Revamp

Ground-up frontend rebuild for Gamerie, organized as separate public website, authenticated product, and operations applications.

```text
frontend-revamp/
├── website/                 # Public marketing and brand website
├── app/                     # Authenticated Gamerie product
├── admin/                   # Standalone Gamerie operations application
└── private-notes/           # Project context and implementation plan
```

The existing `/Users/mac/work/gamerie/frontend` remains the behavior reference. Its JSX, components, and UI styling are not the implementation base for this rebuild. Hooks, API clients, schemas, types, stores, integrations, and other non-UI behavior are ported only when the owning feature reaches implementation.

## Commands

The three projects are intentionally standalone. Run commands inside the project you are working on:

```bash
cd website
npm install
npm run dev

cd ../app
npm install
npm run dev

cd ../admin
npm install
npm run dev
```

Each project owns its package manifest, lockfile, environment contract, build, tests, and deployment configuration. Their design foundations follow the same documented brand contract but are local to each project.
