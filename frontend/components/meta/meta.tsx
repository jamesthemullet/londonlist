import Head from 'next/head';
import { buildOgImageUrl } from '../../lib/og-image';

export default function Meta({ currentUrl }: { currentUrl: string }) {
  const siteAddress = 'https://londonlist.vercel.app';
  const defaultImageUrl = buildOgImageUrl({ title: 'London List' }, siteAddress);
  const description = 'Your to-do list for London — find curated lists of things to do in London';
  return (
    <Head>
      <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#000000" />
      <link rel="shortcut icon" href="/favicon/favicon.ico" />
      <title>London List</title>
      <meta charSet="utf-8" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="msapplication-config" content="/favicon/browserconfig.xml" />
      <meta name="theme-color" content="#000" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" key="description" content={description} />
      <meta property="og:locale" key="og:locale" content="en_GB" />
      <meta property="og:type" key="og:type" content="website" />
      <meta property="og:title" key="og:title" content="London List" />
      <meta property="og:description" key="og:description" content={description} />
      <meta property="og:site_name" key="og:site_name" content="London List" />
      <meta property="og:url" key="og:url" content={`${siteAddress}${currentUrl}`} />
      <meta property="og:image" key="og:image" content={defaultImageUrl} />
    </Head>
  );
}
