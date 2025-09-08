// Force dynamic rendering to reduce memory usage during build
export const dynamic = 'force-dynamic';
export const runtime = "nodejs";
import { readJsonPublic, readJsonlPublic } from "@/lib/serverFiles";
import { cleanBlocks } from "@/lib/cleanFM834";

interface SectionInfo {
  number: string;
  title: string;
  start_page?: number;
  end_page?: number;
}

interface Block {
  ordinal: number;
  section_number: string;
  block_type: string;
  text: string;
  page_start?: number;
}

// Disable static generation to prevent OOM during build
// Pages will be rendered on-demand instead
// export async function generateStaticParams() {
//   const sections = await readJsonPublic<Record<string, SectionInfo>>(
//     "data",
//     "sections.json"
//   );
//   const pilot = Object.keys(sections).filter((k) => k === "2.2" || k === "2.3");
//   return pilot.map((num) => ({ slug: num.replaceAll(".", "-") }));
// }

export default async function SectionPage({
  params,
}: {
  params: { slug: string };
}) {
  const sectionNumber = params.slug.replaceAll("-", ".");
  const sections = await readJsonPublic<Record<string, SectionInfo>>(
    "data",
    "sections.json"
  );
  const info = sections[sectionNumber];
  if (!info) return <div className="text-red-600">Section not found.</div>;

  const allBlocks = await readJsonlPublic("data", "blocks.jsonl");

  // keep only this section's blocks and (safety) within its page window if present
  let blocks = (allBlocks as Block[]).filter((b) => b.section_number === sectionNumber);
  if (Number.isFinite(info.start_page) && Number.isFinite(info.end_page)) {
    blocks = blocks.filter(
      (b) =>
        (b.page_start ?? 0) >= (info.start_page ?? 0) &&
        (b.page_start ?? 0) <= (info.end_page ?? 0)
    );
  }

  // clean & sort
  const cleaned = cleanBlocks(blocks);

  return (
    <article className="prose max-w-none">
      <h1>
        §{info.number} {info.title}
      </h1>
      {/* keep the page span tiny; we’ll remove per-paragraph badges */}
      <div className="not-prose text-xs text-gray-500">
        Pages {info.start_page ?? "?"}–{info.end_page ?? "?"}
      </div>
      <hr className="my-4" />
      <div className="space-y-4">
        {cleaned.map((b) => (
          <BlockComponent key={`b${b.ordinal}`} b={b} />
        ))}
      </div>
    </article>
  );
}

function BlockComponent({ b }: { b: Block }) {
  const id = `b${b.ordinal}`;
  const kind = b.block_type;

  // headings: render as h2/h3 if you like; here we just bold the first heading
  if (kind === "heading") {
    return (
      <section id={id} className="scroll-mt-24">
        <h2 className="mt-8">{b.text.replace(/^\s*\d+(\.\d+)*\s+/, "")}</h2>
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-24">
      {kind === "note" ? (
        <div className="border-l-4 pl-3 italic bg-yellow-50/50 py-2">
          {b.text}
        </div>
      ) : kind === "table" || kind === "figure" ? (
        <div className="p-3 border rounded-xl bg-gray-50">{b.text}</div>
      ) : (
        <p>{b.text}</p>
      )}
      {/* Removed the noisy per-block page badge */}
    </section>
  );
}
