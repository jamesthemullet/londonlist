import { ApolloClient, ApolloProvider, InMemoryCache, HttpLink } from '@apollo/client';
import { AppProvider } from '../context/AppContext';
import fetch from 'cross-fetch';

import Layout from './../components/Layout';

const API_URL = process.env.STRAPI_URL || 'http://127.0.0.1:1337';

// Create a new HttpLink with the fetch option
const httpLink = new HttpLink({
  uri: `${API_URL}/graphql`,
  fetch,
});

export const client = new ApolloClient({
  link: httpLink,
  uri: `${API_URL}/graphql`,
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
