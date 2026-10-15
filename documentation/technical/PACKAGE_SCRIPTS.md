Add (or merge) these scripts into your package.json:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:workers": "vitest run tests/workers --environment node"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "vitest": "^2.0.0",
    "typescript": "^5.5.0",
    "eslint": "^9.0.0",
    "jest": "^29.7.0",
    "miniflare": "^3.20240909.0",
    "@cloudflare/workers-types": "^4.20240909.0"
  }
}
```
