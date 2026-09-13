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
  {
    id: 'london-parks-trail',
    name: 'London Parks Trail',
    description:
      "From royal deer parks to wild heathland — London's best green spaces, all in one list.",
    tags: ['parks', 'outdoor', 'nature'],
    items: [
      { osm_id: 'relation/271048', name: 'Hyde Park', category: 'park' },
      { osm_id: 'relation/177378', name: "Regent's Park", category: 'park' },
      { osm_id: 'relation/1544818', name: 'Greenwich Park', category: 'park' },
      { osm_id: 'relation/271079', name: 'Hampstead Heath', category: 'park' },
      { osm_id: 'relation/1543147', name: 'Richmond Park', category: 'park' },
      { osm_id: 'relation/1544811', name: "St James's Park", category: 'park' },
      { osm_id: 'relation/1538129', name: 'Victoria Park', category: 'park' },
      { osm_id: 'relation/1546042', name: 'Kew Gardens', category: 'park' },
    ],
  },
  {
    id: 'south-london-gems',
    name: 'South London Gems',
    description:
      "Brixton, Peckham, Bermondsey and beyond — South London's independent scene at its finest.",
    tags: ['south london', 'local', 'independent'],
    items: [
      { osm_id: 'way/4244026', name: 'Brixton Village Market', category: 'market' },
      { osm_id: 'relation/1590016', name: 'Crystal Palace Park', category: 'park' },
      { osm_id: 'way/27382576', name: 'Dulwich Picture Gallery', category: 'gallery' },
      { osm_id: 'way/25439680', name: "Shakespeare's Globe", category: 'theatre' },
      { osm_id: 'way/32506851', name: 'Peckham Rye Park', category: 'park' },
      { osm_id: 'way/27428592', name: 'The Old Vic', category: 'theatre' },
      { osm_id: 'way/27382580', name: 'Bermondsey Antique Market', category: 'market' },
      { osm_id: 'way/27428596', name: 'O2 Academy Brixton', category: 'entertainment' },
    ],
  },
  {
    id: 'london-live-music-bars',
    name: 'London Live Music & Bars',
    description:
      "Jazz caves, legendary venues, and iconic pubs — London's best spots for a proper night out.",
    tags: ['nightlife', 'music', 'bars'],
    items: [
      { osm_id: 'way/27376082', name: "Ronnie Scott's Jazz Club", category: 'bar' },
      { osm_id: 'way/27376101', name: '100 Club', category: 'entertainment' },
      { osm_id: 'way/27376050', name: 'Fabric', category: 'entertainment' },
      { osm_id: 'way/27402138', name: 'The Jazz Cafe', category: 'bar' },
      { osm_id: 'way/26979132', name: 'Crate Brewery', category: 'pub' },
      { osm_id: 'way/27428595', name: 'EartH Hackney', category: 'entertainment' },
      { osm_id: 'way/27376060', name: 'Koko Camden', category: 'entertainment' },
      { osm_id: 'way/26783010', name: 'The Anchor Bankside', category: 'pub' },
    ],
  },
  {
    id: 'family-london',
    name: 'Family Day Out in London',
    description:
      'The ultimate London day out with kids — hands-on museums, wildlife, and endless wonder.',
    tags: ['family', 'kids', 'activities'],
    items: [
      { osm_id: 'relation/1536787', name: 'Natural History Museum', category: 'museum' },
      { osm_id: 'relation/1544822', name: 'London Zoo', category: 'attraction' },
      { osm_id: 'relation/1536786', name: 'Science Museum', category: 'museum' },
      { osm_id: 'way/27428598', name: 'London Eye', category: 'attraction' },
      { osm_id: 'relation/1536784', name: 'Buckingham Palace', category: 'attraction' },
      { osm_id: 'way/36168209', name: 'V&A Museum of Childhood', category: 'museum' },
      { osm_id: 'way/27392445', name: 'Diana Memorial Playground', category: 'park' },
      { osm_id: 'relation/1546042', name: 'Kew Gardens', category: 'park' },
    ],
  },
];
