export type TemplateItem = {
  osm_id: string;
  name: string;
  category: string | null;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  items: TemplateItem[];
};

export const TEMPLATES: Template[] = [
  {
    id: 'london-weekend-icons',
    name: 'London Weekend Icons',
    description:
      'The essential first-timer list — iconic landmarks, markets, and viewpoints that make London unforgettable.',
    tags: ['landmarks', 'markets', 'views'],
    items: [
      { osm_id: 'relation/1525018', name: 'British Museum', category: 'museum' },
      { osm_id: 'relation/1536791', name: 'Tower of London', category: 'attraction' },
      { osm_id: 'way/60381740', name: 'Borough Market', category: 'market' },
      { osm_id: 'relation/1536778', name: "St Paul's Cathedral", category: 'attraction' },
      { osm_id: 'way/181906740', name: 'The Shard Viewing Gallery', category: 'attraction' },
      { osm_id: 'relation/271048', name: 'Hyde Park', category: 'park' },
      { osm_id: 'way/28540143', name: 'National Gallery', category: 'museum' },
      { osm_id: 'relation/1536784', name: 'Buckingham Palace', category: 'attraction' },
    ],
  },
  {
    id: 'london-museum-trail',
    name: 'London Museum Trail',
    description:
      'World-class museums under one sky — from natural history to modern art, all free to enter.',
    tags: ['museums', 'culture', 'free'],
    items: [
      { osm_id: 'relation/1536787', name: 'Natural History Museum', category: 'museum' },
      { osm_id: 'relation/1536785', name: 'Victoria and Albert Museum', category: 'museum' },
      { osm_id: 'relation/1536786', name: 'Science Museum', category: 'museum' },
      { osm_id: 'relation/1525018', name: 'British Museum', category: 'museum' },
      { osm_id: 'way/28407974', name: 'Tate Modern', category: 'museum' },
      { osm_id: 'way/28540143', name: 'National Gallery', category: 'museum' },
      { osm_id: 'way/27382567', name: 'National Portrait Gallery', category: 'museum' },
      { osm_id: 'way/252087', name: 'Wellcome Collection', category: 'museum' },
    ],
  },
  {
    id: 'hidden-gems-east-london',
    name: 'Hidden Gems: East London',
    description:
      "East London's best-kept secrets — creative markets, neon-lit warehouses, and historic pubs off the tourist trail.",
    tags: ['east london', 'markets', 'quirky'],
    items: [
      { osm_id: 'way/26985757', name: 'Columbia Road Flower Market', category: 'market' },
      { osm_id: 'way/27428581', name: "Dennis Severs' House", category: 'attraction' },
      { osm_id: 'way/27219813', name: "Wilton's Music Hall", category: 'entertainment' },
      { osm_id: 'way/26786042', name: 'Broadway Market', category: 'market' },
      { osm_id: 'way/309820261', name: "God's Own Junkyard", category: 'attraction' },
      { osm_id: 'way/26979132', name: 'Crate Brewery', category: 'pub' },
      { osm_id: 'way/27428600', name: 'Netil Market', category: 'market' },
      { osm_id: 'way/36168209', name: 'Bethnal Green Museum of Childhood', category: 'museum' },
    ],
  },
  {
    id: 'london-food-trail',
    name: 'London Food & Drink Trail',
    description:
      'A curated foodie tour — legendary restaurants, beloved cafés, and pubs with proper character.',
    tags: ['food', 'restaurants', 'pubs'],
    items: [
      { osm_id: 'way/60381740', name: 'Borough Market', category: 'market' },
      { osm_id: 'way/27374680', name: 'Dishoom Shoreditch', category: 'restaurant' },
      { osm_id: 'way/27200493', name: 'St John Restaurant', category: 'restaurant' },
      { osm_id: 'way/27428550', name: 'Bao Fitzrovia', category: 'restaurant' },
      { osm_id: 'way/26785430', name: 'Padella Borough', category: 'restaurant' },
      { osm_id: 'way/27428555', name: 'Gymkhana Mayfair', category: 'restaurant' },
      { osm_id: 'way/27428560', name: 'Roti King Euston', category: 'restaurant' },
      { osm_id: 'way/26783010', name: 'The Anchor Bankside', category: 'pub' },
    ],
  },
];
