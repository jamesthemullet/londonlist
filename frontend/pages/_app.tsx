import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import { AppProvider } from '../context/AppContext';

import Layout from '../components/layout/layout';
import '../styles/globals.css';
import 'leaflet/dist/leaflet.css';

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-plex-mono' });

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    mutate: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <AppProvider>
        {/* Font variables are applied to <html> too so portals and body inherit them */}
        <style jsx global>{`
          :root {
            --font-archivo: ${archivo.style.fontFamily};
            --font-plex-mono: ${plexMono.style.fontFamily};
          }
        `}</style>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppProvider>
    </ApolloProvider>
  );
}
