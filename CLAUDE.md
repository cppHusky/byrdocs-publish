# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for generating standardized YAML metadata files for the BYRDocs platform. It's deployed on Cloudflare Pages with edge runtime and uses Prisma with Cloudflare D1 database.

## Development Commands

**IMPORTANT**: Always use `pnpm` instead of `npm` for all commands.

```bash
# Development
pnpm dev            # Start Next.js development server (http://localhost:3000)
pnpm preview        # Preview with Cloudflare Pages locally

# Build & Deploy
pnpm build          # Build Next.js application
pnpm cf-build       # Build for Cloudflare Pages with @cloudflare/next-on-pages
pnpm deploy         # Build and deploy to Cloudflare Pages

# Database
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema changes to D1 database

# Code Quality
pnpm lint           # Run ESLint
```

**Testing Code Correctness**: Always use `npx tsc --noEmit` to verify your code changes are correct before considering a task complete. Do NOT rely on `pnpm dev` for testing as it may not catch all build-time errors.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.2.4 with App Router (edge runtime)
- **UI**: Shadcn/ui components (Radix UI + Tailwind CSS)
- **Database**: Prisma ORM with Cloudflare D1
- **Deployment**: Cloudflare Pages
- **File Storage**: AWS S3-compatible storage
- **Validation**: Zod schemas

### Key Directories
- `app/`: Next.js App Router pages
  - `api/`: API routes for file operations
  - `bind/`: GitHub OAuth binding
  - `callback/`: OAuth callback handler
- `components/`: React components
  - `ui/`: Shadcn/ui component library
  - `yaml-generator/`: Main form components
- `lib/`: Utilities and business logic
  - `validate.ts`: Core validation logic
  - `isbn.ts`: ISBN formatting/validation
  - `pinyin.ts`: Chinese pinyin conversion

### Application Flow
1. User selects file type (Book, Test, Doc)
2. User uploads file or pastes BYRDocs URL
3. System validates URL format: `https://byrdocs.org/files/[32-char-md5].[ext]`
4. User fills metadata form with validation
5. System generates YAML with schema references
6. User downloads the generated YAML file

## Critical Business Rules

### URL Validation
- Must match pattern: `https://byrdocs.org/files/[md5].[extension]`
- MD5 hash must be exactly 32 characters
- File extensions: PDF for books/tests, PDF/ZIP for docs

### File Upload
- Uses chunked upload (5MB chunks) to S3
- Calculates MD5 hash client-side
- Maximum file size handled by S3 configuration

### Validation Rules
- ISBN: Supports both ISBN-10 and ISBN-13
- Years: Cannot exceed current year
- Test year range: End year must be start year or start year + 1
- Course names: Fetched from `https://files.byrdocs.org/metadata2.json`

### YAML Generation
- Includes schema references based on file type
- Uses js-yaml for serialization
- Formats with proper indentation and structure

## Development Tips

### When modifying forms
- Check validation logic in `lib/validate.ts`
- Update Zod schemas for type safety
- Test keyboard shortcuts (j/k navigation, Enter to submit)

### When working with file uploads
- File upload logic is in `components/file-upload.tsx`
- S3 operations are in `app/api/s3/` routes
- MD5 calculation happens client-side

### When updating UI components
- Use existing Shadcn/ui components from `components/ui/`
- Follow the established pattern of "use client" directives
- Maintain keyboard navigation support

### Database operations
- Schema is defined in `prisma/schema.prisma`
- Use `pnpm db:generate` after schema changes
- Database bindings are configured in `wrangler.toml`
- **Important**: Always use `getPrismaClient()` from `lib/db.ts` to get Prisma instance
  - This function handles Cloudflare D1 adapter setup
  - It implements singleton pattern for connection reuse
  - Example usage:
    ```typescript
    import { getPrismaClient } from "@/lib/db";
    
    const prisma = getPrismaClient();
    const data = await prisma.file.findMany();
    ```

## Environment Configuration
- Local development uses `.env.local`
- Production uses Cloudflare Pages environment variables
- D1 database binding: `DB`
- Authentication uses cookie-based tokens

## RSC Patterns

- **Always use RSC (React Server Components) and server actions for data fetching**
- **DO NOT USE fetch function to call api endpoints in RSC**
- Client components should import and call server component functions for api
- Server components must use `requireAuth()` from `lib/auth.ts` to validate tokens from cookies
- If no valid token exists, users are automatically redirected to login
- Example usage:
  ```typescript
  // In server component (app/page.tsx)
  import { requireAuth } from "@/lib/auth";
  
  export async function getBooks() {
    await requireAuth(); // Redirects if not authenticated
    const prisma = getPrismaClient();
    return await prisma.book.findMany();
  }
  ```

### Environment Variable Access
- **Always use `getRequestContext()` from `@cloudflare/next-on-pages` for Cloudflare Pages environment variables**
- Never use `process.env` for runtime environment variables in production
- Example usage:
  ```typescript
  import { getRequestContext } from '@cloudflare/next-on-pages';
  
  const env = getRequestContext().env;
  const appId = env.APP_ID;
  ```