import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import type { ReactNode } from 'react';
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

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactNode) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page: ReactNode) => <Layout>{page}</Layout>);
  return (
    <ApolloProvider client={client}>
      <AppProvider>
        {getLayout(<Component {...pageProps} />)}
      </AppProvider>
    </ApolloProvider>
  );
}
