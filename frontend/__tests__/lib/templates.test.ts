import { TEMPLATES } from '../../lib/templates';
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
