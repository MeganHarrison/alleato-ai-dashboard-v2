# Ultimate PM Agent (GPT‑5 + RAG)

ultimate-pm-agent/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ next.config.mjs
├─ .env.example
├─ .vercelignore
├─ app/
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ api/
│     └─ pm/route.ts
├─ server/
│  ├─ openai.ts
│  ├─ prompts/
│  │  └─ ultimate-pm.ts
│  ├─ tools/
│  │  └─ index.ts
│  └─ repo/
│     ├─ index.ts
│     ├─ search.ts
│     └─ sql/
│        ├─ 00_extensions.sql
│        ├─ 10_schema_core.sql
│        ├─ 20_indexes.sql
│        └─ 30_eval_tables.sql
├─ scripts/
│  ├─ ingest_transcripts.ts
│  └─ eval_harness.ts
└─ components/
   └─ Chat.tsx