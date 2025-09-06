import type { ReactNode } from "react";
// If you want the sidebar TOC now, uncomment the next line and make sure the file exists.
// import Toc from "../../../components/fm834/Toc";

export default function FM834Layout({ children }: { children: ReactNode }) {
  // Start simple to confirm the error goes away.
  // Once it's working, swap the return for the sidebar shell (shown below).
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {children}
    </div>
  );
}

/* AFTER it compiles, you can switch to the shell with a sidebar:

export default function FM834Layout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6 grid grid-cols-12 gap-6">
      <aside className="col-span-3 sticky top-6 h-[calc(100vh-3rem)] overflow-auto border rounded-2xl p-3 bg-white shadow-sm">
        <Toc />
      </aside>
      <main className="col-span-9 min-h-[60vh]">{children}</main>
    </div>
  );
}

*/