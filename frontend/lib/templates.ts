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
  {
    id: 'london-art-galleries',
    name: 'London Art Galleries',
    description:
      'From Tate Britain to the Serpentine — world-class galleries beyond the big museums, most free to enter.',
    tags: ['galleries', 'art', 'culture'],
    items: [
      { osm_id: 'way/27382574', name: 'Tate Britain', category: 'gallery' },
      { osm_id: 'way/27375910', name: 'Royal Academy of Arts', category: 'gallery' },
      { osm_id: 'way/27592648', name: 'Serpentine Gallery', category: 'gallery' },
      { osm_id: 'way/27376044', name: 'Courtauld Gallery', category: 'gallery' },
      { osm_id: 'way/27376080', name: 'Hayward Gallery', category: 'gallery' },
      { osm_id: 'way/26972849', name: 'Whitechapel Gallery', category: 'gallery' },
      { osm_id: 'way/27376085', name: 'Barbican Art Gallery', category: 'gallery' },
      { osm_id: 'way/27376065', name: 'Saatchi Gallery', category: 'gallery' },
    ],
  },
  {
    id: 'historic-london-pubs',
    name: 'Historic London Pubs',
    description:
      "London's most storied pubs — centuries of history, ghost stories, and great beer in every corner.",
    tags: ['pubs', 'history', 'bars'],
    items: [
      { osm_id: 'way/26783035', name: 'The George Inn, Borough', category: 'bar' },
      { osm_id: 'way/27376090', name: 'Ye Olde Cheshire Cheese', category: 'bar' },
      { osm_id: 'way/27376092', name: 'The Lamb & Flag', category: 'bar' },
      { osm_id: 'way/26982190', name: 'The Prospect of Whitby', category: 'bar' },
      { osm_id: 'way/27428582', name: 'The Churchill Arms', category: 'bar' },
      { osm_id: 'way/27376096', name: 'The Black Friar', category: 'bar' },
      { osm_id: 'way/27392430', name: 'The Holly Bush, Hampstead', category: 'bar' },
      { osm_id: 'way/27376095', name: 'Ye Olde Watling', category: 'bar' },
    ],
  },
  {
    id: 'london-markets',
    name: 'London Markets Trail',
    description:
      'Street food, vintage fashion, antiques, and fresh produce — London\'s best markets from east to west.',
    tags: ['markets', 'street-food', 'shopping'],
    items: [
      { osm_id: 'way/27374645', name: 'Old Spitalfields Market', category: 'market' },
      { osm_id: 'way/28440200', name: 'Portobello Road Market', category: 'market' },
      { osm_id: 'way/27428588', name: 'Greenwich Market', category: 'market' },
      { osm_id: 'way/258826985', name: 'Maltby Street Market', category: 'market' },
      { osm_id: 'way/27376100', name: 'Leadenhall Market', category: 'market' },
      { osm_id: 'way/27375900', name: 'Covent Garden Market', category: 'market' },
      { osm_id: 'way/26785450', name: 'Brick Lane Market', category: 'market' },
      { osm_id: 'way/27375882', name: 'Camden Market', category: 'market' },
    ],
  },
  {
    id: 'west-end-theatres',
    name: 'West End Theatres',
    description:
      "The world's greatest concentration of live theatre — flagship venues from Covent Garden to Shaftesbury Avenue.",
    tags: ['theatre', 'west-end', 'culture'],
    items: [
      { osm_id: 'way/27376038', name: 'Theatre Royal Drury Lane', category: 'theatre' },
      { osm_id: 'way/27376040', name: 'Royal Opera House', category: 'theatre' },
      { osm_id: 'way/27375887', name: 'London Palladium', category: 'theatre' },
      { osm_id: 'way/27376042', name: 'Savoy Theatre', category: 'theatre' },
      { osm_id: 'way/27376035', name: 'Lyceum Theatre', category: 'theatre' },
      { osm_id: 'way/27375937', name: 'Apollo Theatre, Shaftesbury Avenue', category: 'theatre' },
      { osm_id: 'way/27375941', name: "Duke of York's Theatre", category: 'theatre' },
      { osm_id: 'way/27375903', name: "Her Majesty's Theatre", category: 'theatre' },
    ],
  },
  {
    id: 'afternoon-tea-london',
    name: 'Afternoon Tea in London',
    description:
      'The quintessential London experience — finger sandwiches, scones, and impeccable patisserie at the city\'s finest venues.',
    tags: ['afternoon-tea', 'luxury', 'cafes'],
    items: [
      { osm_id: 'way/27376010', name: "Claridge's", category: 'hotel' },
      { osm_id: 'way/27375939', name: 'The Ritz', category: 'hotel' },
      { osm_id: 'way/27376012', name: 'The Dorchester', category: 'hotel' },
      { osm_id: 'way/27375945', name: 'Fortnum & Mason', category: 'cafe' },
      { osm_id: 'way/27376015', name: 'The Wolseley', category: 'cafe' },
      { osm_id: 'way/27376018', name: "Brown's Hotel", category: 'hotel' },
      { osm_id: 'way/27376022', name: 'The Langham', category: 'hotel' },
      { osm_id: 'way/27375948', name: "Bea's of Bloomsbury", category: 'cafe' },
    ],
  },
];
