![WriteFlow Banner](https://socialify.git.ci/Swayam26262/WriteFlow/image?custom_language=Next.js&description=1&font=Raleway&language=1&name=1&owner=1&pattern=Brick+Wall&theme=Dark)

## Blog Platform (Next.js 15 + Neon Postgres)

A full‑stack blog/CMS built with Next.js App Router, React 19, TypeScript, Tailwind CSS, Neon Postgres, and JWT auth. It includes roles (admin/author/reader), rich text editing, media uploads, categories, tags, comments, likes, search, dashboards, and an admin area.

### Tech stack
- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling/UX**: Tailwind CSS 4, Radix UI, shadcn‑style UI components, TipTap rich text editor
- **Database**: Neon (PostgreSQL), SQL migration scripts in `scripts/`
- **Auth**: JWT (httpOnly cookie `auth-token`), bcrypt password hashing
- **Storage**: Vercel Blob for media uploads (optional Cloudinary check route)

### Badges

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=white)
![PostgreSQL (Neon)](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?logo=vercel)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

Tip: To add more shields, paste any badge URL in your README editor (e.g., from shields.io) and press Enter.

## Quick start

### Prerequisites
- Node.js 18.18+ (or 20+)
- A Neon Postgres database URL
- Package manager: npm or pnpm

### 1) Install dependencies
```bash
# with npm
npm install

# or with pnpm
pnpm install
```

### 2) Configure environment
Create `.env.local` in the project root:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# JWT (required)
JWT_SECRET="replace-with-a-secure-random-string"

# Optional — used by a test route to validate config
# CLOUDINARY_URL="cloudinary://<api_key>:<api_secret>@<cloud_name>"

# Optional — required if you use @vercel/blob uploads locally
# BLOB_READ_WRITE_TOKEN="..."
```

Helpers:
- Generate a JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Or run: `node scripts/generate-secret.js`

Notes:
- `setup-env.md` contains a minimal env walkthrough as well.

### 3) Initialize the database
Use the SQL scripts in `scripts/` (run in order):
1. `01-create-tables.sql`
2. `02-seed-data.sql`
3. `03-add-media-table.sql`
4. `04-add-engagement-tables.sql`
5. `create-admin.sql` (creates an admin user)

You can execute these in the Neon Console query editor or via `psql`:
```bash
psql "$env:DATABASE_URL" -f scripts/01-create-tables.sql
psql "$env:DATABASE_URL" -f scripts/02-seed-data.sql
psql "$env:DATABASE_URL" -f scripts/03-add-media-table.sql
psql "$env:DATABASE_URL" -f scripts/04-add-engagement-tables.sql
psql "$env:DATABASE_URL" -f scripts/create-admin.sql
```

Seeded credentials (from `setup-env.md`):
- Admin: `admin@blog.com` / `admin123`
- Author: `author@blog.com` / `author123`

### 4) Run the app
```bash
npm run dev
# or
pnpm dev
```

Then open `http://localhost:3000`.

### Live demo

Deployed URL: https://your-deployment-url.example.com

Replace the URL above with your live deployment.

## Project structure
```
app/
  admin/                                        # Admin UI (protected by middleware)
  api/                                          # Route handlers (REST-like API)
    auth/ {login, logout, me, register}
    posts/ [..., search, my-posts]
    categories/, tags/, comments/, profile/
    media/ {upload, ...}                        # Vercel Blob uploads
    test-*                                      # Health and integration checks
  dashboard/                                    # Author dashboard (protected)
  posts/, category/, tag/                       # Public pages
components/                                     # UI & forms (shadcn/radix)
contexts/                                       # React context (auth provider)
hooks/                                          # Shared hooks
lib/                                            # Server libs: auth.ts, posts.ts, utils.ts
scripts/                                        # SQL migrations and helpers
styles/                                         # Tailwind CSS entry
```

## Features
- **Authentication**: Email/password login, JWT stored as httpOnly `auth-token` cookie
- **Authorization**: Role gates for `admin` and `author` areas via middleware
- **Content**: Posts CRUD, rich text editor (TipTap), scheduled/published/draft
- **Taxonomy**: Categories, tags, slug handling
- **Engagement**: Comments, likes, view tracking
- **Search**: Server-side filtering by query/category/tag with pagination
- **Media**: Image uploads to Vercel Blob with DB metadata
- **Profiles**: Editable profile and social links

## Screenshots / Demo

![Demo 1](https://res.cloudinary.com/df2oollzg/image/upload/v1755154263/32695704-95c9-4b0b-85e1-d8f5096582cf.png)

![Demo 2](https://res.cloudinary.com/df2oollzg/image/upload/v1755154364/4d6aacb6-d3e1-4345-b034-6da483390cef.png)

![Demo 3](https://res.cloudinary.com/df2oollzg/image/upload/v1755154349/bdebe02f-14a1-4fe1-9c50-f3ed54b1603e.png)

## Environment variables
- **Required**
  - `DATABASE_URL`: Neon Postgres connection string
  - `JWT_SECRET`: secret for signing/validating JWTs
- **Optional**
  - `CLOUDINARY_URL`: enables `/api/test-cloudinary` validation route
  - `BLOB_READ_WRITE_TOKEN`: required for local @vercel/blob uploads

## Key routes

Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`

Posts
- `GET    /api/posts` — list/paginate
- `POST   /api/posts` — create (author)
- `GET    /api/posts/[id]` — read
- `PATCH  /api/posts/[id]` — update (author)
- `DELETE /api/posts/[id]` — delete (author)
- `GET    /api/posts/search` — query/category/tag with pagination
- `POST   /api/posts/[id]/comments` — add comment
- `POST   /api/posts/[id]/like` — like/unlike

Taxonomy & Profile
- `GET/POST /api/categories`, `GET/PATCH/DELETE /api/categories/[id]`
- `GET/POST /api/tags`, `GET/PATCH/DELETE /api/tags/[id]`
- `GET/PATCH /api/profile`

Media
- `POST /api/media/upload` — upload image (auth required)
- `GET  /api/media` and `GET/DELETE /api/media/[id]`

Diagnostics
- `GET /api/test-db` — DB connectivity
- `GET /api/test-auth` — auth check
- `GET /api/test-users` — sample data
- `GET /api/test-cloudinary` — parses `CLOUDINARY_URL`

Notes
- Protected areas: `/admin/*` and `/dashboard/*` are guarded by `middleware.ts` which checks for the `auth-token` cookie, while token validity is verified in route handlers.

## Development

Scripts
```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # start production server
npm run lint    # next lint (warnings are ignored in next.config)
```

TypeScript & ESLint
- `strict: true` in `tsconfig.json`
- `next.config.mjs` is set to ignore build-time type and lint errors (adjust for CI)

Styling
- Tailwind CSS 4 via PostCSS plugin; global styles in `app/globals.css` and `styles/globals.css`
- Radix UI + shadcn primitives under `components/ui/`

## Deployment
- Recommended: Vercel with `DATABASE_URL` secret configured
- For media uploads on Vercel, configure the Blob store (and locally set `BLOB_READ_WRITE_TOKEN` if testing uploads)
- Next.js images are set to `unoptimized: true` in `next.config.mjs` by default

## Troubleshooting
- Failed to create posts: ensure `DATABASE_URL` and `JWT_SECRET` are set; run SQL scripts; see `setup-env.md`
- 401 on protected routes: confirm `auth-token` cookie is set after login
- Upload errors: set `BLOB_READ_WRITE_TOKEN` locally; verify DB `media` table is created
- Cloudinary check failing: set valid `CLOUDINARY_URL` or ignore if not used

## License
MIT License.

