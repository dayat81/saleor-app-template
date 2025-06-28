# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Saleor App Template** - a Next.js-based boilerplate for building Saleor Apps that extend Saleor e-commerce platform functionality through webhooks, API integrations, and Dashboard extensions.

## Essential Commands

### Development
```bash
pnpm install          # Install dependencies
pnpm dev              # Start development server with debugging (port 3000)
pnpm build            # Build for production
pnpm start            # Start production server
```

### Code Quality
```bash
pnpm lint             # Run ESLint
pnpm check-types      # TypeScript type checking
pnpm test             # Run tests with Vitest
```

### GraphQL & Schema Management
```bash
pnpm generate                        # Run all generation scripts
pnpm generate:app-graphql-types      # Generate GraphQL types from schema
pnpm generate:app-webhooks-types     # Generate webhook types from JSON schema
pnpm fetch-schema                    # Fetch latest Saleor GraphQL schema
```

## Architecture & Key Concepts

### App Structure
- **App Manifest**: Defined in `src/pages/api/manifest.ts` - configures app permissions, webhooks, and Dashboard extensions
- **APL (Auth Persistence Layer)**: `src/saleor-app.ts` - handles storing Saleor API tokens (FileAPL for development, UpstashAPL for production)
- **Webhooks**: Located in `src/pages/api/webhooks/` - handle asynchronous events from Saleor
- **Extensions**: Can be server-side widgets (API endpoints) or client-side widgets (React components)

### GraphQL Integration
- GraphQL schema stored in `graphql/schema.graphql` (Saleor version 3.21)
- Queries/mutations organized in `graphql/` folder by type (queries/, mutations/, fragments/, subscriptions/)
- Types auto-generated in `generated/` folder via GraphQL Codegen
- Uses URQL client for GraphQL operations

### Environment Configuration
- `APL` environment variable controls auth storage method (`file` for dev, `upstash` for production)
- `APP_IFRAME_BASE_URL` and `APP_API_BASE_URL` for Docker/deployment overrides

## Important Development Patterns

### Adding GraphQL Operations
1. Create `.graphql` files in appropriate `graphql/` subdirectory
2. Run `pnpm generate:app-graphql-types` to generate TypeScript types
3. Import generated typed operations from `generated/graphql.ts`

### Creating Webhooks
- Use `@saleor/app-sdk` webhook utilities
- Register webhook in manifest permissions and webhooks array
- Implement handler in `src/pages/api/webhooks/`

### Adding Dashboard Extensions
- Define extensions in manifest based on Saleor version compatibility
- Server widgets: API endpoints returning HTML/data
- Client widgets: React components with iframe embedding

## Code Generation Requirements

Always regenerate types after modifying GraphQL files or webhook schemas:
```bash
pnpm generate
```

The TypeScript server may need time to detect changes after generation.

## Engine Requirements
- Node.js 22.x
- pnpm 10.x  
- Saleor API version 3.21

## Important Integration Rules

- Always verify operations against `graphql/schema.graphql` when integrating with Saleor API
- Place new GraphQL operations in organized folders within `graphql/`
- Commit generated files to repository - they track schema changes
- Use FileAPL for local development, implement UpstashAPL or custom APL for production multi-tenancy