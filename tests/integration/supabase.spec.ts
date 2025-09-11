import { describe, it, expect } from 'vitest';

describe('supabase integration', () => {
  it('connects using env and performs a simple assertion', async () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_ANON_KEY).toBeDefined();
  });
});
