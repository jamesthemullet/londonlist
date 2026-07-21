import { gql } from '@apollo/client';
import Cookie from 'js-cookie';
import { createContext, useContext, useEffect, useState } from 'react';
import { client } from '../pages/_app';

type User = {
  id: string;
  documentId: string;
  email: string;
  username: string;
  isPro: boolean;
};

type AppContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  initialized: boolean;
};

type GetMeQueryData = {
  me: User | null;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userData = await getUser();
      setUser(userData);
      setInitialized(true);
    };
    fetchData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        initialized,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const getUser = async () => {
  const token = Cookie.get('token');
  if (!token) return null;
  const { data } = await client.query<GetMeQueryData>({
    query: gql`
      query {
        me {
          id
          documentId
          email
          username
          isPro
        }
      }
    `,
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  return (data as GetMeQueryData | null)?.me ?? null;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};
