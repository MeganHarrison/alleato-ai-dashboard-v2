import Link from "next/link";
import SearchWidget from "@/components/asrs/SearchWidget";

export default function Page() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">FM Global Data Sheet 8-34</h1>
      <p className="text-gray-700 max-w-2xl">
        Explore the document by section or use the search below to jump straight
        to relevant paragraphs, notes, tables, and figures.
      </p>
      <SearchWidget />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <QuickCard href="/fm-8-34/2-2" title="§2.2 Horizontal-Loading ASRS" />
        <QuickCard href="/fm-8-34/2-3" title="§2.3 Top-Loading ASRS" />
      </div>
    </div>
  );
}

function QuickCard({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="block border rounded-2xl p-4 bg-white shadow-sm hover:shadow"
    >
      <div className="font-semibold">{title}</div>
    </Link>
  );
}
