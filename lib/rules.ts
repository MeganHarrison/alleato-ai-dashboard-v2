export type RuleFilters = {
  asrs?: ('shuttle'|'mini-load'|'top-loading'|'vertical')[];
  container?: { wall?: 'solid'|'non-solid'; top?: 'open-top'|'closed-top'; material?: 'combustible'|'noncombustible'|'fm-approved-open-top' };
  commodity?: ('Class 1-4'|'Plastics-GroupA'|'Plastics-GroupB')[];
  ceilingHeightFt?: number; // used for proximity ordering
  scheme?: ('ceiling-only'|'ceiling+in-rack')[];
};

export async function findRules(filters: RuleFilters) {
  // Build parameterized SQL dynamically; order by specificity (more filled facets first)
  // and height proximity (abs((min+max)/2 - ceilingHeightFt)).
}