# Contributing

## Prerequisites

- Node.js 24 or higher
- pnpm 10.32.1 or higher

## Setup

```bash
# Install dependencies
pnpm install

# Run database migrations (required on first setup)
pnpm migrate:dev

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`.

## Database

This application uses **PGlite** (WebAssembly PostgreSQL) for local development:

- Database is automatically created in `.pgdata/` directory
- Migrations are located in `migrations/` directory
- Run `pnpm migrate:dev` to execute pending migrations
- Stores OAuth session state, user profiles, and community data

**Debug the database:**

```bash
# Start the socket server (for external PostgreSQL clients)
pnpm pglite:server

# Connect using psql
PGSSLMODE=disable psql -h localhost -p 5432 -d postgres
```

## Available Scripts

| Command               | Description                                |
| --------------------- | ------------------------------------------ |
| `pnpm dev`            | Start development server                   |
| `pnpm build`          | Build for production                       |
| `pnpm preview`        | Preview production build                   |
| `pnpm format`         | Format code with Prettier                  |
| `pnpm check`          | Run TypeScript and Svelte type checks      |
| `pnpm test`           | Run unit tests                             |
| `pnpm migrate:dev`    | Run database migrations (development)      |
| `pnpm migrate:prod`   | Run database migrations (production)       |
| `pnpm seed`           | Seed database with sample data             |
| `pnpm generate-jwk`   | Generate OAuth private key for AT Protocol |
| `pnpm lexicons:build` | Build AT Protocol lexicon types            |
| `pnpm pglite:server`  | Start PGlite socket server for debugging   |

## AT Protocol Setup

To enable AT Protocol authentication locally:

```bash
# Generate a private key for OAuth
pnpm generate-jwk

# Copy the output and add to your environment
```

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Required for production
BASE_URL=https://your-site.netlify.app
PRIVATE_KEY=your-generated-jwk-private-key
SESSION_PASSWORD=secure-random-string-for-cookie-signing

# Required for local development (uses loopback mode if PRIVATE_KEY not set)
DEV=true

# Required for production database
CONNECTION_STRING=postgresql://user:pass@host:5432/database
```

**Variable Descriptions:**

- `BASE_URL` - Your site's public URL (used for OAuth redirects)
- `PRIVATE_KEY` - JWK private key for AT Protocol OAuth (generate with `pnpm generate-jwk`)
- `SESSION_PASSWORD` - Secure random string for signing session cookies
- `DEV` - Set to `true` for local development (enables loopback OAuth mode)
- `CONNECTION_STRING` - PostgreSQL connection string for production database

## Technology Stack

- **Framework:** SvelteKit 2.x with Svelte 5 (runes-based reactivity)
- **Language:** TypeScript (strict mode)
- **Database:** PGlite (local) / PostgreSQL (production) with Kysely query builder
- **Authentication:** AT Protocol (Bluesky) OAuth
- **Styling:** Custom CSS with CSS variables (dark mode default)
- **Testing:** Vitest
