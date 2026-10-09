export type AreaMeta = {
	label: string;
	description: string;
	emoji: string;
};

export const AREA_META: Record<string, AreaMeta> = {
	Bloomsbury: {
		label: "Bloomsbury",
		description:
			"Museums, bookshops, and Georgian squares — Bloomsbury is London's intellectual heartland, home to the British Museum and UCL.",
		emoji: "📚",
	},
	Camden: {
		label: "Camden",
		description:
			"Markets, live music, and alternative culture — Camden's canal-side energy makes it one of London's most distinctive neighbourhoods.",
		emoji: "🎸",
	},
	Shoreditch: {
		label: "Shoreditch",
		description:
			"Street art, vintage shops, and a buzzing food scene — Shoreditch is East London's creative hub.",
		emoji: "🎨",
	},
	Hackney: {
		label: "Hackney",
		description:
			"Parks, independent cafés, and vibrant communities — Hackney blends green space with East London grit.",
		emoji: "🌿",
	},
	"South Bank": {
		label: "South Bank",
		description:
			"Tate Modern, the Globe, and riverside walks — the South Bank is London's culture and performance heartland.",
		emoji: "🎭",
	},
	Mayfair: {
		label: "Mayfair",
		description:
			"Luxury hotels, fine dining, and world-class galleries — Mayfair is London's most prestigious postcode.",
		emoji: "🏛️",
	},
	Soho: {
		label: "Soho",
		description:
			"Restaurants, bars, and independent cinemas — Soho is the beating heart of London's nightlife and food scene.",
		emoji: "🍽️",
	},
	"Covent Garden": {
		label: "Covent Garden",
		description:
			"Street performers, boutique shopping, and the Royal Opera House — Covent Garden never sleeps.",
		emoji: "🎪",
	},
	"Notting Hill": {
		label: "Notting Hill",
		description:
			"Portobello Road Market, pastel townhouses, and indie boutiques — Notting Hill is London at its most colourful.",
		emoji: "🌸",
	},
	Greenwich: {
		label: "Greenwich",
		description:
			"The Prime Meridian, a royal park, and maritime heritage — Greenwich rewards a leisurely afternoon.",
		emoji: "⚓",
	},
	Kensington: {
		label: "Kensington",
		description:
			"Natural History Museum, Hyde Park, and the V&A — Kensington is London's cultural and green-space quarter.",
		emoji: "🦕",
	},
	Chelsea: {
		label: "Chelsea",
		description:
			"King's Road, the Chelsea Physic Garden, and riverside walks — Chelsea mixes heritage with contemporary flair.",
		emoji: "🌺",
	},
	Islington: {
		label: "Islington",
		description:
			"Upper Street, the Union Chapel, and independent theatres — Islington is North London's most characterful borough.",
		emoji: "🎶",
	},
	Brixton: {
		label: "Brixton",
		description:
			"Brixton Market, live music venues, and Caribbean food — Brixton is one of London's most vibrant communities.",
		emoji: "🎵",
	},
	Peckham: {
		label: "Peckham",
		description:
			"Rooftop bars, independent galleries, and a thriving food scene — Peckham is South London's rising star.",
		emoji: "🌅",
	},
	Bermondsey: {
		label: "Bermondsey",
		description:
			"The Bermondsey Antique Market, craft breweries, and the Maltby Street Market — a foodie's weekend destination.",
		emoji: "🍺",
	},
	"East London": {
		label: "East London",
		description:
			"Columbia Road Market, Victoria Park, and Canary Wharf — East London spans everything from flowers to finance.",
		emoji: "🌺",
	},
	Dalston: {
		label: "Dalston",
		description:
			"Late-night bars, independent cinemas, and Caribbean restaurants — Dalston is East London's nightlife capital.",
		emoji: "🌙",
	},
	Fitzrovia: {
		label: "Fitzrovia",
		description:
			"Boutique restaurants, the Fitzroy Tavern, and London's media scene — Fitzrovia sits between Soho and Bloomsbury.",
		emoji: "🍷",
	},
	Clerkenwell: {
		label: "Clerkenwell",
		description:
			"Design studios, Exmouth Market, and medieval history — Clerkenwell is London's design-world heartland.",
		emoji: "⚙️",
	},
};

export const AREA_SLUGS = Object.keys(AREA_META);

export function encodeAreaSlug(area: string): string {
	return encodeURIComponent(area.toLowerCase().replace(/\s+/g, "-"));
}

export function decodeAreaSlug(slug: string): string | null {
	const decoded = decodeURIComponent(slug.replace(/-/g, " "));
	const match = AREA_SLUGS.find(
		(a) => a.toLowerCase() === decoded.toLowerCase(),
	);
	return match ?? null;
}
