# Thoughts

A personal journal with an Apple Notes–style layout. It holds two kinds of documents:

- **Notes**: standalone documents. You can pin them.
- **Thoughts**: documents that connect into a graph. You can link them inline with `[[`, or add a manual connection with an optional label from the side panel. Each thought shows its links and backlinks, and `/thoughts/graph` draws the whole graph.

Built with Next.js 16 (App Router), Prisma 7 + PostgreSQL, TipTap, and the Lato font. Login uses email and password, and the server issues a JWT.

## Setup

```bash
cp .env.example .env          # set JWT_SECRET, SEED_EMAIL, SEED_PASSWORD
npm install                   # also runs `prisma generate`
npm run db:up                 # Postgres 16 in Docker
npm run db:migrate            # apply migrations + generate client
npm run db:seed               # create/update the login user from SEED_*
npm run dev
```

The app has no sign-up page. To change the password, edit `SEED_PASSWORD` and run `npm run db:seed` again.

## Auth

`POST /api/auth/login` returns `{ token, user }` and also sets an httpOnly `token` cookie. Every other API route accepts either that cookie or the header `Authorization: Bearer <token>`. `src/proxy.ts` protects the pages and sends signed-out visitors to `/login`. API routes return `401` JSON instead of redirecting.

## API

| Route | Methods |
|---|---|
| `/api/auth/login` · `/api/auth/logout` · `/api/auth/me` | POST · POST · GET |
| `/api/notes?search=` | GET, POST |
| `/api/notes/:id` | GET, PATCH `{content?, title?, pinned?}`, DELETE |
| `/api/thoughts?search=&limit=` | GET, POST |
| `/api/thoughts/:id` | GET (includes `links` and `backlinks`), PATCH `{content?, title?}`, DELETE |
| `/api/thoughts/:id/links` | POST `{targetId, label?}` adds a manual connection |
| `/api/thoughts/:id/links/:linkId` | DELETE removes a manual connection |
| `/api/thoughts/graph` | GET `{nodes, links}` |

The server sanitizes content (HTML). Unless you send a title, it uses the first line of the content as the title and the rest as the list excerpt. Each time a thought's content is saved, its inline edges are rebuilt from the `<a data-thought-id>` elements in the content.

## Layout

```
prisma/schema.prisma          User, Note, Thought, ThoughtLink(kind INLINE|MANUAL)
src/proxy.ts                  page auth guard
src/lib/                      db, jwt, auth, http (withAuth), validators, content (sanitize/title), links
src/lib/services/             notes.ts, thoughts.ts — data access used by both API routes and pages
src/app/api/                  route handlers
src/app/(app)/                notes, thoughts, thoughts/graph pages
src/components/editor/        TipTap editor, [[ thought-link extension, autosave
```
