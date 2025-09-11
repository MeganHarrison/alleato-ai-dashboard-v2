const NOTION_API_URL = "https://api.notion.com/v1"
const NOTION_VERSION = "2022-06-28"

const token = process.env.NOTION_TOKEN || process.env.NOTION_API_TOKEN

async function notionRequest(path: string, options: RequestInit & { data?: unknown } = {}) {
  if (!token) {
    throw new Error("Notion API token is not set in environment variables")
  }

  const { data, ...fetchOptions } = options

  const res = await fetch(`${NOTION_API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(fetchOptions.headers || {}),
    },
    body: data ? JSON.stringify(data) : fetchOptions.body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Notion API request failed: ${res.status} ${text}`)
  }

  if (res.status === 204) return null

  return res.json()
}

export async function createPage(databaseId: string, properties: unknown) {
  return notionRequest("/pages", {
    method: "POST",
    data: { parent: { database_id: databaseId }, properties },
  })
}

export async function updatePage(pageId: string, properties: unknown) {
  return notionRequest(`/pages/${pageId}`, {
    method: "PATCH",
    data: { properties },
  })
}

export async function createDatabase(parentPageId: string, title: string, properties: unknown) {
  return notionRequest("/databases", {
    method: "POST",
    data: {
      parent: { page_id: parentPageId },
      title: [{ type: "text", text: { content: title } }],
      properties,
    },
  })
}

export async function updateDatabase(databaseId: string, properties: unknown) {
  return notionRequest(`/databases/${databaseId}`, {
    method: "PATCH",
    data: { properties },
  })
}

export { notionRequest }
