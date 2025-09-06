"use server"

import OpenAI from "openai"

export interface AgentResult {
  agent: string
  output: string
}

async function researchAgent(task: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a helpful research assistant. Provide concise research and cite sources if relevant." },
      { role: "user", content: task },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })
  return res.choices[0]?.message?.content?.trim() || ""
}

async function leadGenerationAgent(task: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You generate B2B sales leads with brief contact details when available." },
      { role: "user", content: task },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })
  return res.choices[0]?.message?.content?.trim() || ""
}

async function copywritingAgent(task: string): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a marketing copywriter. Produce engaging but concise copy." },
      { role: "user", content: task },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })
  return res.choices[0]?.message?.content?.trim() || ""
}

async function notionUpdateAgent(task: string): Promise<string> {
  const notionKey = process.env.NOTION_API_KEY
  const notionPage = process.env.NOTION_PAGE_ID

  if (!notionKey || !notionPage) {
    return "Notion integration not configured."
  }

  const body = {
    parent: { page_id: notionPage },
    properties: {
      title: {
        title: [{ text: { content: "Update" } }],
      },
    },
    children: [
      {
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ text: { content: task } }],
        },
      },
    ],
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${notionKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    return `Failed to update Notion: ${text}`
  }

  return "Notion updated successfully."
}

function selectAgents(request: string): { agent: string; handler: (task: string) => Promise<string> }[] {
  const lower = request.toLowerCase()
  const agents: { agent: string; handler: (task: string) => Promise<string> }[] = []

  if (/(lead|prospect)/.test(lower)) agents.push({ agent: "lead_generation", handler: leadGenerationAgent })
  if (/(copy|write)/.test(lower)) agents.push({ agent: "copywriting", handler: copywritingAgent })
  if (/(notion)/.test(lower)) agents.push({ agent: "notion_update", handler: notionUpdateAgent })
  if (/(research|information|info|learn|find)/.test(lower) || agents.length === 0) {
    agents.push({ agent: "research", handler: researchAgent })
  }
  return agents
}

export async function orchestrate(request: string): Promise<AgentResult[]> {
  const selected = selectAgents(request)
  const results: AgentResult[] = []

  for (const { agent, handler } of selected) {
    try {
      const output = await handler(request)
      results.push({ agent, output })
    } catch (err) {
      results.push({ agent, output: `Error executing ${agent}: ${(err as Error).message}` })
    }
  }

  return results
}

export async function orchestrateAndAggregate(request: string): Promise<string> {
  const results = await orchestrate(request)
  return results.map((r) => `[${r.agent}] ${r.output}`).join("\n\n")
}
