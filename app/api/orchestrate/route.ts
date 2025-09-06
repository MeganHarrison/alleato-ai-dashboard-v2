import { NextResponse } from "next/server"
import { orchestrate, orchestrateAndAggregate } from "@/app/actions/agent-orchestrator"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { query } = await request.json()
    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 })
    }

    const detailed = await orchestrate(query)
    const aggregated = await orchestrateAndAggregate(query)
    return NextResponse.json({ results: detailed, aggregated })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    )
  }
}
