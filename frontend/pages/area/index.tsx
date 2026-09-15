import Head from "next/head";
import Link from "next/link";
import { useAppContext } from "../../context/AppContext";
import { AREA_META, encodeAreaSlug } from "../../lib/area-meta";
import styles from "./area.module.css";

const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL || "https://londonlist.vercel.app";

function buildAreaIndexJsonLd(siteUrl: string): object {
	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		name: "Browse London by Area",
		description:
			"Explore places across London's neighbourhoods and boroughs — museums, restaurants, parks, bars and more.",
		url: `${siteUrl}/area`,
	};
}

export default function AreaIndexPage() {
	const { user, initialized } = useAppContext();
	const areas = Object.entries(AREA_META);
	const jsonLd = buildAreaIndexJsonLd(SITE_URL);

	return (
		<>
			<Head>
				<title>Browse London by Area — London List</title>
				<meta
					name="description"
					content="Explore places across London's neighbourhoods and boroughs — museums, restaurants, parks, bars and more."
				/>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="canonical" href={`${SITE_URL}/area`} />
				<meta property="og:type" content="website" />
				<meta property="og:site_name" content="London List" />
				<meta
					property="og:title"
					content="Browse London by Area — London List"
				/>
				<meta
					property="og:description"
					content="Explore places across London's neighbourhoods and boroughs — museums, restaurants, parks, bars and more."
				/>
				<meta property="og:url" content={`${SITE_URL}/area`} />
				<meta property="og:locale" content="en_GB" />
				<meta name="twitter:card" content="summary" />
				<meta
					name="twitter:title"
					content="Browse London by Area — London List"
				/>
				<meta
					name="twitter:description"
					content="Explore places across London's neighbourhoods and boroughs."
				/>
				{jsonLd && (
					// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is server-generated; JSON.stringify output is XSS-safe
					<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
				)}
			</Head>
			<main className={styles.main}>
				<nav aria-label="Breadcrumb" className={styles.breadcrumb}>
					<Link href="/explore">Explore</Link>
					{" › "}
					<span aria-current="page">Browse by area</span>
				</nav>

				<div className={styles.hero}>
					<h1 className={styles.heading}>Browse London by Area</h1>
					<p className={styles.subheading}>
						Explore places across London&apos;s neighbourhoods and boroughs —
						museums, restaurants, parks, bars, and hidden gems.
					</p>
				</div>

				{initialized && !user && (
					<div className={styles.ctaBanner}>
						<p className={styles.ctaText}>
							Found somewhere you want to visit?{" "}
							<Link href="/register?ref=area-index">
								Build your own London list — it&apos;s free.
							</Link>
						</p>
					</div>
				)}

				<ul className={styles.grid} aria-label="London areas">
					{areas.map(([area, meta]) => (
						<li key={area}>
							<Link
								href={`/area/${encodeAreaSlug(area)}`}
								className={styles.card}
							>
								<span className={styles.emoji} aria-hidden="true">
									{meta.emoji}
								</span>
								<span className={styles.areaName}>{meta.label}</span>
								<span className={styles.areaDesc}>
									{meta.description.slice(0, 80)}…
								</span>
							</Link>
						</li>
					))}
				</ul>
			</main>
		</>
	);
}
