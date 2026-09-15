jest.mock("../../../context/AppContext", () => ({
	useAppContext: jest.fn(),
}));

jest.mock("next/head", () => ({
	__esModule: true,
	default: ({ children }: { children: unknown }) => children,
}));

jest.mock("next/link", () => ({
	__esModule: true,
	default: ({ children }: { children: unknown }) => children,
}));

import {
	AREA_META,
	AREA_SLUGS,
	decodeAreaSlug,
	encodeAreaSlug,
} from "../../../lib/area-meta";
import {
	buildAreaPageJsonLd,
	groupByCategory,
	type Place,
} from "../../../pages/area/[area]";

describe("encodeAreaSlug", () => {
	it("lowercases and hyphenates area names", () => {
		expect(encodeAreaSlug("South Bank")).toBe("south-bank");
	});

	it("handles single-word area names", () => {
		expect(encodeAreaSlug("Camden")).toBe("camden");
	});

	it("handles multi-word areas", () => {
		expect(encodeAreaSlug("Covent Garden")).toBe("covent-garden");
	});
});

describe("decodeAreaSlug", () => {
	it("resolves a hyphenated slug back to the canonical area key", () => {
		expect(decodeAreaSlug("south-bank")).toBe("South Bank");
	});

	it("resolves a lowercase single-word slug", () => {
		expect(decodeAreaSlug("camden")).toBe("Camden");
	});

	it("returns null for an unknown slug", () => {
		expect(decodeAreaSlug("atlantis")).toBeNull();
	});

	it("is case-insensitive", () => {
		expect(decodeAreaSlug("CAMDEN")).toBe("Camden");
	});
});

describe("AREA_META", () => {
	it("has a label, description, and emoji for every area", () => {
		for (const key of AREA_SLUGS) {
			const meta = AREA_META[key];
			expect(meta.label).toBeTruthy();
			expect(meta.description).toBeTruthy();
			expect(meta.emoji).toBeTruthy();
		}
	});

	it("contains at least 10 London areas", () => {
		expect(AREA_SLUGS.length).toBeGreaterThanOrEqual(10);
	});
});

describe("groupByCategory", () => {
	const places: Place[] = [
		{
			osm_id: "a",
			name: "British Museum",
			category: "museum",
			area: "Bloomsbury",
			lat: 51.5,
			lng: -0.12,
		},
		{
			osm_id: "b",
			name: "Tate Modern",
			category: "museum",
			area: "South Bank",
			lat: 51.5,
			lng: -0.1,
		},
		{
			osm_id: "c",
			name: "Hyde Park",
			category: "park",
			area: "Kensington",
			lat: 51.5,
			lng: -0.17,
		},
		{
			osm_id: "d",
			name: "Unknown Spot",
			category: null,
			area: null,
			lat: null,
			lng: null,
		},
	];

	it("groups places by category", () => {
		const grouped = groupByCategory(places);
		expect(grouped.museum).toHaveLength(2);
		expect(grouped.park).toHaveLength(1);
	});

	it('puts null-category places under "other"', () => {
		const grouped = groupByCategory(places);
		expect(grouped.other).toHaveLength(1);
		expect(grouped.other[0].name).toBe("Unknown Spot");
	});

	it("returns empty object for empty places array", () => {
		expect(groupByCategory([])).toEqual({});
	});
});

describe("buildAreaPageJsonLd", () => {
	const places: Place[] = [
		{
			osm_id: "a",
			name: "British Museum",
			category: "museum",
			area: "Bloomsbury",
			lat: 51.5,
			lng: -0.12,
		},
	];

	it("returns a schema.org CollectionPage", () => {
		const jsonLd = buildAreaPageJsonLd(
			"Bloomsbury",
			"Museums and squares.",
			places,
			"bloomsbury",
			"https://example.com",
		);
		expect((jsonLd as { "@type": string })["@type"]).toBe("CollectionPage");
	});

	it("includes the canonical URL", () => {
		const jsonLd = buildAreaPageJsonLd(
			"Bloomsbury",
			"Museums and squares.",
			places,
			"bloomsbury",
			"https://example.com",
		) as { url: string };
		expect(jsonLd.url).toBe("https://example.com/area/bloomsbury");
	});

	it("includes numberOfItems", () => {
		const jsonLd = buildAreaPageJsonLd(
			"Bloomsbury",
			"Museums and squares.",
			places,
			"bloomsbury",
			"https://example.com",
		) as { numberOfItems: number };
		expect(jsonLd.numberOfItems).toBe(1);
	});

	it("includes GeoCoordinates for places with lat/lng", () => {
		const jsonLd = buildAreaPageJsonLd(
			"Bloomsbury",
			"Museums.",
			places,
			"bloomsbury",
			"https://example.com",
		) as {
			hasPart: Array<{ "@type": string; geo?: { latitude: number } }>;
		};
		expect(jsonLd.hasPart[0].geo?.latitude).toBe(51.5);
	});

	it("omits geo for places without coordinates", () => {
		const noCoords: Place[] = [
			{
				osm_id: "x",
				name: "Mystery Spot",
				category: null,
				area: null,
				lat: null,
				lng: null,
			},
		];
		const jsonLd = buildAreaPageJsonLd(
			"Bloomsbury",
			"desc",
			noCoords,
			"bloomsbury",
			"https://example.com",
		) as {
			hasPart: Array<{ geo?: unknown }>;
		};
		expect(jsonLd.hasPart[0].geo).toBeUndefined();
	});
});
