export type CategoryMeta = {
	label: string;
	description: string;
	emoji: string;
};

export const CATEGORY_META: Record<string, CategoryMeta> = {
	museum: {
		label: 'Museums',
		description:
			'Curated museum trails and collection guides across London — from the V&A to the British Museum.',
		emoji: '🏛️',
	},
	restaurant: {
		label: 'Restaurants',
		description:
			'London restaurant lists — from neighbourhood favourites to Michelin-starred dining.',
		emoji: '🍽️',
	},
	cafe: {
		label: 'Cafes',
		description:
			'Coffee shop trails and café guides for London — independent spots, roasters, and hidden gems.',
		emoji: '☕',
	},
	bar: {
		label: 'Bars & Pubs',
		description:
			'London bar and pub lists — from Victorian boozers to craft beer bars and cocktail dens.',
		emoji: '🍺',
	},
	park: {
		label: 'Parks & Green Spaces',
		description:
			'London park and garden lists — from Hyde Park to lesser-known green escapes.',
		emoji: '🌳',
	},
	gallery: {
		label: 'Art Galleries',
		description:
			'Art gallery trails in London — from the Tate Modern to independent exhibition spaces.',
		emoji: '🖼️',
	},
	theatre: {
		label: 'Theatres',
		description:
			'Theatre and performing arts venue lists for London — West End, fringe, and beyond.',
		emoji: '🎭',
	},
	cinema: {
		label: 'Cinemas',
		description:
			'Cinema venue lists in London — arthouse screens, luxury cinemas, and film club picks.',
		emoji: '🎬',
	},
	hotel: {
		label: 'Hotels',
		description:
			'London hotel and accommodation lists — boutique stays, budget finds, and local picks.',
		emoji: '🏨',
	},
	library: {
		label: 'Libraries',
		description:
			'Library and reading room lists in London — from the British Library to neighbourhood gems.',
		emoji: '📚',
	},
};
