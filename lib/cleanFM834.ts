// lib/cleanFm834.ts

export function isBoilerplate(line: string) {
    const s = (line ?? "").trim();
    return (
        /^FM Global Property Loss Prevention Data Sheets/i.test(s) ||
        /^8-34\s+Protection for Automatic Storage/i.test(s) ||
        /^Protection for Automatic Storage\s+8-34/i.test(s) ||
        /^©\d{4}[-–]\d{4}\s+Factory Mutual Insurance Company/i.test(s) ||
        /^Page\s+\d+\b/i.test(s)
    );
}

export function looksLikeRevisionHistory(line: string) {
    const s = (line ?? "").trim();
    return (
        /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\./
            .test(s) ||
        /^[A-Z]\.\s/.test(s)
    );
}

export function cleanBlocks(raw: any[]) {
    // 1) remove boilerplate + revision lines
    let blocks = (raw || []).filter((b) => {
        const t = typeof b?.text === "string" ? b.text : "";
        if (!t) return false;
        if (isBoilerplate(t)) return false;
        if (looksLikeRevisionHistory(t)) return false;
        return true;
    });

    // 2) keep only the first heading within the section
    let seenHeading = false;
    blocks = blocks.filter((b) => {
        if (b.block_type === "heading") {
            if (seenHeading) return false;
            seenHeading = true;
        }
        return true;
    });

    // 3) stable sort
    blocks.sort(
        (a, b) =>
            (a.ordinal ?? 0) - (b.ordinal ?? 0) ||
            (a.page_start ?? 0) - (b.page_start ?? 0) ||
            String(a.text).localeCompare(String(b.text)),
    );

    return blocks;
}

// Also export default so either import style works
export default cleanBlocks;
