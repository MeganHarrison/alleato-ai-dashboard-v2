// Note: @vercel/postgres not installed. This functionality is disabled.
// import { sql } from '@vercel/postgres';

export async function searchBlocksAndRules(q: string) {
  // Placeholder - Vercel Postgres functionality disabled
  throw new Error('Vercel Postgres is not available. Please install @vercel/postgres package.');
  
  /*
  const exact = await sql`
    with qry as (
      select plainto_tsquery('english', ${q}) as q
    )
    select b.id, b.section_id, s.number, s.title, ts_rank(to_tsvector('english', coalesce(b.source_text,'')), qry.q) as rank
    from blocks b
    join sections s on s.id = b.section_id,
         qry
    where to_tsvector('english', coalesce(b.source_text,'')) @@ qry.q
    order by rank desc
    limit 50;
  `;

  // TODO: add vector search re-rank using pgvector similarity
  // TODO: query protection_rules with facet parsing from the query string
  return exact.rows;
  */
}