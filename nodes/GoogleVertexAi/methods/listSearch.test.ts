import { modelSearch } from './listSearch';

describe('modelSearch', () => {
  it('returns the full curated list with no filter', async () => {
    const res = await modelSearch.call({} as any);
    expect(res.results.length).toBeGreaterThanOrEqual(5);
    expect(res.results.map((r) => r.value)).toContain('gemini-2.5-flash');
  });
  it('filters case-insensitively by name or id', async () => {
    const res = await modelSearch.call({} as any, 'PRO');
    expect(res.results.every((r) => /pro/i.test(r.name) || /pro/i.test(String(r.value)))).toBe(true);
    expect(res.results.length).toBeGreaterThan(0);
  });
});
