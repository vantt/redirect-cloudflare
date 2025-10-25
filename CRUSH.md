# CRUSH.md

## Development Commands

- **Build**: `npm run build` (TypeScript compilation)
- **Test**: `npm run test` (Vitest test runner)
- **Test single file**: `npm test -- <test-file-pattern>` (e.g., `npm test -- redirect-endpoint.test.ts`)
- **Test specific test**: `npm test -- -t "<test-name>"` (e.g., `npm test -- -t "should redirect"`)
- **Dev server**: `npm run dev` (Wrangler local development)

## Code Style Guidelines

- **TypeScript**: ES2022, strict mode enabled, module resolution: Bundler
- **Imports**: Use ES6 imports, group imports by type (external, internal, relative)
- **Formatting**: No explicit formatter configured - follow existing patterns
- **Naming**: camelCase for variables/functions, PascalCase for types/classes
- **Error Handling**: Return error responses with proper HTTP status codes, use try/catch for decoding
- **Framework**: Hono.js for HTTP routing, Cloudflare Workers runtime
- **Testing**: Vitest with describe/it/expect pattern, separate unit and integration tests
- **Validation**: Use Zod for schema validation where needed
- **Headers**: Always set appropriate Content-Type and Cache-Control headers