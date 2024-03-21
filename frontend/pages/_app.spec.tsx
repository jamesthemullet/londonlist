import { act, render, screen } from '@testing-library/react';
import React from 'react';
import App from './_app';
import { NextRouter, useRouter } from 'next/router';

global.fetch = require('jest-fetch-mock');

type AppProps = {
  Component: React.ComponentType;
  pageProps: Record<string, any>;
  router: any;
};

const useRouterMock = useRouter as jest.MockedFunction<typeof useRouter>;

jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: jest.fn()
}));

const pageContent = 'test content';

describe('App tests', () => {
  beforeEach(() => {
    useRouterMock.mockReturnValue({
      basePath: '',
      isLocaleDomain: false,
      push: async () => true,
      replace: async () => true,
      reload: () => null,
      back: () => null,
      prefetch: async () => null,
      beforePopState: () => null,
      isFallback: false,
      events: {
        on: () => null,
        off: () => null,
        emit: () => null
      },
      isReady: true,
      isPreview: false
    } as unknown as NextRouter);
  });
  it('should create an app', async () => {
    const props: AppProps = {
      Component: () => <div>{pageContent}</div>,
      pageProps: { session: {} },
      router: {}
    };

    await act(async () => {
      render(<App {...props} />);
    });
    expect(screen.queryByText('test content')).toBeInTheDocument();
  });
});
