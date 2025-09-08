
# FMDS 8-34 Ingestion (Pilot for Sections §2.2–§2.3)

This script slices **FMDS0834 July 2024.pdf** into **sections** and **blocks** while preserving exact wording. 
It writes JSONL + Markdown so you can seed Supabase (`sections`, `blocks`) or preview as docs pages in Next.js.

## Quick Start

1. Download both files:
   - `ingest_fmds834.py`
   - `README_ingest_fmds834.md` (this file)

2. Run locally (Python 3.10+ recommended). Install dependencies if needed:
   ```bash
   pip install PyPDF2
   ```

3. Execute (pilot on §2.2 and §2.3):
   ```bash
   python ingest_fmds834.py --pdf "FMDS0834 July 2024.pdf" --outdir ./out --sections 2.2 2.3
   ```

4. Check outputs in `./out`:
   - `sections.json` — detected section tree (numbers, titles, pages)
   - `blocks.jsonl` — one JSON per block (section_number, ordinal, type, text, page range)
   - `sections/2-2.md`, `sections/2-3.md` — per-section Markdown (verbatim text)
   - `log.txt` — stats

## Notes

- Headings are recognized by lines like `2.3.6 Title`. If your PDF encodes headings weirdly, adjust `HEADING_RE` in the script.
- Tables/figures are tagged by simple cues (`Table`, `Figure`) so you can refine later.
- Once validated, map blocks to the **Supabase schema** in your canvas doc and extend with table normalization.

