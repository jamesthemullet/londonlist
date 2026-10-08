import type { GetServerSideProps } from 'next';
import dynamic from 'next/dynamic';
import type { MapItem } from '../../components/map/list-map';

const TEST_ITEMS: MapItem[] = [
  {
    documentId: 'item_tate_modern',
    name: 'Tate Modern',
    lat: 51.5076,
    lng: -0.0994,
    completed: false,
    category: 'museum',
  },
  {
    documentId: 'item_borough_market',
    name: 'Borough Market',
    lat: 51.5055,
    lng: -0.0906,
    completed: true,
    category: 'market',
  },
];

const ListMap = dynamic(() => import('../../components/map/list-map'), { ssr: false });

export const getServerSideProps: GetServerSideProps = async () => {
  if (process.env.NODE_ENV === 'production') {
    return { notFound: true };
  }
  return { props: {} };
};

export default function TestListMapPage() {
  return (
    <main style={{ padding: '16px' }}>
      <ListMap items={TEST_ITEMS} />
    </main>
  );
}
