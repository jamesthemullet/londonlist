import { AREA_META, encodeAreaSlug } from "./area-meta";
import { CATEGORY_META } from "./category-meta";
import { TEMPLATES } from "./templates";

export type SitemapEntry = {
	loc: string;
	changefreq:
		| "always"
		| "hourly"
		| "daily"
		| "weekly"
		| "monthly"
		| "yearly"
		| "never";
	priority: string;
	lastmod?: string;
};

export type PublicListForSitemap = {
	documentId: string;
	username: string | null;
};

export type PublicPlaceForSitemap = {
	osm_id: string;
};

const TEMPLATE_DETAIL_PAGES: SitemapEntry[] = TEMPLATES.map((t) => ({
	loc: `/templates/${t.id}`,
	changefreq: "monthly",
	priority: "0.6",
}));

const AREA_DETAIL_PAGES: SitemapEntry[] = Object.keys(AREA_META).map(
	(area) => ({
		loc: `/area/${encodeAreaSlug(area)}`,
		changefreq: "weekly",
		priority: "0.7",
	}),
);

const CATEGORY_PAGES: SitemapEntry[] = Object.keys(CATEGORY_META).map((cat) => ({
	loc: `/explore/${cat}`,
	changefreq: "weekly",
	priority: "0.7",
}));

const STATIC_PAGES: SitemapEntry[] = [
	{ loc: "/", changefreq: "daily", priority: "1.0" },
	{ loc: "/explore", changefreq: "daily", priority: "0.9" },
	{ loc: "/templates", changefreq: "weekly", priority: "0.7" },
	...TEMPLATE_DETAIL_PAGES,
	{ loc: "/pricing", changefreq: "monthly", priority: "0.8" },
	{ loc: "/register", changefreq: "monthly", priority: "0.5" },
	{ loc: "/login", changefreq: "monthly", priority: "0.3" },
	{ loc: "/area", changefreq: "weekly", priority: "0.8" },
	...AREA_DETAIL_PAGES,
	...CATEGORY_PAGES,
];

const OSM_ID_RE = /^\w+\/\d+$/;

export function buildSitemapEntries(
	lists: PublicListForSitemap[],
	places: PublicPlaceForSitemap[] = [],
): SitemapEntry[] {
	const withUsername = lists.filter((l) => l.username !== null);

	const listEntries: SitemapEntry[] = withUsername.map((l) => ({
		loc: `/list/${l.username}/${l.documentId}`,
		changefreq: "weekly",
		priority: "0.7",
	}));

	const uniqueUsernames = [
		...new Set(withUsername.map((l) => l.username as string)),
	];
	const profileEntries: SitemapEntry[] = uniqueUsernames.map((username) => ({
		loc: `/profile/${username}`,
		changefreq: "weekly",
		priority: "0.6",
	}));

	const placeEntries: SitemapEntry[] = places
		.filter((p) => OSM_ID_RE.test(p.osm_id))
		.map((p) => ({
			loc: `/place/${p.osm_id}`,
			changefreq: "monthly" as const,
			priority: "0.5",
		}));

	return [...STATIC_PAGES, ...profileEntries, ...listEntries, ...placeEntries];
}

export function generateSitemapXml(
	entries: SitemapEntry[],
	siteUrl: string,
): string {
	const urls = entries
		.map((entry) => {
			const lastmod = entry.lastmod
				? `\n    <lastmod>${entry.lastmod}</lastmod>`
				: "";
			return `  <url>
    <loc>${siteUrl}${entry.loc}</loc>${lastmod}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
