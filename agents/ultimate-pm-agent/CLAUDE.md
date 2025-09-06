# 🏭 OpenAI Agents Factory – Global Orchestration Rules

This document defines the end‑to‑end orchestration workflow for building **AI agents and multi‑agent workflows** using the **OpenAI Responses API** and the **OpenAI Agents SDK** (JS/TS and Python), targeting the **latest GPT‑5 family** and related capabilities. It replaces all Pydantic‑AI specifics with OpenAI‑native primitives and adds first‑class support for **streaming, short‑term & long‑term memory (Supabase),** and a **Next.js + Tailwind CSS** front‑end with tasteful motion.

**Core Philosophy:** Turn high‑level intent (e.g., “I want an agent that triages customer emails and files tasks”) into a **tested, production‑ready agent system** with crisp prompts, reliable tools, robust memory, and a modern UI.

---

## 🎯 Primary Directive

⚠️ **CRITICAL WORKFLOW TRIGGER**: When ANY user request involves creating, building, or developing an AI agent or workflow:

1. **IMMEDIATELY** recognize this as an agent factory request (stop everything else)
2. **MUST** follow Phase 0 first - ask clarifying questions
3. **WAIT** for user responses
4. **THEN** check Archon and proceed with workflow

**Factory Workflow Recognition Patterns** (if user says ANY of these):
- "Build an AI agent that..."
- "Create an agent for..."  
- "I need an AI assistant that can..."
- "Make a Pydantic AI agent..."
- "I want to build a Pydantic AI agent..."
- Any request mentioning agent/AI/LLM + functionality

**MANDATORY Archon Integration (happens AFTER Phase 0):**
1. After getting user clarifications, run `mcp__archon__health_check`
2. If Archon is available:
   - **CREATE** an Archon project for the agent being built
   - **CREATE** tasks in Archon for each workflow phase:
     - Task 1: "Requirements Analysis" (Phase 1 - pydantic-ai-planner)
     - Task 2: "System Prompt Design" (Phase 2A - pydantic-ai-prompt-engineer)
     - Task 3: "Tool Development Planning" (Phase 2B - pydantic-ai-tool-integrator)
     - Task 4: "Dependency Configuration" (Phase 2C - pydantic-ai-dependency-manager)
     - Task 5: "Agent Implementation" (Phase 3 - main Claude Code)
     - Task 6: "Validation & Testing" (Phase 4 - pydantic-ai-validator)
     - Task 7: "Documentation & Delivery" (Phase 5 - main Claude Code)
   - **UPDATE** each task status as you progress:
     - Mark as "doing" when starting the phase
     - Mark as "done" when phase completes successfully
     - Add notes about any issues or deviations
   - **USE** Archon's RAG during implementation for documentation lookup
   - **INSTRUCT** all subagents to reference the Archon project ID
3. If Archon is not available: Proceed without it but use TodoWrite for local tracking

**WORKFLOW ENFORCEMENT**: You MUST:
1. Start with Phase 0 (clarifying questions)
2. Wait for user response before proceeding
3. Then systematically progress through ALL phases
4. Never jump directly to implementation

When you want to use or call upon a subagent, you must invoke the subagent, giving them a prompt and passing control to them.

---
## 🔄 Complete Factory Workflow

### Phase 0: Request Recognition & Clarification
**Trigger Patterns** (activate factory on any of these):
- "Build an AI agent that..."
- "Create an agent for..."
- "I need an AI assistant that can..."
- "Make a Pydantic AI agent..."
- "Develop an LLM agent..."
- Any request mentioning agent/AI/LLM + functionality

**Immediate Action**:
```
1. Acknowledge agent creation request
2. Ask 2-3 targeted clarifying questions (BEFORE invoking planner):
   - Primary functionality and use case
   - Preferred APIs or integrations (if applicable)
   - Output format preferences
3. ⚠️ CRITICAL: STOP AND WAIT for user responses
   - Wait to proceed to step 4 until user has answered
   - Refrain from making assumptions to "keep the process moving"
   - Avoid creating folders or invoke subagents yet
   - WAIT for explicit user input before continuing
4. Only after user responds: DETERMINE AGENT FOLDER NAME (snake_case, e.g., web_search_agent, asana_manager)
5. Create agents/[AGENT_FOLDER_NAME]/ directory
6. Invoke ALL subagents with the EXACT SAME folder name
7. Tell each subagent: "Output to agents/[AGENT_FOLDER_NAME]/"


### Phase 1: Requirements Documentation 🎯
**Subagent**: `ai-planner`
**Trigger**: Invoked after Phase 0 clarifications collected
**Mode**: AUTONOMOUS - Works without user interaction
**Philosophy**: SIMPLE, FOCUSED requirements - MVP mindset
**Archon**: Update Task 1 to "doing" before invoking subagent

```
Actions:
1. Update Archon Task 1 "Requirements Analysis" to status="doing"
2. Receive user request + clarifications + FOLDER NAME + Archon project ID from main agent
3. Analyze requirements focusing on CORE functionality only
4. Make simple, practical assumptions (single model, basic error handling)
5. Create minimal INITIAL.md with 2-3 core features maximum
6. Output: agents/[EXACT_FOLDER_NAME]/planning/INITIAL.md
   ⚠️ CRITICAL: Output to planning/ subdirectory
7. Update Archon Task 1 to status="done" after subagent completes
```

**Quality Gate**: INITIAL.md must include:
- ✅ Agent classification and type
- ✅ Functional requirements
- ✅ Technical requirements
- ✅ External dependencies
- ✅ Success criteria

### Phase 2 — Parallel Component Planning ⚡

Run **2A, 2B, 2C in parallel** and mark each complete independently.

#### 2A — System Prompt & Guardrails

**Deliverable:** `planning/prompts.md`

* Single **system prompt** (100–300 words) + optional dynamic sections (e.g., user tier, locale, brand voice)
* Guardrails (tone, safety constraints, refusal policy, tool‑use policy)
* **Prompt caching** strategy (what to cache, how to chunk)

#### 2B — Tools, Memory & Data Plan

**Deliverable:** `planning/tools.md`

* **Tool spec** (2–5 tools max): names, parameters, inputs/outputs, failure modes
* **Supabase memory plan**

  * **Short‑term**: per‑thread/context state & transcript (for continuity between turns)
  * **Long‑term**: vector memory (RAG) + durable event store
* **Observability**: tracing, logs, and token/cost metrics

#### 2C — Dependencies & Config

**Deliverable:** `planning/dependencies.md`

* Env vars: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (frontend)
* Optional: `TELEMETRY_WRITE_KEY`, third‑party API keys
* SDK versions and model defaults (GPT‑5 variant; fallback mini for non‑critical paths)

---

### Phase 3 — Implementation (OpenAI Responses + Agents SDK)

**Inputs:** All Planning docs (INITIAL, prompts, tools, dependencies)

**Outputs:** Complete agent package under `agents/[agent_name]/` with:

```
agents/[agent_name]/
  src/
    agent.ts              # Agents SDK agent definition (tools, handoffs)
    tools.ts              # Tool implementations (pure functions)
    memory.ts             # Supabase short/long-term memory adapters
    settings.ts           # Config (env, model defaults)
    runner.ts             # Orchestration (Runner usage)
    responses.ts          # Responses API helpers (streaming, structured output)
  tests/
    agent.spec.ts
    tools.spec.ts
  README.md
  .env.example
```

#### Implementation Rules

* **Models:** Default **GPT‑5** (standard) for reasoning; use **mini** for utility; opt into **structured output** when the UI needs typed JSON.
* **Streaming:** Always wire **Responses API streaming** end‑to‑end (server ➜ client) for fast UX.
* **Tools:** Define tools with schemas; prefer **idempotent, single‑purpose** functions; add retries + timeouts.
* **Memory:**

  * **Short‑term**: keep conversation state in Supabase `threads` + `messages` with a rolling window and ephemeral cache in Runner context.
  * **Long‑term**: RAG via Supabase `memories` (vectors) + `memory_events` (facts/actions). Retrieve top‑k, compress, and write **summaries** back.
* **Prompt Caching:** Cache stable system instructions, policies, and schemas (≥1k tokens) to reduce cost/latency. Chunk large prompts.
* **Observability:** Enable tracing + event logs for lifecycle, tool calls, and handoffs.

---

### Phase 4 — Validation & Testing ✅

**Deliverables:**

* `tests/VALIDATION_REPORT.md`
* Unit + contract tests for tools
* Golden transcript tests for the agent (few canonical conversations)
* Load/latency checks for streaming endpoints

**Success Criteria:**

* Requirements in `INITIAL.md` satisfied
* Tool error handling verified
* Memory persistence & retrieval verified
* Front‑to‑back streaming verified in the browser

---

### Phase 5 — Delivery & Documentation 📦

**Deliverables:**

* `README.md` with environment setup, model choices, streaming instructions
* **Next.js** integration notes + component examples
* Rollout plan, release notes, and limitations

---

## 🧠 Memory Architecture (Supabase‑First)

### Tables (minimum viable schema)

* `threads(id, user_id, created_at, metadata)`
* `messages(id, thread_id, role, content, tokens_in, tokens_out, created_at)`
* `memory_events(id, user_id, kind, payload_json, created_at)`
  *Kinds: profile\_fact, preference, task, commitment, summary.*
* `memories(id, user_id, embedding vector, text, tags[], created_at)`
  *Use a pgvector column; store chunk text + metadata.*

### Write Path

1. On each turn, append to `messages` and emit a **compressed summary** every N turns.
2. Extract durable facts (preferences, goals) → `memory_events`.
3. Periodically batch new content → embed and upsert `memories`.

### Read Path

* Build the **short‑term context** from the last N messages + last summary.
* Augment with **RAG** retrieval from `memories` filtered by user + topic tags.
* Provide memory snippets to the LLM via a **Context Builder** (deduplicate, trim, attribute).

---

## 🧰 Tools & Orchestration (OpenAI Agents SDK)

* **Agent Definition:** Instructions + model + tools + handoffs
* **Handoffs:** Route to specialized agents (planner → implementer → validator)
* **Context:** Inject Supabase clients, feature flags, and user profile
* **Structured Output:** Use Zod/JSON schema for typed results when needed
* **Guardrails:** Refusal policy, tool‑use policy, loop prevention

**Factory Sub‑Agents (recommended pattern):**

* `planner_agent` → produces `INITIAL.md`
* `prompt_agent` → produces `prompts.md`
* `tools_agent` → produces `tools.md`
* `deps_agent` → produces `dependencies.md`
* `validator_agent` → generates tests + report

---

## 🖥️ Frontend: Next.js + Tailwind + Motion

* **Transport:** Server Route (Web API Route/Edge Route) that proxies **Responses API streaming** to the browser.
* **UI Patterns:**

  * Token stream rendering with tail‑recursive buffering
  * “Thinking” states with spinners/skeletons
  * **Framer Motion** micro‑interactions (message reveal, tool call chips, memory badges)
  * Copy/Export buttons, retries, and model switcher
* **Accessibility:** Reduce motion toggle, screen‑reader labels, focus ring management.

---

## 🧪 Streaming: Reference Sketch (Node server)

```ts
// app/api/agent/stream/route.ts (Next.js App Router)
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

  // Create a streaming Responses API call
  const response = await openai.responses.stream({
    model: process.env.OPENAI_MODEL ?? 'gpt-5',
    input: body.input,
    tools: body.tools, // optional tool spec
    // response_format / metadata / tool_choice as needed
  })

  // Proxy the SSE/stream to the client
  return new Response(response.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
```

```tsx
// components/AgentChat.tsx (client)
'use client'
import { useEffect, useRef, useState } from 'react'

export function AgentChat() {
  const [messages, setMessages] = useState<string[]>([])
  const controller = useRef<AbortController | null>(null)

  async function send(input: string) {
    controller.current?.abort()
    controller.current = new AbortController()

    const res = await fetch('/api/agent/stream', {
      method: 'POST',
      body: JSON.stringify({ input }),
      signal: controller.current.signal,
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    let buffer = ''
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // parse tokens/chunks per your server framing
      setMessages(m => [...m, buffer])
      buffer = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Framer Motion for animated entries */}
      {messages.map((m, i) => (
        <div key={i} className="rounded-2xl bg-zinc-50 p-3 shadow-sm">
          {m}
        </div>
      ))}
    </div>
  )
}
```

> Swap in **EventSource** if you frame your server as SSE. Animate arrivals with **Framer Motion** (`AnimatePresence`, `motion.div`) and tasteful easing.

---

## 🔐 Configuration & Environments

* Use `.env.example` + `env.ts` for typed env access.
* Default model: `gpt-5` (override per agent). Consider `gpt-5-mini` for fast/cheap utility work.
* Enable **prompt caching** for large, stable instruction blocks and schemas.
* Add **rate limiting** and **circuit breakers** for external tool calls.

---

## 🧭 Validation Playbook

* **Golden conversations**: fixed inputs → expected streamed outputs (prefix/contains checks)
* **Tool contracts**: Zod schema validation on inputs/outputs
* **Memory checks**: write → read → retrieve flow, including RAG relevance @ top‑k
* **Latency budget**: TTFB < 300ms (with streaming), 95p turn < 5s for utility tasks

---

## 📁 Monorepo Structure (suggested)

```
apps/
  web/                 # Next.js UI
    app/
    components/
    lib/streaming/
packages/
  agents/              # Agents SDK source (TS)
  memory/              # Supabase adapters + schemas
  tooling/             # Shared Zod schemas, logging, tracing
agents/
  [agent_name]/        # Concrete agent package
```

---

## 🧷 Quick‑Start Examples

### 1) Web Research Agent

* Tools: Web search, URL fetch + summarize
* Memory: persist last 10 turns + research notes → Supabase
* Output: structured JSON (sources\[], summary, next\_actions\[])

### 2) Database Query Agent

* Tools: Read‑only SQL query, schema introspection
* Memory: cache prior queries + explanations; add glossary terms to long‑term memory
* Output: table preview + human explanation + follow‑ups

> Use **handoffs** to route: `triage → research → summarizer`.

---

## 🛡️ Quality & Safety

* **Guardrails** in system prompt (scope, tone, privacy) + tool‑use policy
* **Input sanitation** for tool parameters; retries with backoff
* **PII handling**: avoid logging raw PII; redact before trace export
* **Secrets**: never log keys; use server‑side secrets only

---

## ✅ Final Checklist

* [ ] `INITIAL.md` captures goals, memory, tools, KPIs
* [ ] Prompts & guardrails in `prompts.md`
* [ ] Tools & memory plan in `tools.md`
* [ ] Config/env in `dependencies.md`
* [ ] Agent implemented with streaming + structured output
* [ ] Supabase memory working (short + long‑term)
* [ ] Tests pass; validation report written
* [ ] Next.js UI streams results with motion
* [ ] README documents setup + tradeoffs

---

## 📈 Continuous Improvement

* Harvest reusable **patterns**: triage routing, summarize‑then‑act, tool+RAG fusion
* Expand **telemetry**: traces for tool calls, memory hits, RAG contribution
* Maintain a **prompt library** with cached segments + AB‑test variants

---

## 📎 Appendix – Minimal Supabase Schema (SQL sketch)

```sql
create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references threads(id) on delete cascade,
  role text check (role in ('user','assistant','tool')),
  content text not null,
  tokens_in int default 0,
  tokens_out int default 0,
  created_at timestamptz default now()
);

create table if not exists memory_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  kind text not null,
  payload_json jsonb not null,
  created_at timestamptz default now()
);

-- Requires pgvector extension
create extension if not exists vector;
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  text text not null,
  tags text[] default '{}',
  embedding vector(1536),
  created_at timestamptz default now()
);
create index if not exists memories_embedding_idx on memories using ivfflat (embedding vector_l2_ops);
```

---

### Notes

* This factory is **OpenAI‑native** (Responses API + Agents SDK), language‑friendly (JS/TS first, Python supported), and **Supabase‑centric** for memory.
* All examples are **streaming‑first** with a modern **Next.js** UI and motion that enhances, not distracts.
