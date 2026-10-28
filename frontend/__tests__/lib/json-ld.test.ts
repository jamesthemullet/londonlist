import { safeJsonLd } from '../../lib/json-ld';

describe('safeJsonLd', () => {
  it('serialises a plain object as valid JSON', () => {
    const result = safeJsonLd({ '@type': 'WebSite', name: 'London List' });
    expect(JSON.parse(result)).toEqual({ '@type': 'WebSite', name: 'London List' });
  });

  it('escapes < so a </script> sequence cannot break out of a script tag', () => {
    const result = safeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(result).not.toContain('</script>');
    expect(result).toContain('\\u003c/script\\u003e');
    // Still valid JSON after escaping
    expect(JSON.parse(result).name).toBe('</script><script>alert(1)</script>');
  });

  it('escapes > and & as well', () => {
    const result = safeJsonLd({ name: 'A > B & C < D' });
    expect(result).not.toMatch(/[<>&]/);
    expect(JSON.parse(result).name).toBe('A > B & C < D');
  });

  it('handles nested objects and arrays', () => {
    const data = {
      '@type': 'ItemList',
      items: [{ name: 'Café <test>', position: 1 }],
    };
    const result = safeJsonLd(data);
    expect(result).not.toContain('<');
    const parsed = JSON.parse(result);
    expect(parsed.items[0].name).toBe('Café <test>');
  });
});
