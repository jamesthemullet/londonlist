import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { AppProvider } from '../context/AppContext';

import Layout from '../components/layout/layout';
import '../styles/globals.css';

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
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </AppProvider>
    </ApolloProvider>
  );
}
