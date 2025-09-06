import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import systemBlocks from "@/server/prompts/ultimate-pm";
import { client } from "@/server/openai";
import { toolDefinitions, toolRuntime } from "@/server/tools";

const Body = z.object({
    messages: z.array(
        z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
        }),
    ),
    previous_response_id: z.string().optional(),
    projectId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const { messages, previous_response_id, projectId } = parsed.data;

    try {
        // 1) Create a response with tool defs
        const resp = await client.responses.create({
            model: process.env.OPENAI_CHAT_MODEL || "gpt-5",
            input: [
                { role: "system", content: systemBlocks },
                ...messages,
            ],
            reasoning: { effort: "medium" },
            previous_response_id,
            tools: toolDefinitions,
            temperature: 0.2,
            metadata: { projectId },
        });

        // 2) Handle tool calls iteratively until completion
        let result = resp;
        const maxHops = 6;
        for (let hop = 0; hop < maxHops; hop++) {
            const calls = (result?.output || []).filter((o: any) =>
                o.type === "function_call"
            );
            if (!calls?.length) break;

            const toolOutputs: any[] = [];
            for (const call of calls) {
                const name = call.name;
                const args = safeJson(call.arguments);
                const run = (toolRuntime as any)[name];
                if (!run) {
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id: call.call_id,
                        output: JSON.stringify({
                            ok: false,
                            error: `Unknown tool: ${name}`,
                        }),
                    });
                    continue;
                }
                try {
                    const data = await run(args, { projectId });
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id: call.call_id,
                        output: JSON.stringify({ ok: true, data }),
                    });
                } catch (e: any) {
                    toolOutputs.push({
                        type: "function_call_output",
                        call_id: call.call_id,
                        output: JSON.stringify({
                            ok: false,
                            error: e?.message || "tool error",
                        }),
                    });
                }
            }

            // Send tool outputs back to the model
            result = await client.responses.create({
                model: process.env.OPENAI_CHAT_MODEL || "gpt-5",
                previous_response_id: result.id,
                input: toolOutputs,
            });
        }

        // Extract best-effort final text
        const outputText = extractText(result);
        return NextResponse.json({
            id: result.id,
            output_text: outputText,
            output: result.output,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "server error" }, {
            status: 500,
        });
    }
}

function safeJson(x: any) {
    try {
        return JSON.parse(x ?? "{}");
    } catch {
        return {};
    }
}

function extractText(r: any) {
    const msg = (r?.output || []).find((o: any) => o.type === "message");
    const text = msg?.content?.find((c: any) => c.type === "output_text")?.text;
    return text || "";
}
