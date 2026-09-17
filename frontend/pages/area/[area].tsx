import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useAppContext } from "../../context/AppContext";
import { AREA_META, decodeAreaSlug } from "../../lib/area-meta";
import styles from "./area.module.css";

const API_URL = process.env.STRAPI_URL || "http://127.0.0.1:1337";
const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://londonlist.vercel.app";

const PLACES_BY_AREA_QUERY = `
  query GetPlacesByArea($area: String!) {
    placesByArea(area: $area) {
      osm_id
      name
      category
      area
      lat
      lng
    }
  }
`;

export type Place = {
	osm_id: string;
	name: string;
	category: string | null;
	area: string | null;
	lat: number | null;
	lng: number | null;
};

export function groupByCategory(places: Place[]): Record<string, Place[]> {
	const grouped: Record<string, Place[]> = {};
	for (const place of places) {
		const key = place.category ?? "other";
		if (!grouped[key]) grouped[key] = [];
		grouped[key].push(place);
	}
	return grouped;
}

export function buildAreaPageJsonLd(
	areaLabel: string,
	description: string,
	places: Place[],
	slug: string,
	siteUrl: string,
): object {
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: `Places in ${areaLabel} — London List`,
		description,
		url: `${siteUrl}/area/${slug}`,
		numberOfItems: places.length,
		hasPart: places.slice(0, 20).map((p) => ({
			"@type": "TouristAttraction",
			name: p.name,
			...(p.lat && p.lng
				? {
						geo: {
							"@type": "GeoCoordinates",
							latitude: p.lat,
							longitude: p.lng,
						},
					}
				: {}),
		})),
	};
}

type Props = {
	places: Place[];
	areaSlug: string;
	areaLabel: string;
	areaDescription: string;
};

export default function AreaPage({
	places,
	areaSlug,
	areaLabel,
	areaDescription,
}: Props) {
	const { user, initialized } = useAppContext();
	const grouped = groupByCategory(places);
	const categories = Object.keys(grouped).sort();
	const canonicalUrl = `${SITE_URL}/area/${areaSlug}`;
	const pageTitle = `Places in ${areaLabel} — London List`;
	const jsonLd = buildAreaPageJsonLd(
		areaLabel,
		areaDescription,
		places,
		areaSlug,
		SITE_URL,
	);

	return (
		<>
			<Head>
				<title>{pageTitle}</title>
				<meta name="description" content={areaDescription} />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="canonical" href={canonicalUrl} />
				<meta property="og:type" content="website" />
				<meta property="og:site_name" content="London List" />
				<meta property="og:title" content={pageTitle} />
				<meta property="og:description" content={areaDescription} />
				<meta property="og:url" content={canonicalUrl} />
				<meta property="og:locale" content="en_GB" />
				<meta name="twitter:card" content="summary" />
				<meta name="twitter:title" content={pageTitle} />
				<meta name="twitter:description" content={areaDescription} />
				{jsonLd && (
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
					<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
				)}
			</Head>
			<main className={styles.main}>
				<nav aria-label="Breadcrumb" className={styles.breadcrumb}>
					<Link href="/explore">Explore</Link>
					{" › "}
					<Link href="/area">Browse by area</Link>
					{" › "}
					<span aria-current="page">{areaLabel}</span>
				</nav>

				<div className={styles.hero}>
					<h1 className={styles.heading}>Places in {areaLabel}</h1>
					<p className={styles.subheading}>{areaDescription}</p>
				</div>

				{initialized && !user && (
					<div className={styles.ctaBanner}>
						<p className={styles.ctaText}>
							See somewhere you want to visit?{" "}
							<Link href={`/register?ref=area-${areaSlug}`}>
								Add it to your London list — it&apos;s free.
							</Link>
						</p>
					</div>
				)}

				{places.length === 0 ? (
					<div className={styles.empty}>
						<p>No places saved in {areaLabel} yet.</p>
						<p>
							<Link href="/register?ref=area-empty">
								Be the first to add places here.
							</Link>
						</p>
					</div>
				) : (
					<>
						<p className={styles.count} aria-live="polite">
							{places.length} {places.length === 1 ? "place" : "places"} in{" "}
							{areaLabel}
						</p>
						{categories.map((category) => (
							<section key={category} className={styles.categorySection}>
								<h2 className={styles.categoryHeading}>
									{category.charAt(0).toUpperCase() + category.slice(1)}
									<span className={styles.categoryCount}>
										{" "}
										({grouped[category].length})
									</span>
								</h2>
								<ul className={styles.placeList}>
									{grouped[category].map((place) => (
										<li key={place.osm_id} className={styles.placeItem}>
											<span className={styles.placeName}>{place.name}</span>
										</li>
									))}
								</ul>
							</section>
						))}
					</>
				)}

				<div className={styles.exploreLinks}>
					<Link href="/area" className={styles.backLink}>
						← All London areas
					</Link>
					<Link href="/explore" className={styles.exploreLink}>
						Browse all public lists →
					</Link>
				</div>
			</main>
		</>
	);
}

export const getServerSideProps: GetServerSideProps<Props> = async (
	context,
) => {
	const { area: areaSlug } = context.params as { area: string };

	const areaKey = decodeAreaSlug(areaSlug);
	if (!areaKey) {
		return { notFound: true };
	}

	const meta = AREA_META[areaKey];
	if (!meta) {
		return { notFound: true };
	}

	try {
		const res = await fetch(`${API_URL}/graphql`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: PLACES_BY_AREA_QUERY,
				variables: { area: areaKey },
			}),
			signal: AbortSignal.timeout(5000),
		});

		if (!res.ok) {
			return {
				props: {
					places: [],
					areaSlug,
					areaLabel: meta.label,
					areaDescription: meta.description,
				},
			};
		}

		const json = await res.json();
		const places: Place[] = json?.data?.placesByArea ?? [];

		return {
			props: {
				places,
				areaSlug,
				areaLabel: meta.label,
				areaDescription: meta.description,
			},
		};
	} catch {
		return {
			props: {
				places: [],
				areaSlug,
				areaLabel: meta.label,
				areaDescription: meta.description,
			},
		};
	}
};
