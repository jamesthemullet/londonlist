import { TEMPLATES, getAllTemplateTags, filterTemplatesByTag } from '../../lib/templates';
import type { Template } from '../../lib/templates';

describe('TEMPLATES data', () => {
  it('exports a non-empty array', () => {
    expect(Array.isArray(TEMPLATES)).toBe(true);
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has a unique id', () => {
    const ids = TEMPLATES.map((t) => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has a non-empty name', () => {
    for (const t of TEMPLATES) {
      expect(typeof t.name).toBe('string');
      expect(t.name.length).toBeGreaterThan(0);
    }
  });

  it('every template has a non-empty description', () => {
    for (const t of TEMPLATES) {
      expect(typeof t.description).toBe('string');
      expect(t.description.length).toBeGreaterThan(0);
    }
  });

  it('every template has at least one tag', () => {
    for (const t of TEMPLATES) {
      expect(Array.isArray(t.tags)).toBe(true);
      expect(t.tags.length).toBeGreaterThan(0);
    }
  });

  it('every template has at least one item', () => {
    for (const t of TEMPLATES) {
      expect(Array.isArray(t.items)).toBe(true);
      expect(t.items.length).toBeGreaterThan(0);
    }
  });

  it('every item has a non-empty osm_id and name', () => {
    for (const t of TEMPLATES) {
      for (const item of t.items) {
        expect(typeof item.osm_id).toBe('string');
        expect(item.osm_id.length).toBeGreaterThan(0);
        expect(typeof item.name).toBe('string');
        expect(item.name.length).toBeGreaterThan(0);
      }
    }
  });

  it('every item category is a string or null', () => {
    for (const t of TEMPLATES) {
      for (const item of t.items) {
        expect(item.category === null || typeof item.category === 'string').toBe(true);
      }
    }
  });

  it('osm_ids are unique within each template', () => {
    for (const t of TEMPLATES) {
      const osmIds = t.items.map((i) => i.osm_id);
      const unique = new Set(osmIds);
      expect(unique.size).toBe(osmIds.length);
    }
  });

  it('includes a London Weekend Icons template', () => {
    const found = TEMPLATES.find((t) => t.id === 'london-weekend-icons');
    expect(found).toBeDefined();
    expect(found?.name).toBe('London Weekend Icons');
  });

  it('includes a London Museum Trail template', () => {
    const found = TEMPLATES.find((t) => t.id === 'london-museum-trail');
    expect(found).toBeDefined();
  });

  it('includes a London Food & Drink Trail template', () => {
    const found = TEMPLATES.find((t) => t.id === 'london-food-trail');
    expect(found).toBeDefined();
  });
});

describe('Template type structure', () => {
  it('each template satisfies the Template shape', () => {
    for (const t of TEMPLATES) {
      const typed: Template = t;
      expect(typed.id).toBeDefined();
      expect(typed.name).toBeDefined();
      expect(typed.description).toBeDefined();
      expect(typed.tags).toBeDefined();
      expect(typed.items).toBeDefined();
    }
  });
});

describe('getAllTemplateTags', () => {
  const SAMPLE: Template[] = [
    { id: 'a', name: 'A', description: 'd', tags: ['museums', 'culture'], items: [] },
    { id: 'b', name: 'B', description: 'd', tags: ['food', 'culture'], items: [] },
    { id: 'c', name: 'C', description: 'd', tags: ['parks'], items: [] },
  ];

  it('returns a sorted array of unique tags', () => {
    expect(getAllTemplateTags(SAMPLE)).toEqual(['culture', 'food', 'museums', 'parks']);
  });

  it('returns an empty array for an empty input', () => {
    expect(getAllTemplateTags([])).toEqual([]);
  });

  it('returns all tags from TEMPLATES without duplicates', () => {
    const tags = getAllTemplateTags(TEMPLATES);
    const unique = new Set(tags);
    expect(unique.size).toBe(tags.length);
  });

  it('is sorted alphabetically', () => {
    const tags = getAllTemplateTags(TEMPLATES);
    expect(tags).toEqual([...tags].sort());
  });
});

describe('filterTemplatesByTag', () => {
  const SAMPLE: Template[] = [
    { id: 'a', name: 'A', description: 'd', tags: ['museums', 'culture'], items: [] },
    { id: 'b', name: 'B', description: 'd', tags: ['food', 'culture'], items: [] },
    { id: 'c', name: 'C', description: 'd', tags: ['parks'], items: [] },
  ];

  it('returns all templates when tag is null', () => {
    expect(filterTemplatesByTag(SAMPLE, null)).toHaveLength(3);
  });

  it('returns only templates with the given tag', () => {
    const result = filterTemplatesByTag(SAMPLE, 'culture');
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['a', 'b']);
  });

  it('returns a single template when the tag is unique', () => {
    const result = filterTemplatesByTag(SAMPLE, 'parks');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('returns an empty array when no template has the given tag', () => {
    expect(filterTemplatesByTag(SAMPLE, 'nightlife')).toHaveLength(0);
  });

  it('does not mutate the original array', () => {
    const original = [...SAMPLE];
    filterTemplatesByTag(SAMPLE, 'culture');
    expect(SAMPLE).toEqual(original);
  });
});
