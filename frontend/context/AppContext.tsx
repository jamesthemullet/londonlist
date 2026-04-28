import { useState, createContext, useContext, useEffect } from 'react';
import Cookie from 'js-cookie';
import { gql } from '@apollo/client';
import { client } from '../pages/_app';

type User = {
  id: string;
  documentId: string;
  email: string;
  username: string;
};

type AppContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
};

type GetMeQueryData = {
  me: User | null;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    fetchData();
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
      }}>
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
