import {
	AREA_META,
	AREA_SLUGS,
	decodeAreaSlug,
	encodeAreaSlug,
} from "../../lib/area-meta";

describe("AREA_META completeness", () => {
	it("every key in AREA_SLUGS maps to an entry in AREA_META", () => {
		for (const slug of AREA_SLUGS) {
			expect(AREA_META[slug]).toBeDefined();
		}
	});

	it("every AREA_META entry has non-empty label, description, and emoji", () => {
		for (const [, meta] of Object.entries(AREA_META)) {
			expect(meta.label).toBeTruthy();
			expect(meta.description).toBeTruthy();
			expect(meta.emoji).toBeTruthy();
		}
	});
});

describe("encodeAreaSlug / decodeAreaSlug round-trip", () => {
	it("round-trips every area in AREA_META", () => {
		for (const area of AREA_SLUGS) {
			const slug = encodeAreaSlug(area);
			const decoded = decodeAreaSlug(slug);
			expect(decoded).toBe(area);
		}
	});
});
