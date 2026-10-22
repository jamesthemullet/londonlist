import { CATEGORY_META } from '../../lib/category-meta';
import type { CategoryMeta } from '../../lib/category-meta';

describe('CATEGORY_META', () => {
  it('contains at least 8 categories', () => {
    expect(Object.keys(CATEGORY_META).length).toBeGreaterThanOrEqual(8);
  });

  it('includes expected categories', () => {
    expect(CATEGORY_META).toHaveProperty('museum');
    expect(CATEGORY_META).toHaveProperty('restaurant');
    expect(CATEGORY_META).toHaveProperty('cafe');
    expect(CATEGORY_META).toHaveProperty('bar');
    expect(CATEGORY_META).toHaveProperty('park');
    expect(CATEGORY_META).toHaveProperty('gallery');
    expect(CATEGORY_META).toHaveProperty('theatre');
    expect(CATEGORY_META).toHaveProperty('cinema');
    expect(CATEGORY_META).toHaveProperty('hotel');
    expect(CATEGORY_META).toHaveProperty('library');
  });

  it('each category has a non-empty label, description, and emoji', () => {
    for (const [key, meta] of Object.entries(CATEGORY_META)) {
      const m = meta as CategoryMeta;
      expect(typeof m.label).toBe('string');
      expect(m.label.length).toBeGreaterThan(0);
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(0);
      expect(typeof m.emoji).toBe('string');
      expect(m.emoji.length).toBeGreaterThan(0);
      void key;
    }
  });

  it('museum has correct label', () => {
    expect(CATEGORY_META.museum.label).toBe('Museums');
  });

  it('restaurant has correct label', () => {
    expect(CATEGORY_META.restaurant.label).toBe('Restaurants');
  });

  it('park has an emoji', () => {
    expect(CATEGORY_META.park.emoji).toBeTruthy();
  });
});
